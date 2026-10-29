<?php
/**
 * Contrôleur Portefeuille
 */

require_once __DIR__ . '/../models/Portefeuille.php';

class PortefeuilleController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Portefeuille($this->db);
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
    // CLIENT
    // =====================================================

    /**
     * GET /api/client/portefeuille
     */
    public function monPortefeuille()
    {
        try {
            $client = $this->verifierClient();

            // Assurer que le portefeuille existe
            $this->model->assurerPortefeuille($client['id']);

            $stats = $this->model->mesStats($client['id']);
            $config = $this->model->getConfig();
            $demandes = $this->model->mesDemandes($client['id'], 10);
            $transactions = $this->model->mesTransactions($client['id'], 30);

            echo json_encode([
                'success' => true,
                'stats' => $stats,
                'config' => $config,
                'demandes' => $demandes,
                'transactions' => $transactions,
                'solde_bonus' => floatval($client['solde_bonus'] ?? 0),
            ]);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/client/portefeuille/demander
     */
    public function demanderRechargement()
    {
        try {
            $client = $this->verifierClient();
            $data = json_decode(file_get_contents('php://input'), true);

            $demande = $this->model->creerDemande($client['id'], $data);

            echo json_encode([
                'success' => true,
                'message' => 'Demande envoyée. En attente de validation.',
                'demande' => $demande,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/client/portefeuille/demandes
     */
    public function mesDemandes()
    {
        try {
            $client = $this->verifierClient();
            $demandes = $this->model->mesDemandes($client['id'], 50);

            echo json_encode([
                'success' => true,
                'demandes' => $demandes,
            ]);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/client/portefeuille/transactions
     */
    public function mesTransactions()
    {
        try {
            $client = $this->verifierClient();
            $transactions = $this->model->mesTransactions($client['id'], 200);

            echo json_encode([
                'success' => true,
                'transactions' => $transactions,
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
     * GET /api/portefeuille/admin/stats
     */
    public function adminStats()
    {
        try {
            $this->verifierAdmin();

            $stats = $this->model->statsGlobales();
            $config = $this->model->getConfig();

            echo json_encode([
                'success' => true,
                'stats' => $stats,
                'config' => $config,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/portefeuille/admin/demandes
     */
    public function adminDemandes()
    {
        try {
            $this->verifierAdmin();

            $filtres = [
                'statut' => $_GET['statut'] ?? 'tous',
                'recherche' => $_GET['recherche'] ?? null,
                'limite' => isset($_GET['limite']) ? intval($_GET['limite']) : 100,
            ];

            $demandes = $this->model->toutesLesDemandes($filtres);

            echo json_encode([
                'success' => true,
                'demandes' => $demandes,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/portefeuille/admin/valider
     */
    public function adminValider()
    {
        try {
            $admin = $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            $demandeId = intval($data['demande_id'] ?? 0);
            $note = $data['note'] ?? null;

            if ($demandeId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID demande requis']);
                return;
            }

            $resultat = $this->model->validerDemande($demandeId, $admin['id'], $note);

            echo json_encode([
                'success' => true,
                'message' => 'Rechargement validé',
                'resultat' => $resultat,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/portefeuille/admin/rejeter
     */
    public function adminRejeter()
    {
        try {
            $admin = $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            $demandeId = intval($data['demande_id'] ?? 0);
            $raison = $data['raison'] ?? null;

            if ($demandeId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID demande requis']);
                return;
            }

            $this->model->rejeterDemande($demandeId, $admin['id'], $raison);

            echo json_encode([
                'success' => true,
                'message' => 'Demande rejetée',
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/portefeuille/admin/liste
     */
    public function adminListePortefeuilles()
    {
        try {
            $this->verifierAdmin();

            $filtres = [
                'recherche' => $_GET['recherche'] ?? null,
                'min_solde' => $_GET['min_solde'] ?? null,
                'limite' => isset($_GET['limite']) ? intval($_GET['limite']) : 100,
            ];

            $portefeuilles = $this->model->listePortefeuilles($filtres);

            echo json_encode([
                'success' => true,
                'portefeuilles' => $portefeuilles,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
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