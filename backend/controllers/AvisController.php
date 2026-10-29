<?php
/**
 * Contrôleur Avis
 */

require_once __DIR__ . '/../models/Avis.php';

class AvisController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Avis($this->db);
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

    // =====================================================
    // PUBLIC
    // =====================================================

    /**
     * GET /api/avis
     */
    public function listePublique()
    {
        try {
            $filtres = [
                'note' => $_GET['note'] ?? null,
                'service' => $_GET['service'] ?? null,
                'verifie_seulement' => !empty($_GET['verifie']),
                'limite' => isset($_GET['limite']) ? intval($_GET['limite']) : 50,
            ];

            $avis = $this->model->listePublique($filtres);
            $stats = $this->model->statsPubliques();

            echo json_encode([
                'success' => true,
                'avis' => $avis,
                'stats' => $stats,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/avis
     */
    public function creer()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            // Récupérer le client si connecté
            $client = null;
            try {
                $client = $this->verifierClientOptionnel();
            } catch (Exception $e) {
                $client = null;
            }

            $avis = $this->model->creer($data, $client);
            $config = $this->model->getConfig();

            echo json_encode([
                'success' => true,
                'message' => $config['message_merci'] ?? 'Merci pour votre avis !',
                'avis' => $avis,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/avis/utile
     */
    public function marquerUtile()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $avisId = intval($data['avis_id'] ?? 0);

            if ($avisId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID avis requis']);
                return;
            }

            $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            $utile = $this->model->marquerUtile($avisId, $ip);

            echo json_encode([
                'success' => true,
                'message' => 'Merci pour votre retour !',
                'utile' => $utile,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/avis/config
     */
    public function getConfig()
    {
        try {
            $config = $this->model->getConfig();
            echo json_encode(['success' => true, 'config' => $config]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // CLIENT
    // =====================================================

    /**
     * GET /api/client/avis/mes-avis
     */
    public function mesAvis()
    {
        try {
            $client = $this->verifierClient();
            $avis = $this->model->mesAvis($client['id']);

            echo json_encode([
                'success' => true,
                'avis' => $avis,
            ]);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // ADMIN
    // =====================================================

    /**
     * GET /api/avis/admin/liste
     */
    public function listeAdmin()
    {
        try {
            $this->verifierAdmin();

            $filtres = [
                'statut' => $_GET['statut'] ?? 'tous',
                'note' => $_GET['note'] ?? null,
                'recherche' => $_GET['recherche'] ?? null,
                'limite' => isset($_GET['limite']) ? intval($_GET['limite']) : 100,
            ];

            $avis = $this->model->listeAdmin($filtres);
            $stats = $this->model->statsAdmin();

            echo json_encode([
                'success' => true,
                'avis' => $avis,
                'stats' => $stats,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/avis/admin/valider
     */
    public function valider()
    {
        try {
            $admin = $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);
            $id = intval($data['id'] ?? 0);
            $reponse = $data['reponse'] ?? null;

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $this->model->valider($id, $admin['id'], $reponse);

            echo json_encode([
                'success' => true,
                'message' => 'Avis validé et publié',
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/avis/admin/rejeter
     */
    public function rejeter()
    {
        try {
            $admin = $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);
            $id = intval($data['id'] ?? 0);
            $raison = $data['raison'] ?? null;

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $this->model->rejeter($id, $admin['id'], $raison);

            echo json_encode([
                'success' => true,
                'message' => 'Avis rejeté',
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/avis/admin/repondre
     */
    public function repondre()
    {
        try {
            $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);
            $id = intval($data['id'] ?? 0);
            $reponse = trim($data['reponse'] ?? '');

            if ($id <= 0 || empty($reponse)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID et réponse requis']);
                return;
            }

            $this->model->repondre($id, $reponse);

            echo json_encode([
                'success' => true,
                'message' => 'Réponse enregistrée',
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/avis/admin/supprimer
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

            $this->model->supprimer($id);

            echo json_encode([
                'success' => true,
                'message' => 'Avis supprimé',
            ]);

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

    private function verifierClientOptionnel()
    {
        $headers = $this->recupererHeaders();
        $authHeader = $headers['authorization'] ?? $headers['Authorization'] ?? '';

        $token = '';
        if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
            $token = trim($matches[1]);
        }

        if (empty($token)) {
            return null;
        }

        $stmt = $this->db->prepare("
            SELECT c.* 
            FROM clients_sessions cs
            JOIN clients c ON c.id = cs.client_id
            WHERE cs.token = ? AND cs.expire_le > NOW() AND c.actif = 1
        ");
        $stmt->execute([$token]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
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