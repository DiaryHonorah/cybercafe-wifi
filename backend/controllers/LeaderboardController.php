<?php
/**
 * Contrôleur Leaderboard
 */

require_once __DIR__ . '/../models/Leaderboard.php';

class LeaderboardController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Leaderboard($this->db);
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
     * GET /api/leaderboard
     * Classement public
     */
    public function classementPublic()
    {
        try {
            $config = $this->model->getConfig();
            if (!$config || !$config['actif'] || !$config['afficher_public']) {
                echo json_encode([
                    'success' => true,
                    'actif' => false,
                    'classement' => [],
                ]);
                return;
            }

            $mois = $_GET['mois'] ?? date('Y-m');
            $limite = isset($_GET['limite']) ? intval($_GET['limite']) : 10;

            $classement = $this->model->classement($mois, $limite);
            $historique = $this->model->historiqueGagnants(3);

            echo json_encode([
                'success' => true,
                'actif' => true,
                'mois' => $mois,
                'config' => [
                    'titre' => $config['titre'],
                    'description' => $config['description'],
                    'recompense_1er' => floatval($config['recompense_1er']),
                    'recompense_2eme' => floatval($config['recompense_2eme']),
                    'recompense_3eme' => floatval($config['recompense_3eme']),
                ],
                'classement' => $classement,
                'historique' => $historique,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/client/leaderboard/ma-position
     */
    public function maPosition()
    {
        try {
            $client = $this->verifierClient();
            $mois = $_GET['mois'] ?? date('Y-m');

            $position = $this->model->maPosition($client['id'], $mois);
            $config = $this->model->getConfig();

            echo json_encode([
                'success' => true,
                'ma_position' => $position,
                'config' => [
                    'titre' => $config['titre'],
                    'poids_reservations' => intval($config['poids_reservations']),
                    'poids_parrainages' => intval($config['poids_parrainages']),
                    'poids_points_fidelite' => intval($config['poids_points_fidelite']),
                    'recompense_1er' => floatval($config['recompense_1er']),
                    'recompense_2eme' => floatval($config['recompense_2eme']),
                    'recompense_3eme' => floatval($config['recompense_3eme']),
                ],
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
     * GET /api/leaderboard/admin/config
     */
    public function adminGetConfig()
    {
        try {
            $this->verifierAdmin();
            $config = $this->model->getConfig();
            $stats = $this->model->stats();

            echo json_encode([
                'success' => true,
                'config' => $config,
                'stats' => $stats,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/leaderboard/admin/config
     */
    public function adminSaveConfig()
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
     * GET /api/leaderboard/admin/classement
     */
    public function adminClassement()
    {
        try {
            $this->verifierAdmin();
            $mois = $_GET['mois'] ?? date('Y-m');
            $limite = isset($_GET['limite']) ? intval($_GET['limite']) : 50;

            $classement = $this->model->classement($mois, $limite);

            echo json_encode([
                'success' => true,
                'mois' => $mois,
                'classement' => $classement,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/leaderboard/admin/archiver
     */
    public function adminArchiver()
    {
        try {
            $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);
            $mois = $data['mois'] ?? date('Y-m', strtotime('-1 month'));

            $count = $this->model->archiverGagnants($mois);

            echo json_encode([
                'success' => true,
                'message' => "$count gagnant(s) archivé(s) pour $mois",
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/leaderboard/admin/historique
     */
    public function adminHistorique()
    {
        try {
            $this->verifierAdmin();
            $historique = $this->model->historiqueGagnants(12);

            echo json_encode([
                'success' => true,
                'historique' => $historique,
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