<?php
/**
 * Contrôleur Roue
 */

require_once __DIR__ . '/../models/Roue.php';

class RoueController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Roue($this->db);
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
     * GET /api/client/roue/etat
     */
    public function etat()
    {
        try {
            $client = $this->verifierClient();

            $config = $this->model->getConfig();
            $lots = $this->model->listeLots();
            $peutJouer = $this->model->peutJouer($client['id']);
            $historique = $this->model->monHistorique($client['id'], 5);

            echo json_encode([
                'success' => true,
                'config' => $config,
                'lots' => $lots,
                'peut_jouer' => $peutJouer,
                'historique' => $historique,
                'solde_bonus' => floatval($client['solde_bonus'] ?? 0),
            ]);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/client/roue/jouer
     */
    public function jouer()
    {
        try {
            $client = $this->verifierClient();

            $resultat = $this->model->jouer($client['id']);

            echo json_encode($resultat);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/roue/admin/stats
     */
    public function statsAdmin()
    {
        try {
            $this->verifierAdmin();

            $stats = $this->model->stats();
            $lots = $this->model->listeLots();
            $config = $this->model->getConfig();

            echo json_encode([
                'success' => true,
                'stats' => $stats,
                'lots' => $lots,
                'config' => $config,
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