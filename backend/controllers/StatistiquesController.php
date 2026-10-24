<?php
require_once __DIR__ . '/../config/database.php';

class StatistiquesController {

    /**
     * Statistiques par période
     * GET /api/statistiques?periode=jour|semaine|mois
     */
    public function parPeriode() {
        $periode = $_GET['periode'] ?? 'jour';
        $db = (new Database())->getConnection();

        switch ($periode) {
            case 'semaine':
                $sql = "
                    SELECT
                        DATE(date_vente) AS date,
                        COUNT(*) AS nb_ventes,
                        SUM(montant) AS total
                    FROM ventes
                    WHERE date_vente >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                    GROUP BY DATE(date_vente)
                    ORDER BY date ASC
                ";
                break;

            case 'mois':
                $sql = "
                    SELECT
                        DATE(date_vente) AS date,
                        COUNT(*) AS nb_ventes,
                        SUM(montant) AS total
                    FROM ventes
                    WHERE date_vente >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                    GROUP BY DATE(date_vente)
                    ORDER BY date ASC
                ";
                break;

            case 'jour':
            default:
                $sql = "
                    SELECT
                        HOUR(date_vente) AS heure,
                        COUNT(*) AS nb_ventes,
                        SUM(montant) AS total
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
     * Résumé global (KPIs)
     * GET /api/statistiques/resume
     */
    public function resume() {
        $db = (new Database())->getConnection();

        $totalJour = $db->query("
            SELECT COALESCE(SUM(montant),0) FROM ventes
            WHERE DATE(date_vente) = CURDATE()
        ")->fetchColumn();

        $totalSemaine = $db->query("
            SELECT COALESCE(SUM(montant),0) FROM ventes
            WHERE date_vente >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ")->fetchColumn();

        $totalMois = $db->query("
            SELECT COALESCE(SUM(montant),0) FROM ventes
            WHERE date_vente >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ")->fetchColumn();

        $totalGlobal = $db->query("
            SELECT COALESCE(SUM(montant),0) FROM ventes
        ")->fetchColumn();

        $nbTicketsJour = $db->query("
            SELECT COUNT(*) FROM ventes WHERE DATE(date_vente) = CURDATE()
        ")->fetchColumn();

        $nbSessionsTotales = $db->query("
            SELECT COUNT(*) FROM sessions_wifi
        ")->fetchColumn();

        $nbClientsUniques = $db->query("
            SELECT COUNT(DISTINCT ticket_id) FROM ventes
        ")->fetchColumn();

        $forfaitPopulaire = $db->query("
            SELECT f.nom, COUNT(*) AS nb
            FROM ventes v
            JOIN tickets t ON t.id = v.ticket_id
            JOIN forfaits f ON f.id = t.forfait_id
            GROUP BY f.id
            ORDER BY nb DESC
            LIMIT 1
        ")->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "total_jour" => (int)$totalJour,
            "total_semaine" => (int)$totalSemaine,
            "total_mois" => (int)$totalMois,
            "total_global" => (int)$totalGlobal,
            "tickets_jour" => (int)$nbTicketsJour,
            "sessions_totales" => (int)$nbSessionsTotales,
            "clients_uniques" => (int)$nbClientsUniques,
            "forfait_populaire" => $forfaitPopulaire ? $forfaitPopulaire['nom'] : "—"
        ]);
    }

    /**
     * Top 5 des forfaits les plus vendus
     * GET /api/statistiques/top-forfaits
     */
    public function topForfaits() {
        $db = (new Database())->getConnection();
        $stmt = $db->query("
            SELECT
                f.nom,
                f.prix,
                COUNT(v.id) AS nb_ventes,
                COALESCE(SUM(v.montant),0) AS total
            FROM forfaits f
            LEFT JOIN tickets t ON t.forfait_id = f.id
            LEFT JOIN ventes v ON v.ticket_id = t.id
            GROUP BY f.id
            ORDER BY nb_ventes DESC
            LIMIT 5
        ");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}