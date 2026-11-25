<?php
/**
 * Contrôleur Parrainage (V2)
 * Gestion du parrainage à plusieurs niveaux
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
     * GET /api/parrainage/verifier-code?code=XXX
     * Vérifie si un code parrain est valide
     */
    public function verifierCode()
    {
        try {
            $code = $_GET['code'] ?? '';
            if (empty($code)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Code requis']);
                return;
            }

            $client = $this->model->verifierCode($code);

            echo json_encode([
                'success' => true,
                'parrain' => [
                    'nom' => $client['nom'],
                    'code' => $client['code_parrainage'],
                ],
            ]);
        } catch (Exception $e) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/client/parrainage/mes-stats
     * Stats complètes du parrainage pour le client connecté
     */
    public function mesStats()
    {
        try {
            $client = $this->verifierClient();
            $stats = $this->model->mesStats($client['id']);

            echo json_encode([
                'success' => true,
                'stats' => $stats['stats'],
                'parrainages' => $stats['parrainages'],
                'niveau_2' => $stats['niveau_2'],
                'niveau_3' => $stats['niveau_3'],
                'config' => $stats['config'],
            ]);
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/parrainage/admin/liste
     * Liste admin des parrainages
     */
    public function listeAdmin()
    {
        try {
            $this->verifierAdmin();
            $filtres = [
                'statut' => $_GET['statut'] ?? 'tous',
                'recherche' => $_GET['recherche'] ?? null,
                'limite' => isset($_GET['limite']) ? intval($_GET['limite']) : 100,
            ];

            $parrainages = $this->model->listeAdmin($filtres);
            $stats = $this->model->statsAdmin();

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
     * Valide un parrainage (et verse les récompenses)
     */
    public function valider()
    {
        try {
            $admin = $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);
            $id = intval($data['id'] ?? 0);

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $this->model->valider($id, $admin['id']);

            echo json_encode([
                'success' => true,
                'message' => 'Parrainage validé. Récompenses versées.',
            ]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/parrainage/admin/annuler
     * Annule un parrainage
     */
    public function annuler()
    {
        try {
            $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);
            $id = intval($data['id'] ?? 0);
            $raison = $data['raison'] ?? null;

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $this->model->annuler($id, $raison);

            echo json_encode([
                'success' => true,
                'message' => 'Parrainage annulé',
            ]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/parrainage/admin/config
     * Sauvegarde la config (admin)
     */
    public function saveConfig()
    {
        try {
            $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            $stmt = $this->db->prepare("
                UPDATE parrainage_config SET
                    actif = ?,
                    recompense_parrain = ?,
                    recompense_filleul = ?,
                    recompense_niveau_2 = ?,
                    recompense_niveau_3 = ?,
                    message_parrainage = ?
                WHERE id = 1
            ");
            $stmt->execute([
                !empty($data['actif']) ? 1 : 0,
                floatval($data['recompense_parrain'] ?? 500),
                floatval($data['recompense_filleul'] ?? 500),
                floatval($data['recompense_niveau_2'] ?? 100),
                floatval($data['recompense_niveau_3'] ?? 50),
                $data['message_parrainage'] ?? 'Gagnez 500 Ar par ami inscrit !',
            ]);

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
     * GET /api/parrainage/admin/config
     */
    public function getConfigAdmin()
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