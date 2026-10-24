<?php
require_once __DIR__ . '/../config/database.php';

class ParametresController {

    public function liste() {
        $db = (new Database())->getConnection();
        $stmt = $db->query("SELECT cle, valeur FROM parametres_systeme");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $parametres = [];
        foreach ($rows as $r) {
            $parametres[$r['cle']] = $r['valeur'];
        }

        echo json_encode($parametres);
    }

    public function sauvegarder() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!is_array($data) || empty($data)) {
            http_response_code(400);
            echo json_encode(["erreur" => "Données invalides"]);
            return;
        }

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("
            INSERT INTO parametres_systeme (cle, valeur) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE valeur = VALUES(valeur)
        ");

        foreach ($data as $cle => $valeur) {
            $stmt->execute([$cle, $valeur]);
        }

        echo json_encode(["success" => true]);
    }
}