<?php
require_once __DIR__ . '/../config/database.php';

class StatistiquesAvanceesController {

    /**
     * Graphique des revenus par période (jour/semaine/mois/année)
     * GET /api/statistiques/graphique?periode=jour|semaine|mois|annee
     */
    public function graphique() {
        $periode = $_GET['periode'] ?? 'jour';
        $db = (new Database())->getConnection();

        switch ($periode) {
            case 'semaine':
                $sql = "
                    SELECT 
                        DATE(date_vente) AS date,
                        DAYNAME(date_vente) AS jour_nom,
                        COUNT(*) AS nb_ventes,
                        COALESCE(SUM(montant), 0) AS total
                    FROM ventes
                    WHERE date_vente >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                    GROUP BY DATE(date_vente)
                    ORDER BY date ASC
                ";
                break;

            case 'mois':
                $sql = "
                    SELECT 
                        DATE(date_vente) AS date,
                        DAY(date_vente) AS jour,
                        COUNT(*) AS nb_ventes,
                        COALESCE(SUM(montant), 0) AS total
                    FROM ventes
                    WHERE date_vente >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                    GROUP BY DATE(date_vente)
                    ORDER BY date ASC
                ";
                break;

            case 'annee':
                $sql = "
                    SELECT 
                        DATE_FORMAT(date_vente, '%Y-%m') AS date,
                        MONTHNAME(date_vente) AS mois_nom,
                        COUNT(*) AS nb_ventes,
                        COALESCE(SUM(montant), 0) AS total
                    FROM ventes
                    WHERE YEAR(date_vente) = YEAR(CURDATE())
                    GROUP BY DATE_FORMAT(date_vente, '%Y-%m')
                    ORDER BY date ASC
                ";
                break;

            case 'jour':
            default:
                $sql = "
                    SELECT 
                        HOUR(date_vente) AS heure,
                        COUNT(*) AS nb_ventes,
                        COALESCE(SUM(montant), 0) AS total
                    FROM ventes
                    WHERE DATE(date_vente) = CURDATE()
                    GROUP BY HOUR(date_vente)
                    ORDER BY heure ASC
                ";
                break;
        }

        $stmt = $db->query($sql);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Prévisions de revenus (moyenne mobile + tendance)
     * GET /api/statistiques/previsions
     */
    public function previsions() {
        $db = (new Database())->getConnection();

        // Revenus des 30 derniers jours
        $stmt = $db->query("
            SELECT 
                DATE(date_vente) AS date,
                COALESCE(SUM(montant), 0) AS total
            FROM ventes
            WHERE date_vente >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(date_vente)
            ORDER BY date ASC
        ");
        $historique = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calcul moyenne
        $total = array_sum(array_column($historique, 'total'));
        $moyenne = count($historique) > 0 ? $total / count($historique) : 0;

        // Calcul tendance (linéaire simple)
        $n = count($historique);
        $tendance = 0;
        if ($n >= 2) {
            $premier = $historique[0]['total'];
            $dernier = $historique[$n - 1]['total'];
            $tendance = ($dernier - $premier) / $n;
        }

        // Prévisions pour 7 jours
        $previsions = [];
        for ($i = 1; $i <= 7; $i++) {
            $date = date('Y-m-d', strtotime("+$i day"));
            $valeur = max(0, $moyenne + ($tendance * $i));
            $previsions[] = [
                'date' => $date,
                'prevision' => round($valeur),
                'moyenne' => round($moyenne),
            ];
        }

        echo json_encode([
            'moyenne_jour' => round($moyenne),
            'tendance' => round($tendance),
            'previsions' => $previsions,
            'historique_jours' => $n,
        ]);
    }

    /**
     * Comparaison entre deux périodes
     * GET /api/statistiques/comparaison?debut1=...&fin1=...&debut2=...&fin2=...
     */
    public function comparaison() {
        $debut1 = $_GET['debut1'] ?? date('Y-m-d', strtotime('-7 day'));
        $fin1 = $_GET['fin1'] ?? date('Y-m-d');
        $debut2 = $_GET['debut2'] ?? date('Y-m-d', strtotime('-14 day'));
        $fin2 = $_GET['fin2'] ?? date('Y-m-d', strtotime('-7 day'));

        $db = (new Database())->getConnection();

        $stmt = $db->prepare("
            SELECT 
                COUNT(*) AS nb_ventes,
                COALESCE(SUM(montant), 0) AS total
            FROM ventes
            WHERE DATE(date_vente) BETWEEN ? AND ?
        ");

        $stmt->execute([$debut1, $fin1]);
        $periode1 = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt->execute([$debut2, $fin2]);
        $periode2 = $stmt->fetch(PDO::FETCH_ASSOC);

        // Calcul évolution
        $total1 = (int)$periode1['total'];
        $total2 = (int)$periode2['total'];
        $evolution = $total2 > 0 ? (($total1 - $total2) / $total2) * 100 : 0;

        echo json_encode([
            'periode1' => [
                'debut' => $debut1,
                'fin' => $fin1,
                'total' => $total1,
                'nb_ventes' => (int)$periode1['nb_ventes'],
            ],
            'periode2' => [
                'debut' => $debut2,
                'fin' => $fin2,
                'total' => $total2,
                'nb_ventes' => (int)$periode2['nb_ventes'],
            ],
            'evolution_pourcent' => round($evolution, 1),
        ]);
    }

    /**
     * Top 10 des clients (par nombre de tickets achetés)
     * GET /api/statistiques/top-clients
     */
    public function topClients() {
        $db = (new Database())->getConnection();

        $stmt = $db->query("
            SELECT 
                v.nom_client,
                v.telephone_client,
                COUNT(*) AS nb_achats,
                COALESCE(SUM(v.montant), 0) AS total_depense,
                MAX(v.date_vente) AS derniere_visite
            FROM ventes v
            WHERE v.nom_client IS NOT NULL AND v.nom_client != ''
            GROUP BY v.nom_client, v.telephone_client
            ORDER BY nb_achats DESC, total_depense DESC
            LIMIT 10
        ");

        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Heures de pointe (transactions par heure de la journée)
     * GET /api/statistiques/heures-pointe
     */
    public function heuresPointe() {
        $db = (new Database())->getConnection();

        $stmt = $db->query("
            SELECT 
                HOUR(date_vente) AS heure,
                COUNT(*) AS nb_ventes,
                COALESCE(SUM(montant), 0) AS total
            FROM ventes
            WHERE date_vente >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY HOUR(date_vente)
            ORDER BY nb_ventes DESC
            LIMIT 5
        ");

        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Répartition par forfait (camembert / pourcentage)
     * GET /api/statistiques/repartition-forfaits
     */
    public function repartitionForfaits() {
        $db = (new Database())->getConnection();

        $stmt = $db->query("
            SELECT 
                f.nom AS forfait,
                f.prix,
                COUNT(v.id) AS nb_ventes,
                COALESCE(SUM(v.montant), 0) AS total
            FROM forfaits f
            LEFT JOIN tickets t ON t.forfait_id = f.id
            LEFT JOIN ventes v ON v.ticket_id = t.id
            GROUP BY f.id
            ORDER BY total DESC
        ");

        $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calcul du pourcentage
        $totalGlobal = array_sum(array_column($resultats, 'total'));
        foreach ($resultats as &$r) {
            $r['pourcentage'] = $totalGlobal > 0 
                ? round(($r['total'] / $totalGlobal) * 100, 1) 
                : 0;
        }

        echo json_encode([
            'forfaits' => $resultats,
            'total_global' => $totalGlobal,
        ]);
    }

    /**
     * Revenus par jour de la semaine (Lundi à Dimanche)
     * GET /api/statistiques/jours-semaine
     */
    public function joursSemaine() {
        $db = (new Database())->getConnection();

        $stmt = $db->query("
            SELECT 
                DAYOFWEEK(date_vente) AS jour_num,
                DAYNAME(date_vente) AS jour_nom,
                COUNT(*) AS nb_ventes,
                COALESCE(SUM(montant), 0) AS total
            FROM ventes
            WHERE date_vente >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DAYOFWEEK(date_vente), DAYNAME(date_vente)
            ORDER BY jour_num ASC
        ");

        $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Traduire les noms de jours en français
        $traduction = [
            'Sunday' => 'Dimanche',
            'Monday' => 'Lundi',
            'Tuesday' => 'Mardi',
            'Wednesday' => 'Mercredi',
            'Thursday' => 'Jeudi',
            'Friday' => 'Vendredi',
            'Saturday' => 'Samedi',
        ];

        foreach ($resultats as &$r) {
            $r['jour_nom'] = $traduction[$r['jour_nom']] ?? $r['jour_nom'];
        }

        echo json_encode($resultats);
    }
}