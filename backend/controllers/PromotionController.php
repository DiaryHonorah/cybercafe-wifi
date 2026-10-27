<?php
/**
 * Contrôleur Promotion
 * API pour les codes promo
 */

require_once __DIR__ . '/../models/Promotion.php';

class PromotionController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Promotion($this->db);
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
     * POST /api/promotions/valider
     * Body: { code, montant, service?, client_telephone? }
     */
    public function valider()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            $code = trim($data['code'] ?? '');
            $montant = floatval($data['montant'] ?? 0);
            $service = $data['service'] ?? 'tous';
            $clientTel = $data['client_telephone'] ?? null;

            if (empty($code) || $montant <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Code et montant requis']);
                return;
            }

            $resultat = $this->model->valider($code, $montant, $service, $clientTel);

            echo json_encode($resultat);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/promotions/actives
     * Liste les codes actifs (pour affichage public)
     */
    public function actives()
    {
        try {
            $promos = $this->model->liste(['statut' => 'actives']);
            
            // Ne renvoyer que les infos publiques
            $promosPubliques = array_map(function($p) {
                return [
                    'code' => $p['code'],
                    'description' => $p['description'],
                    'type' => $p['type'],
                    'valeur' => floatval($p['valeur']),
                    'montant_min' => floatval($p['montant_min']),
                    'date_fin' => $p['date_fin'],
                ];
            }, $promos);

            echo json_encode(['success' => true, 'promotions' => $promosPubliques]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // ADMIN
    // =====================================================

    /**
     * GET /api/promotions/admin/liste
     */
    public function listeAdmin()
    {
        try {
            $this->verifierAdmin();

            $filtres = [
                'actif' => $_GET['actif'] ?? null,
                'statut' => $_GET['statut'] ?? null,
                'recherche' => $_GET['recherche'] ?? null,
            ];

            $promos = $this->model->liste($filtres);
            $stats = $this->model->stats();

            echo json_encode([
                'success' => true,
                'promotions' => $promos,
                'stats' => $stats,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/promotions/admin/utilisations
     */
    public function utilisations()
    {
        try {
            $this->verifierAdmin();
            
            $promoId = isset($_GET['promotion_id']) ? intval($_GET['promotion_id']) : null;
            $utilisations = $this->model->listeUtilisations($promoId);

            echo json_encode(['success' => true, 'utilisations' => $utilisations]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/promotions/admin/creer
     */
    public function creer()
    {
        try {
            $admin = $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            $erreurs = $this->validerDonnees($data);
            if (!empty($erreurs)) {
                http_response_code(422);
                echo json_encode([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'erreurs' => $erreurs,
                ]);
                return;
            }

            $promo = $this->model->creer($data, $admin['id']);

            echo json_encode([
                'success' => true,
                'message' => 'Promotion créée',
                'promotion' => $promo,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/promotions/admin/modifier
     */
    public function modifier()
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

            $promo = $this->model->modifier($id, $data);

            echo json_encode([
                'success' => true,
                'message' => 'Promotion modifiée',
                'promotion' => $promo,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/promotions/admin/supprimer
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

            echo json_encode(['success' => true, 'message' => 'Promotion supprimée']);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/promotions/admin/toggle
     */
    public function toggle()
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

            $promo = $this->model->toggleActif($id);

            echo json_encode([
                'success' => true,
                'message' => $promo['actif'] ? 'Activée' : 'Désactivée',
                'actif' => (bool)$promo['actif'],
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // HELPERS
    // =====================================================

    private function validerDonnees($data)
    {
        $erreurs = [];

        if (empty($data['code']) || !preg_match('/^[A-Za-z0-9_-]{3,50}$/', $data['code'])) {
            $erreurs['code'] = 'Code requis (3-50 caractères, A-Z, 0-9, _, -)';
        }

        if (!in_array($data['type'] ?? '', ['pourcentage', 'montant_fixe'])) {
            $erreurs['type'] = 'Type invalide';
        }

        if (!isset($data['valeur']) || floatval($data['valeur']) <= 0) {
            $erreurs['valeur'] = 'Valeur requise (> 0)';
        }

        if (($data['type'] ?? '') === 'pourcentage' && floatval($data['valeur']) > 100) {
            $erreurs['valeur'] = 'Pourcentage max 100%';
        }

        if (empty($data['date_debut']) || empty($data['date_fin'])) {
            $erreurs['dates'] = 'Dates requises';
        } elseif (strtotime($data['date_fin']) <= strtotime($data['date_debut'])) {
            $erreurs['dates'] = 'Date de fin doit être après début';
        }

        return $erreurs;
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