<?php
require_once __DIR__ . '/../config/database.php';

class SessionsActivesController {

    /**
     * Lister les sessions actives
     * GET /api/sessions-actives
     */
    public function liste() {
        $db = (new Database())->getConnection();
        $stmt = $db->query("
            SELECT
                s.id,
                s.admin_id,
                s.device,
                s.ip,
                s.derniere_activite,
                s.cree_le,
                a.nom AS admin_nom,
                a.email AS admin_email,
                TIMESTAMPDIFF(MINUTE, s.derniere_activite, NOW()) AS minutes_inactif
            FROM sessions_actives s
            JOIN admins a ON a.id = s.admin_id
            WHERE s.derniere_activite >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY s.derniere_activite DESC
        ");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Révoquer une session
     * POST /api/sessions-actives/revoquer
     * Body : { session_id: 5 }
     */
    public function revoquer() {
        $data = json_decode(file_get_contents("php://input"), true);
        $session_id = (int)($data['session_id'] ?? 0);

        if (!$session_id) {
            http_response_code(400);
            echo json_encode(["erreur" => "session_id requis"]);
            return;
        }

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("DELETE FROM sessions_actives WHERE id = ?");
        $stmt->execute([$session_id]);

        echo json_encode(["success" => true]);
    }

    /**
     * Révoquer TOUTES les sessions sauf la mienne
     * POST /api/sessions-actives/revoquer-autres
     * Body : { admin_id: 1, token: "..." }
     */
    public function revoquerAutres() {
        $data = json_decode(file_get_contents("php://input"), true);
        $admin_id = (int)($data['admin_id'] ?? 0);
        $token = $data['token'] ?? '';

        if (!$admin_id) {
            http_response_code(400);
            echo json_encode(["erreur" => "admin_id requis"]);
            return;
        }

        $db = (new Database())->getConnection();
        if ($token) {
            $stmt = $db->prepare("
                DELETE FROM sessions_actives
                WHERE admin_id = ? AND token != ?
            ");
            $stmt->execute([$admin_id, $token]);
        } else {
            $stmt = $db->prepare("DELETE FROM sessions_actives WHERE admin_id = ?");
            $stmt->execute([$admin_id]);
        }

        echo json_encode(["success" => true]);
    }

    /**
     * Stats des sessions
     * GET /api/sessions-actives/stats
     */
    public function stats() {
        $db = (new Database())->getConnection();

        $total = $db->query("
            SELECT COUNT(*) FROM sessions_actives
            WHERE derniere_activite >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ")->fetchColumn();

        $actives = $db->query("
            SELECT COUNT(*) FROM sessions_actives
            WHERE derniere_activite >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
        ")->fetchColumn();

        $admins_uniques = $db->query("
            SELECT COUNT(DISTINCT admin_id) FROM sessions_actives
            WHERE derniere_activite >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ")->fetchColumn();

        echo json_encode([
            "total" => (int)$total,
            "actives" => (int)$actives,
            "admins_uniques" => (int)$admins_uniques
        ]);
    }

    /**
     * Nettoyer les vieilles sessions
     * POST /api/sessions-actives/nettoyer
     */
    public function nettoyer() {
        $db = (new Database())->getConnection();
        $stmt = $db->exec("
            DELETE FROM sessions_actives
            WHERE derniere_activite < DATE_SUB(NOW(), INTERVAL 7 DAY)
        ");
        echo json_encode(["success" => true, "supprimees" => $stmt]);
    }
}