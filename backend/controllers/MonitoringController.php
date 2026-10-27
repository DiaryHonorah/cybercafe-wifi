<?php
/**
 * Contrôleur Monitoring
 * API pour la surveillance du site
 */

require_once __DIR__ . '/../services/MonitoringService.php';

class MonitoringController
{
    private $db;
    private $service;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->service = new MonitoringService($this->db);
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
     * GET /api/monitoring/dashboard
     * Vue d'ensemble
     */
    public function dashboard()
    {
        try {
            $this->verifierAdmin();

            // Lancer les checks maintenant
            $checks = $this->service->verifierTout();
            $stats = $this->service->stats();
            $alertes = $this->service->listeAlertes(10, true);
            $historique = $this->service->historiqueChecks('site', 24);

            echo json_encode([
                'success' => true,
                'checks' => $checks,
                'stats' => $stats,
                'alertes' => $alertes,
                'historique' => $historique,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/monitoring/alertes
     */
    public function alertes()
    {
        try {
            $this->verifierAdmin();
            $limite = intval($_GET['limite'] ?? 50);
            $alertes = $this->service->listeAlertes($limite);

            echo json_encode(['success' => true, 'alertes' => $alertes]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/monitoring/alertes/lire
     */
    public function marquerLue()
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

            $this->service->marquerLue($id);
            echo json_encode(['success' => true]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/monitoring/alertes/resoudre
     */
    public function resoudre()
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

            $this->service->resoudreAlerte($id);
            echo json_encode(['success' => true, 'message' => 'Alerte résolue']);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/monitoring/erreurs
     */
    public function erreurs()
    {
        try {
            $this->verifierAdmin();
            $limite = intval($_GET['limite'] ?? 50);
            $erreurs = $this->service->listeErreurs($limite);

            echo json_encode(['success' => true, 'erreurs' => $erreurs]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/monitoring/non-lues
     * Pour le badge sidebar
     */
    public function nonLues()
    {
        try {
            $this->verifierAdmin();
            $stats = $this->service->stats();

            echo json_encode([
                'success' => true,
                'alertes' => $stats['alertes_non_lues'],
                'erreurs' => $stats['erreurs_24h'],
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/monitoring/check
     * Lancer les checks manuellement
     */
    public function check()
    {
        try {
            $this->verifierAdmin();
            $resultats = $this->service->verifierTout();

            echo json_encode([
                'success' => true,
                'resultats' => $resultats,
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