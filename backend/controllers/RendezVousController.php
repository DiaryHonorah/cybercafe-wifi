<?php
/**
 * Contrôleur RendezVous
 */

require_once __DIR__ . '/../models/RendezVous.php';

class RendezVousController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new RendezVous($this->db);
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
     * GET /api/rdv/config
     */
    public function getConfig()
    {
        try {
            $config = $this->model->getConfig();
            $services = $this->model->getServices();

            echo json_encode([
                'success' => true,
                'config' => $config,
                'services' => $services,
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/rdv/creneaux?date=YYYY-MM-DD&service_id=X
     */
    public function creneaux()
    {
        try {
            $date = $_GET['date'] ?? date('Y-m-d');
            $serviceId = isset($_GET['service_id']) ? intval($_GET['service_id']) : null;

            $creneaux = $this->model->getCreneauxDisponibles($date, $serviceId);

            echo json_encode([
                'success' => true,
                'date' => $date,
                'creneaux' => $creneaux,
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/rdv
     */
    public function creer()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            // Client optionnel (connecté)
            $clientId = null;
            $headers = $this->recupererHeaders();
            $authHeader = $headers['authorization'] ?? $headers['Authorization'] ?? '';
            if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
                $token = trim($matches[1]);
                $stmt = $this->db->prepare("
                    SELECT c.id FROM clients_sessions cs
                    JOIN clients c ON c.id = cs.client_id
                    WHERE cs.token = ? AND cs.expire_le > NOW() AND c.actif = 1
                ");
                $stmt->execute([$token]);
                $clientId = $stmt->fetchColumn() ?: null;
            }

            $rdv = $this->model->creer($data, $clientId);

            echo json_encode([
                'success' => true,
                'message' => 'Rendez-vous enregistré',
                'rdv' => $rdv,
            ]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/rdv/detail?reference=RDV-XXXX
     */
    public function detail()
    {
        try {
            $reference = $_GET['reference'] ?? '';
            if (empty($reference)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Référence requise']);
                return;
            }

            $rdv = $this->model->trouverParReference($reference);
            if (!$rdv) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Rendez-vous introuvable']);
                return;
            }

            echo json_encode(['success' => true, 'rdv' => $rdv]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // CLIENT
    // =====================================================

    /**
     * GET /api/client/rdv/mes-rdv
     */
    public function mesRdv()
    {
        try {
            $client = $this->verifierClient();
            $rdv = $this->model->mesRdv($client['id']);

            echo json_encode([
                'success' => true,
                'rdv' => $rdv,
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
     * GET /api/rdv/admin/liste
     */
    public function listeAdmin()
    {
        try {
            $this->verifierAdmin();

            $filtres = [
                'statut' => $_GET['statut'] ?? 'tous',
                'date' => $_GET['date'] ?? null,
                'date_debut' => $_GET['date_debut'] ?? null,
                'date_fin' => $_GET['date_fin'] ?? null,
                'recherche' => $_GET['recherche'] ?? null,
                'limite' => isset($_GET['limite']) ? intval($_GET['limite']) : 200,
            ];

            $rdv = $this->model->listeAdmin($filtres);
            $stats = $this->model->statsAdmin();

            echo json_encode([
                'success' => true,
                'rdv' => $rdv,
                'stats' => $stats,
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/rdv/admin/statut
     */
    public function changerStatut()
    {
        try {
            $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            $id = intval($data['id'] ?? 0);
            $statut = $data['statut'] ?? '';
            $raison = $data['raison'] ?? null;
            $notes = $data['notes'] ?? null;

            if ($id <= 0 || empty($statut)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID et statut requis']);
                return;
            }

            $this->model->changerStatut($id, $statut, $raison, $notes);

            echo json_encode(['success' => true, 'message' => 'Statut mis à jour']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/rdv/admin/supprimer
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

            echo json_encode(['success' => true, 'message' => 'RDV supprimé']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/rdv/admin/services
     */
    public function listeServices()
    {
        try {
            $this->verifierAdmin();
            $services = $this->model->getServices();

            echo json_encode(['success' => true, 'services' => $services]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/rdv/admin/services/creer
     */
    public function creerService()
    {
        try {
            $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $this->model->creerService($data);

            echo json_encode(['success' => true, 'id' => $id]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/rdv/admin/services/modifier
     */
    public function modifierService()
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

            $this->model->modifierService($id, $data);

            echo json_encode(['success' => true, 'message' => 'Service modifié']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/rdv/admin/services/supprimer
     */
    public function supprimerService()
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

            $this->model->supprimerService($id);

            echo json_encode(['success' => true, 'message' => 'Service supprimé']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/rdv/admin/config
     */
    public function adminGetConfig()
    {
        try {
            $this->verifierAdmin();
            $config = $this->model->getConfig();

            echo json_encode(['success' => true, 'config' => $config]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/rdv/admin/config
     */
    public function adminSaveConfig()
    {
        try {
            $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            $this->model->updateConfig($data);

            echo json_encode(['success' => true, 'message' => 'Configuration sauvegardée']);
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

        if (empty($token)) throw new Exception('Token client manquant');

        $stmt = $this->db->prepare("
            SELECT c.* FROM clients_sessions cs
            JOIN clients c ON c.id = cs.client_id
            WHERE cs.token = ? AND cs.expire_le > NOW() AND c.actif = 1
        ");
        $stmt->execute([$token]);
        $client = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$client) throw new Exception('Session invalide');
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