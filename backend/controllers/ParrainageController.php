<?php
/**
 * Contrôleur Parrainage
 */

require_once __DIR__ . '/../models/Parrainage.php';

class ParrainageController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Parrainage($this->db);
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
     * GET /api/client/parrainage/mes-stats
     */
    public function mesStats()
    {
        try {
            $client = $this->verifierClient();
            
            // Assurer que le client a bien un code
            $this->model->assurerCodeParrainage($client['id']);

            $stats = $this->model->mesStats($client['id']);
            $parrainages = $this->model->mesParrainages($client['id']);
            $config = $this->model->getConfig();

            echo json_encode([
                'success' => true,
                'stats' => $stats,
                'parrainages' => $parrainages,
                'config' => [
                    'bonus_parrain' => floatval($config['bonus_parrain']),
                    'bonus_filleul' => floatval($config['bonus_filleul']),
                    'max_parrainages' => intval($config['max_parrainages']),
                ],
            ]);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/parrainage/verifier-code?code=XXX (PUBLIC)
     * Vérifier si un code est valide
     */
    public function verifierCode()
    {
        try {
            $code = strtoupper(trim($_GET['code'] ?? ''));

            if (empty($code)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Code requis']);
                return;
            }

            $stmt = $this->db->prepare("
                SELECT id, nom FROM clients WHERE code_parrainage = ?
            ");
            $stmt->execute([$code]);
            $parrain = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$parrain) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Code de parrainage invalide']);
                return;
            }

            $config = $this->model->getConfig();

            echo json_encode([
                'success' => true,
                'parrain' => [
                    'nom' => $parrain['nom'],
                ],
                'bonus_filleul' => floatval($config['bonus_filleul']),
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // ADMIN
    // =====================================================

    /**
     * GET /api/parrainage/admin/liste
     */
    public function listeAdmin()
    {
        try {
            $this->verifierAdmin();

            $filtres = [
                'statut' => $_GET['statut'] ?? null,
                'recherche' => $_GET['recherche'] ?? null,
            ];

            $parrainages = $this->model->liste($filtres);
            $stats = $this->model->statsGlobales();

            echo json_encode([
                'success' => true,
                'parrainages' => $parrainages,
                'stats' => $stats,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/parrainage/admin/valider
     */
    public function valider()
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

            $this->model->valider($id);

            echo json_encode(['success' => true, 'message' => 'Parrainage validé']);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/parrainage/admin/annuler
     */
    public function annuler()
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

            $this->model->annuler($id);

            echo json_encode(['success' => true, 'message' => 'Parrainage annulé']);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // AUTH
    // =====================================================

    private function verifierClient()
    {
        $headers = $this->recupererHeaders();
        $authHeader = $headers['authorization'] ?? $headers['Authorization'] ?? '';
        
        $token = '';
        if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
            $token = trim($matches[1]);
        }

        if (empty($token)) {
            throw new Exception('Token client manquant');
        }

        $stmt = $this->db->prepare("
            SELECT c.* 
            FROM clients_sessions cs
            JOIN clients c ON c.id = cs.client_id
            WHERE cs.token = ? AND cs.expire_le > NOW() AND c.actif = 1
        ");
        $stmt->execute([$token]);
        $client = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$client) {
            throw new Exception('Session invalide');
        }

        return $client;
    }

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