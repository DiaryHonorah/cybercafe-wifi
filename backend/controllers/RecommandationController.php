<?php
/**
 * Contrôleur Recommandation
 * Expose les routes API pour le moteur de recommandation
 */

require_once __DIR__ . '/../models/Recommandation.php';

class RecommandationController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Recommandation($this->db);
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
    // ROUTES PUBLIQUES / CLIENT
    // =====================================================

    /**
     * GET /api/reco/recommandations?limite=6
     * Retourne les recommandations pour le client connecté (ou populaires si non connecté)
     */
    public function getRecommandations()
    {
        try {
            $client = $this->getClientOptionnel();
            $limite = isset($_GET['limite']) ? intval($_GET['limite']) : null;
            $contexte = $_GET['contexte'] ?? 'general';

            if ($client) {
                $recos = $this->model->recommanderPourClient($client['id'], $limite, $contexte);
            } else {
                $recos = $this->model->recommanderPopulaires($limite ?? 6);
            }

            // Formatter pour le frontend
            $result = [];
            foreach ($recos as $r) {
                $s = $r['service'];
                $result[] = [
                    'id' => intval($s['id']),
                    'nom' => $s['nom'],
                    'description' => $s['description'] ?? '',
                    'icone' => $s['icone'] ?? '🔧',
                    'tarif' => floatval($s['tarif'] ?? 0),
                    'categorie' => $s['categorie'] ?? 'general',
                    'tags' => $s['tags'] ?? '',
                    'niveau_prix' => $s['niveau_prix'] ?? 'standard',
                    'duree_typique' => intval($s['duree_typique'] ?? 60),
                    'score' => $r['score'],
                ];
            }

            echo json_encode([
                'success' => true,
                'personnalise' => $client !== null,
                'recommandations' => $result,
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/reco/track
     * Enregistre une interaction client
     * Body: { service_id, type, duree_secondes?, source?, metadata? }
     */
    public function track()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            $serviceId = intval($data['service_id'] ?? 0);
            $type = $data['type'] ?? 'vue';

            if (!$serviceId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'service_id requis']);
                return;
            }

            $client = $this->getClientOptionnel();
            if (!$client) {
                // Pas de tracking pour les visiteurs anonymes
                echo json_encode(['success' => true, 'tracked' => false]);
                return;
            }

            $ok = $this->model->enregistrerInteraction(
                $client['id'],
                $serviceId,
                $type,
                isset($data['duree_secondes']) ? intval($data['duree_secondes']) : null,
                $data['source'] ?? 'direct',
                $data['metadata'] ?? null
            );

            echo json_encode([
                'success' => true,
                'tracked' => $ok,
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/reco/profil
     * Profil de recommandation du client connecté
     */
    public function getMonProfil()
    {
        try {
            $client = $this->getClientConnecte();
            $profil = $this->model->getProfil($client['id']);

            echo json_encode([
                'success' => true,
                'profil' => $profil,
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // ROUTES ADMIN
    // =====================================================

    /**
     * GET /api/reco/admin/config
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
     * POST /api/reco/admin/config
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
     * GET /api/reco/admin/stats
     */
    public function getStats()
    {
        try {
            $this->verifierAdmin();
            $stats = $this->model->getStats();

            echo json_encode([
                'success' => true,
                'stats' => $stats,
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/reco/admin/interactions?limite=50
     */
    public function getInteractions()
    {
        try {
            $this->verifierAdmin();
            $limite = isset($_GET['limite']) ? intval($_GET['limite']) : 50;
            $interactions = $this->model->getInteractionsRecentes($limite);

            echo json_encode([
                'success' => true,
                'interactions' => $interactions,
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/reco/admin/vider-cache
     */
    public function viderCache()
    {
        try {
            $this->verifierAdmin();
            $this->model->viderCache();

            echo json_encode([
                'success' => true,
                'message' => 'Cache vidé',
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/reco/admin/services-meta
     */
    public function getServicesMeta()
    {
        try {
            $this->verifierAdmin();
            $services = $this->model->getServicesMeta();

            echo json_encode([
                'success' => true,
                'services' => $services,
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/reco/admin/services-meta
     * Body: { service_id, categorie, tags, niveau_prix, pour_debutant, duree_typique, actif }
     */
    public function saveServiceMeta()
    {
        try {
            $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            $serviceId = intval($data['service_id'] ?? 0);
            if (!$serviceId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'service_id requis']);
                return;
            }

            $this->model->saveServiceMeta($serviceId, $data);

            echo json_encode([
                'success' => true,
                'message' => 'Métadonnées sauvegardées',
            ]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // AUTH CLIENTS
    // =====================================================

    /**
     * Récupère le client connecté (via token)
     * Retourne null si pas connecté (pour usage public)
     */
    private function getClientOptionnel()
    {
        $token = $this->getTokenClient();
        if (empty($token)) return null;

        $stmt = $this->db->prepare("
            SELECT c.id, c.nom, c.email
            FROM sessions_clients s
            JOIN clients c ON c.id = s.client_id
            WHERE s.token = ? AND s.expire_le > NOW()
        ");
        $stmt->execute([$token]);
        $client = $stmt->fetch(PDO::FETCH_ASSOC);

        return $client ?: null;
    }

    /**
     * Récupère le client connecté (obligatoire)
     */
    private function getClientConnecte()
    {
        $client = $this->getClientOptionnel();
        if (!$client) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Authentification requise']);
            exit;
        }
        return $client;
    }

    private function getTokenClient()
    {
        $headers = $this->recupererHeaders();
        $authHeader = $headers['authorization'] ?? $headers['Authorization'] ?? '';

        // Accepter aussi le token en query string pour faciliter les tests
        if (empty($authHeader) && isset($_GET['token'])) {
            return trim($_GET['token']);
        }

        if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
            return trim($matches[1]);
        }
        return '';
    }

    // =====================================================
    // AUTH ADMIN
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