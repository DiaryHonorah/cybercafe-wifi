<?php
require_once __DIR__ . '/../config/database.php';

class DashboardController {

    /**
     * Statistiques générales
     * GET /api/dashboard
     */
    public function stats() {
        $db = (new Database())->getConnection();

        $ventesJour = $db->query("
            SELECT COALESCE(SUM(montant),0)
            FROM ventes
            WHERE DATE(date_vente) = CURDATE()
        ")->fetchColumn();

        $sessionsActives = $db->query("
            SELECT COUNT(*)
            FROM sessions_wifi
            WHERE statut = 'active' AND fin > NOW()
        ")->fetchColumn();

        $ticketsVendus = $db->query("
            SELECT COUNT(*)
            FROM ventes
            WHERE DATE(date_vente) = CURDATE()
        ")->fetchColumn();

        $ticketsDisponibles = $db->query("
            SELECT COUNT(*)
            FROM tickets
            WHERE statut = 'disponible'
        ")->fetchColumn();

        echo json_encode([
            "ventes_jour" => (int)$ventesJour,
            "sessions_actives" => (int)$sessionsActives,
            "tickets_vendus" => (int)$ticketsVendus,
            "tickets_disponibles" => (int)$ticketsDisponibles
        ]);
    }

    /**
     * Transactions récentes (5 dernières ventes)
     * GET /api/dashboard/transactions
     */
    public function transactions() {
        $db = (new Database())->getConnection();
        $stmt = $db->query("
            SELECT
                t.code,
                f.nom AS forfait,
                v.montant,
                v.date_vente
            FROM ventes v
            JOIN tickets t ON t.id = v.ticket_id
            JOIN forfaits f ON f.id = t.forfait_id
            ORDER BY v.date_vente DESC
            LIMIT 5
        ");
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($transactions);
    }

    /**
     * ⭐ Graphique des revenus par période
     * GET /api/dashboard/graphique?periode=jour|semaine|mois
     */
    public function graphique() {
        $periode = $_GET['periode'] ?? 'jour';
        $db = (new Database())->getConnection();

        switch ($periode) {
            case 'semaine':
                // 7 derniers jours
                $sql = "
                    SELECT
                        DATE(date_vente) AS date,
                        DAYNAME(date_vente) AS jour_nom,
                        COUNT(*) AS nb_ventes,
                        COALESCE(SUM(montant), 0) AS total
                    FROM ventes
                    WHERE date_vente >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                    GROUP BY DATE(date_vente), DAYNAME(date_vente)
                    ORDER BY date ASC
                ";
                break;

            case 'mois':
                // 30 derniers jours
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

            case 'jour':
            default:
                // Aujourd'hui par heure
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
        $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($resultats);
    }
}