<?php
require_once __DIR__ . '/../config/database.php';

class StatsTempsReelController {

    /**
     * Comparaison aujourd'hui vs hier
     * GET /api/stats-temps-reel/comparaison
     */
    public function comparaison() {
        $db = (new Database())->getConnection();

        // Aujourd'hui
        $stmt = $db->query("
            SELECT
                COUNT(*) AS nb_ventes,
                COALESCE(SUM(montant), 0) AS total,
                COUNT(DISTINCT ticket_id) AS nb_tickets
            FROM ventes
            WHERE DATE(date_vente) = CURDATE()
        ");
        $aujourdhui = $stmt->fetch(PDO::FETCH_ASSOC);

        // Hier
        $stmt = $db->query("
            SELECT
                COUNT(*) AS nb_ventes,
                COALESCE(SUM(montant), 0) AS total,
                COUNT(DISTINCT ticket_id) AS nb_tickets
            FROM ventes
            WHERE DATE(date_vente) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        ");
        $hier = $stmt->fetch(PDO::FETCH_ASSOC);

        // Calcul des évolutions
        $evolVentes = $hier['total'] > 0
            ? (($aujourdhui['total'] - $hier['total']) / $hier['total']) * 100
            : ($aujourdhui['total'] > 0 ? 100 : 0);

        $evolTickets = $hier['nb_tickets'] > 0
            ? (($aujourdhui['nb_tickets'] - $hier['nb_tickets']) / $hier['nb_tickets']) * 100
            : ($aujourdhui['nb_tickets'] > 0 ? 100 : 0);

        echo json_encode([
            "aujourdhui" => [
                "total" => (int)$aujourdhui['total'],
                "nb_ventes" => (int)$aujourdhui['nb_ventes'],
                "nb_tickets" => (int)$aujourdhui['nb_tickets']
            ],
            "hier" => [
                "total" => (int)$hier['total'],
                "nb_ventes" => (int)$hier['nb_ventes'],
                "nb_tickets" => (int)$hier['nb_tickets']
            ],
            "evolution_ventes" => round($evolVentes, 1),
            "evolution_tickets" => round($evolTickets, 1)
        ]);
    }

    /**
     * Top 5 des meilleures heures de la journée
     * GET /api/stats-temps-reel/top-heures
     */
    public function topHeures() {
        $db = (new Database())->getConnection();

        $stmt = $db->query("
            SELECT
                HOUR(date_vente) AS heure,
                COUNT(*) AS nb_ventes,
                COALESCE(SUM(montant), 0) AS total
            FROM ventes
            WHERE DATE(date_vente) = CURDATE()
            GROUP BY HOUR(date_vente)
            ORDER BY total DESC
            LIMIT 5
        ");

        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Flux temps réel : ventes des 5 dernières minutes
     * GET /api/stats-temps-reel/flux
     */
    public function flux() {
        $db = (new Database())->getConnection();

        $stmt = $db->query("
            SELECT
                v.id,
                t.code,
                f.nom AS forfait,
                v.montant,
                v.date_vente
            FROM ventes v
            JOIN tickets t ON t.id = v.ticket_id
            JOIN forfaits f ON f.id = t.forfait_id
            WHERE v.date_vente >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
            ORDER BY v.date_vente DESC
            LIMIT 10
        ");

        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Alertes : détection d'anomalies
     * GET /api/stats-temps-reel/alertes
     */
    public function alertes() {
        $db = (new Database())->getConnection();
        $alertes = [];

        // 1. Vérifier les sessions qui expirent dans 5 minutes
        $stmt = $db->query("
            SELECT COUNT(*) FROM sessions_wifi
            WHERE statut = 'active'
              AND fin BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 5 MINUTE)
        ");
        $expirent = (int)$stmt->fetchColumn();
        if ($expirent > 0) {
            $alertes[] = [
                "type" => "warn",
                "icone" => "⏰",
                "titre" => "Sessions qui expirent bientôt",
                "message" => "$expirent session(s) expire(nt) dans moins de 5 minutes"
            ];
        }

        // 2. Vérifier les tickets disponibles bas
        $stmt = $db->query("
            SELECT COUNT(*) FROM tickets WHERE statut = 'disponible'
        ");
        $disponibles = (int)$stmt->fetchColumn();
        if ($disponibles < 5) {
            $alertes[] = [
                "type" => "danger",
                "icone" => "🎫",
                "titre" => "Stock de tickets faible",
                "message" => "Seulement $disponibles ticket(s) disponible(s)"
            ];
        }

        // 3. Comparer les ventes avec la moyenne hebdomadaire
        $stmt = $db->query("
            SELECT COALESCE(AVG(total), 0) FROM (
                SELECT SUM(montant) AS total
                FROM ventes
                WHERE date_vente >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                  AND DATE(date_vente) < CURDATE()
                GROUP BY DATE(date_vente)
            ) AS moyennes
        ");
        $moyenne = (float)$stmt->fetchColumn();

        $stmt = $db->query("
            SELECT COALESCE(SUM(montant), 0)
            FROM ventes
            WHERE DATE(date_vente) = CURDATE()
        ");
        $aujourdhui = (float)$stmt->fetchColumn();

        if ($moyenne > 0 && $aujourdhui < ($moyenne * 0.5)) {
            $alertes[] = [
                "type" => "warn",
                "icone" => "📉",
                "titre" => "Ventes faibles aujourd'hui",
                "message" => "Vous êtes en dessous de la moyenne hebdomadaire"
            ];
        } elseif ($moyenne > 0 && $aujourdhui > ($moyenne * 1.5)) {
            $alertes[] = [
                "type" => "success",
                "icone" => "📈",
                "titre" => "Excellentes ventes !",
                "message" => "Vous dépassez la moyenne hebdomadaire de +50%"
            ];
        }

        // 4. Sessions actives
        $stmt = $db->query("
            SELECT COUNT(*) FROM sessions_wifi WHERE statut = 'active'
        ");
        $actives = (int)$stmt->fetchColumn();
        if ($actives > 0) {
            $alertes[] = [
                "type" => "info",
                "icone" => "🌐",
                "titre" => "Clients connectés",
                "message" => "$actives client(s) actif(s) en ce moment"
            ];
        }

        echo json_encode($alertes);
    }

    /**
     * Résumé temps réel (pour le header)
     * GET /api/stats-temps-reel/resume
     */
    public function resume() {
        $db = (new Database())->getConnection();

        $ventesJour = (int)$db->query("
            SELECT COALESCE(SUM(montant), 0)
            FROM ventes
            WHERE DATE(date_vente) = CURDATE()
        ")->fetchColumn();

        $sessionsActives = (int)$db->query("
            SELECT COUNT(*) FROM sessions_wifi
            WHERE statut = 'active' AND fin > NOW()
        ")->fetchColumn();

        $ticketsDispo = (int)$db->query("
            SELECT COUNT(*) FROM tickets WHERE statut = 'disponible'
        ")->fetchColumn();

        $derniereVente = $db->query("
            SELECT date_vente FROM ventes
            ORDER BY date_vente DESC LIMIT 1
        ")->fetchColumn();

        echo json_encode([
            "ventes_jour" => $ventesJour,
            "sessions_actives" => $sessionsActives,
            "tickets_disponibles" => $ticketsDispo,
            "derniere_vente" => $derniereVente,
            "timestamp" => date('Y-m-d H:i:s')
        ]);
    }
}