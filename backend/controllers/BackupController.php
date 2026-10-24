<?php
require_once __DIR__ . '/../config/database.php';

class BackupController {

    private $backupDir;
    private $dbConfig;

    public function __construct() {
        $this->backupDir = __DIR__ . '/../backups';
        if (!is_dir($this->backupDir)) {
            mkdir($this->backupDir, 0777, true);
        }
        $this->dbConfig = [
            'host' => 'localhost',
            'name' => 'cybercafe_db',
            'user' => 'root',
            'pass' => ''
        ];
    }

    /**
     * Créer une sauvegarde SQL
     * POST /api/backup/creer
     * Body optionnel : { "type": "manuelle" | "automatique" }
     */
    public function creer() {
        $input = json_decode(file_get_contents("php://input"), true);
        $type = $input['type'] ?? 'manuelle';

        $date = date('Y-m-d_H-i-s');
        $nomFichier = "backup_cybercafe_{$date}.sql";
        $cheminFichier = $this->backupDir . '/' . $nomFichier;

        try {
            $db = (new Database())->getConnection();

            $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

            $sql = "-- ========================================\n";
            $sql .= "-- Sauvegarde Cyber Famille\n";
            $sql .= "-- Date : " . date('Y-m-d H:i:s') . "\n";
            $sql .= "-- Base : {$this->dbConfig['name']}\n";
            $sql .= "-- Type : $type\n";
            $sql .= "-- ========================================\n\n";
            $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

            foreach ($tables as $table) {
                $create = $db->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_ASSOC);
                $sql .= "-- ----------------------------\n";
                $sql .= "-- Table : $table\n";
                $sql .= "-- ----------------------------\n";
                $sql .= "DROP TABLE IF EXISTS `$table`;\n";
                $sql .= $create['Create Table'] . ";\n\n";

                $rows = $db->query("SELECT * FROM `$table`")->fetchAll(PDO::FETCH_ASSOC);
                if (!empty($rows)) {
                    $sql .= "INSERT INTO `$table` VALUES\n";
                    $values = [];
                    foreach ($rows as $row) {
                        $vals = array_map(function ($v) use ($db) {
                            if ($v === null) return 'NULL';
                            return $db->quote($v);
                        }, array_values($row));
                        $values[] = '(' . implode(', ', $vals) . ')';
                    }
                    $sql .= implode(",\n", $values) . ";\n\n";
                }
            }

            $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";

            file_put_contents($cheminFichier, $sql);
            $taille = filesize($cheminFichier);

            // Journaliser en base
            $stmt = $db->prepare("
                INSERT INTO sauvegardes (fichier, taille, type)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$nomFichier, $taille, $type]);

            // Nettoyage : garder les 20 dernières sauvegardes max
            $this->nettoyerAnciennes(20);

            echo json_encode([
                "success" => true,
                "fichier" => $nomFichier,
                "taille" => $taille,
                "date" => $date
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                "erreur" => "Échec de la sauvegarde",
                "detail" => $e->getMessage()
            ]);
        }
    }

    /**
     * Lister les sauvegardes
     * GET /api/backup/liste
     */
    public function liste() {
        $db = (new Database())->getConnection();

        // Chercher dans le dossier
        $fichiers = glob($this->backupDir . '/*.sql');
        $resultat = [];

        foreach ($fichiers as $f) {
            $nom = basename($f);
            $stmt = $db->prepare("SELECT type FROM sauvegardes WHERE fichier = ? LIMIT 1");
            $stmt->execute([$nom]);
            $type = $stmt->fetchColumn() ?: 'manuelle';

            $resultat[] = [
                "fichier" => $nom,
                "taille" => filesize($f),
                "date" => date('Y-m-d H:i:s', filemtime($f)),
                "type" => $type
            ];
        }

        usort($resultat, fn($a, $b) => strcmp($b['date'], $a['date']));

        echo json_encode($resultat);
    }

    /**
     * Télécharger une sauvegarde
     * GET /api/backup/telecharger?fichier=backup_xxx.sql
     */
    public function telecharger() {
        $fichier = basename($_GET['fichier'] ?? '');

        if (!$fichier || !preg_match('/^backup_cybercafe_[\w\-]+\.sql$/', $fichier)) {
            http_response_code(400);
            echo "Nom de fichier invalide";
            return;
        }

        $chemin = $this->backupDir . '/' . $fichier;
        if (!file_exists($chemin)) {
            http_response_code(404);
            echo "Fichier introuvable";
            return;
        }

        header('Content-Type: application/sql');
        header('Content-Disposition: attachment; filename="' . $fichier . '"');
        header('Content-Length: ' . filesize($chemin));
        readfile($chemin);
        exit;
    }

    /**
     * Supprimer une sauvegarde
     * POST /api/backup/supprimer
     */
    public function supprimer() {
        $data = json_decode(file_get_contents("php://input"), true);
        $fichier = basename($data['fichier'] ?? '');

        if (!$fichier || !preg_match('/^backup_cybercafe_[\w\-]+\.sql$/', $fichier)) {
            http_response_code(400);
            echo json_encode(["erreur" => "Nom de fichier invalide"]);
            return;
        }

        $chemin = $this->backupDir . '/' . $fichier;
        if (!file_exists($chemin)) {
            http_response_code(404);
            echo json_encode(["erreur" => "Fichier introuvable"]);
            return;
        }

        unlink($chemin);

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("DELETE FROM sauvegardes WHERE fichier = ?");
        $stmt->execute([$fichier]);

        echo json_encode(["success" => true]);
    }

    /**
     * Nettoyer les anciennes sauvegardes (garder les N plus récentes)
     */
    private function nettoyerAnciennes($max = 20) {
        $fichiers = glob($this->backupDir . '/*.sql');
        if (count($fichiers) <= $max) return;

        usort($fichiers, fn($a, $b) => filemtime($b) - filemtime($a));
        $aSupprimer = array_slice($fichiers, $max);

        $db = (new Database())->getConnection();
        foreach ($aSupprimer as $f) {
            $nom = basename($f);
            @unlink($f);
            $stmt = $db->prepare("DELETE FROM sauvegardes WHERE fichier = ?");
            $stmt->execute([$nom]);
        }
    }
}