<?php
require_once __DIR__ . '/../config/database.php';

class LogController {

    /**
     * Lister les 50 derniers logs
     * GET /api/logs
     */
    public function liste() {
        $db = (new Database())->getConnection();
        $stmt = $db->query("
            SELECT 
                l.id,
                l.action,
                l.details,
                l.ip,
                l.cree_le,
                a.nom AS admin_nom
            FROM logs l
            LEFT JOIN admins a ON a.id = l.admin_id
            ORDER BY l.cree_le DESC
            LIMIT 50
        ");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Enregistrer une action (appelée en interne)
     */
    public static function enregistrer($action, $details = '', $admin_id = null) {
        try {
            $db = (new Database())->getConnection();
            $ip = $_SERVER['REMOTE_ADDR'] ?? null;
            $stmt = $db->prepare("
                INSERT INTO logs (action, details, admin_id, ip)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$action, $details, $admin_id, $ip]);
            return true;
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Statistiques des logs
     * GET /api/logs/stats
     */
    public function stats() {
        $db = (new Database())->getConnection();
        
        $total = $db->query("SELECT COUNT(*) FROM logs")->fetchColumn();
        $aujourdhui = $db->query("
            SELECT COUNT(*) FROM logs WHERE DATE(cree_le) = CURDATE()
        ")->fetchColumn();
        
        $topActions = $db->query("
            SELECT action, COUNT(*) AS nb
            FROM logs
            WHERE cree_le >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY action
            ORDER BY nb DESC
            LIMIT 5
        ")->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "total" => (int)$total,
            "aujourdhui" => (int)$aujourdhui,
            "top_actions" => $topActions
        ]);
    }

    /**
     * Nettoyer les vieux logs (> 90 jours)
     * POST /api/logs/nettoyer
     */
    public function nettoyer() {
        $db = (new Database())->getConnection();
        $stmt = $db->exec("
            DELETE FROM logs WHERE cree_le < DATE_SUB(NOW(), INTERVAL 90 DAY)
        ");
        echo json_encode([
            "success" => true,
            "supprimes" => $stmt
        ]);
    }
}