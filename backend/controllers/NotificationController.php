<?php
require_once __DIR__ . '/../config/database.php';

class NotificationController {

    /**
     * Lister les 20 dernières notifications
     * GET /api/notifications
     */
    public function liste() {
        $db = (new Database())->getConnection();
        $stmt = $db->query("
            SELECT id, type, titre, message, lue, cree_le
            FROM notifications
            ORDER BY cree_le DESC
            LIMIT 20
        ");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Compter les notifications non lues
     * GET /api/notifications/non-lues
     */
    public function nonLues() {
        $db = (new Database())->getConnection();
        $count = $db->query("
            SELECT COUNT(*) FROM notifications WHERE lue = 0
        ")->fetchColumn();
        echo json_encode(["count" => (int)$count]);
    }

    /**
     * Marquer toutes les notifications comme lues
     * POST /api/notifications/lire
     */
    public function marquerLues() {
        $db = (new Database())->getConnection();
        $db->exec("UPDATE notifications SET lue = 1 WHERE lue = 0");
        echo json_encode(["success" => true]);
    }

    /**
     * Marquer une seule notification comme lue
     * POST /api/notifications/lire-une
     */
    public function marquerUne() {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = (int)($data['id'] ?? 0);

        if (!$id) {
            http_response_code(400);
            echo json_encode(["erreur" => "ID requis"]);
            return;
        }

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("UPDATE notifications SET lue = 1 WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(["success" => true]);
    }

    /**
     * Créer une notification (utilitaire interne)
     */
    public static function creer($type, $titre, $message = '') {
        try {
            $db = (new Database())->getConnection();
            $stmt = $db->prepare("
                INSERT INTO notifications (type, titre, message)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$type, $titre, $message]);
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
}