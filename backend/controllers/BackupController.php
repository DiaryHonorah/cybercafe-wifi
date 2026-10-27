<?php
/**
 * Contrôleur Backup
 * Gère les sauvegardes (manuelles + automatiques)
 */

require_once __DIR__ . '/../services/BackupService.php';

class BackupController
{
    private $db;
    private $service;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->service = new BackupService($this->db);
    }

    private function connecter()
    {
        $configPath = __DIR__ . '/../config/database.php';
        if (!file_exists($configPath)) {
            throw new Exception("Fichier config/database.php introuvable");
        }
        require_once $configPath;
        if (class_exists('Database')) {
            $database = new Database();
            return $database->getConnection();
        }
        throw new Exception("Classe Database introuvable");
    }

    /**
     * POST /api/backup/creer
     */
    public function creer()
    {
        try {
            $admin = $this->verifierAdmin();
            
            $resultat = $this->service->creerBackup('manuel', $admin['id']);

            echo json_encode([
                'success' => true,
                'message' => 'Sauvegarde créée avec succès',
                'backup' => $resultat,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/backup/liste
     */
    public function liste()
    {
        try {
            $this->verifierAdmin();
            
            $backups = $this->service->liste();
            $stats = $this->service->stats();

            echo json_encode([
                'success' => true,
                'backups' => $backups,
                'stats' => $stats,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/backup/telecharger?id=X
     */
    public function telecharger()
    {
        try {
            $this->verifierAdmin();
            
            $id = intval($_GET['id'] ?? 0);
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $backup = $this->service->telecharger($id);

            // Envoyer le fichier
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $backup['nom'] . '"');
            header('Content-Length: ' . $backup['taille']);
            readfile($backup['chemin']);
            exit;

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/backup/supprimer
     */
    public function supprimer()
    {
        try {
            $this->verifierAdmin();
            
            $data = json_decode(file_get_contents('php://input'), true);
            $id = intval($data['id'] ?? 0);

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $this->service->supprimer($id);

            echo json_encode([
                'success' => true,
                'message' => 'Backup supprimé',
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/backup/config
     */
    public function getConfig()
    {
        try {
            $this->verifierAdmin();

            $stmt = $this->db->query("SELECT * FROM backups_config LIMIT 1");
            $config = $stmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'config' => $config]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/backup/config
     */
    public function saveConfig()
    {
        try {
            $this->verifierAdmin();

            $data = json_decode(file_get_contents('php://input'), true);
            $this->service->sauvegarderConfig($data);

            echo json_encode([
                'success' => true,
                'message' => 'Configuration sauvegardée',
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/backup/auto
     * Appelé par cron ou à chaque visite admin
     */
    public function auto()
    {
        try {
            if (!$this->service->doitFaireBackupAuto()) {
                echo json_encode(['success' => true, 'message' => 'Pas de backup nécessaire']);
                return;
            }

            $resultat = $this->service->creerBackup('automatique');

            echo json_encode([
                'success' => true,
                'message' => 'Backup automatique créé',
                'backup' => $resultat,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // AUTHENTIFICATION
    // =====================================================

    private function verifierAdmin()
    {
        $headers = $this->recupererHeaders();
        $authHeader = $headers['authorization'] ?? $headers['Authorization'] ?? '';

        $token = '';
        if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
            $token = trim($matches[1]);
        }

        if (empty($token)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Token manquant']);
            exit;
        }

        $stmt = $this->db->prepare("
            SELECT a.id, a.nom, a.email, a.role
            FROM sessions_admin s
            JOIN admins a ON a.id = s.admin_id
            WHERE s.token = ? AND s.expire_le > NOW()
        ");
        $stmt->execute([$token]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$admin) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Token invalide']);
            exit;
        }

        return $admin;
    }

    private function recupererHeaders()
    {
        if (function_exists('getallheaders')) {
            return getallheaders();
        }
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) === 'HTTP_') {
                $headerName = str_replace(' ', '-', ucwords(
                    strtolower(str_replace('_', ' ', substr($name, 5)))
                ));
                $headers[$headerName] = $value;
            }
        }
        return $headers;
    }
}