<?php
require_once __DIR__ . '/../config/database.php';

class ForfaitController {
    public function liste() {
        $db = (new Database())->getConnection();
        $stmt = $db->query("SELECT id, nom, duree_minutes, prix FROM forfaits WHERE actif = 1 ORDER BY prix ASC");
        $forfaits = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($forfaits);
    }
}