<?php
/**
 * Contrôleur Sms
 */

require_once __DIR__ . '/../models/Sms.php';

class SmsController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Sms($this->db);
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
     * GET /api/sms/admin/config
     */
    public function getConfig()
    {
        try {
            $this->verifierAdmin();
            $config = $this->model->getConfig();

            echo json_encode([
                'success' => true,
                'config' => $config,
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/sms/admin/config
     */
    public function saveConfig()
    {
        try {
            $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            $this->model->updateConfig($data);

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
     * POST /api/sms/admin/test
     * Envoie un SMS de test
     */
    public function envoyerTest()
    {
        try {
            $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            $telephone = $data['telephone'] ?? '';
            $message = $data['message'] ?? 'Test SMS depuis Cyber Famille. Si vous recevez ce message, la configuration est correcte !';

            if (empty($telephone)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Téléphone requis']);
                return;
            }

            $resultat = $this->model->envoyer($telephone, $message, 'autre', null);

            if ($resultat) {
                echo json_encode([
                    'success' => true,
                    'message' => 'SMS envoyé (ou simulé avec succès)',
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => "Échec de l'envoi. Vérifiez la configuration.",
                ]);
            }
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/sms/admin/historique
     */
    public function getHistorique()
    {
        try {
            $this->verifierAdmin();
            $limite = isset($_GET['limite']) ? intval($_GET['limite']) : 100;

            $historique = $this->model->getHistorique($limite);
            $stats = $this->model->getStats();

            echo json_encode([
                'success' => true,
                'historique' => $historique,
                'stats' => $stats,
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/sms/admin/envoyer-manuel
     */
    public function envoyerManuel()
    {
        try {
            $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            $telephone = $data['telephone'] ?? '';
            $message = $data['message'] ?? '';

            if (empty($telephone) || empty($message)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Téléphone et message requis']);
                return;
            }

            $resultat = $this->model->envoyer($telephone, $message, 'autre', null);

            if ($resultat) {
                echo json_encode([
                    'success' => true,
                    'message' => 'SMS envoyé',
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => "Échec de l'envoi.",
                ]);
            }
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // AUTH
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
        if (function_exists('getallheaders')) return getallheaders();
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