<?php
/**
 * Contrôleur Fidelite
 * Gère les cartes de fidélité (public + admin)
 * 
 * Authentification admin : token via header Authorization: Bearer XXX
 */

require_once __DIR__ . '/../models/CarteFidelite.php';

class FideliteController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new CarteFidelite($this->db);
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
    // ROUTES PUBLIQUES
    // =====================================================

    /**
     * POST /api/fidelite/inscription — Créer une carte (PUBLIC)
     */
    public function inscription()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Données invalides']);
                return;
            }

            $erreurs = $this->validerInscription($data);
            if (!empty($erreurs)) {
                http_response_code(422);
                echo json_encode([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'erreurs' => $erreurs,
                ]);
                return;
            }

            $carte = $this->model->creer([
                'client_nom'       => trim($data['client_nom']),
                'client_telephone' => trim($data['client_telephone']),
                'client_email'     => trim($data['client_email'] ?? ''),
            ]);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Carte de fidélité créée avec succès !',
                'carte'   => $this->formatterCarte($carte),
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * GET /api/fidelite/carte?code=FID-XXXXXX — Consulter (PUBLIC)
     */
    public function detail()
    {
        try {
            $code = $_GET['code'] ?? null;
            if (!$code) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Code manquant']);
                return;
            }

            $carte = $this->model->trouverParCode($code);
            if (!$carte) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Carte introuvable']);
                return;
            }

            // Récupérer récompenses + historique
            $recompenses = $this->model->getRecompensesDebloquees($carte['id']);
            $historique  = $this->model->getHistorique($carte['id'], 10);

            echo json_encode([
                'success'     => true,
                'carte'       => $this->formatterCarte($carte),
                'recompenses' => $recompenses,
                'historique'  => $historique,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/fidelite/recompenses — Catalogue public
     */
    public function recompenses()
    {
        try {
            $recompenses = $this->model->getRecompenses();
            echo json_encode(['success' => true, 'recompenses' => $recompenses]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // ROUTES ADMIN
    // =====================================================

    /**
     * GET /api/fidelite — Liste (ADMIN)
     */
    public function liste()
    {
        try {
            $this->verifierAdmin();

            $filtres = [
                'actif'     => isset($_GET['actif']) ? intval($_GET['actif']) : null,
                'niveau'    => $_GET['niveau'] ?? null,
                'recherche' => $_GET['recherche'] ?? null,
            ];

            $cartes = $this->model->liste($filtres);

            echo json_encode([
                'success' => true,
                'cartes'  => array_map([$this, 'formatterCarte'], $cartes),
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/fidelite/stats — Statistiques (ADMIN)
     */
    public function stats()
    {
        try {
            $this->verifierAdmin();
            $stats = $this->model->stats();
            echo json_encode(['success' => true, 'stats' => $stats]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/fidelite/ajouter-points — Ajouter points (ADMIN)
     */
    public function ajouterPoints()
    {
        try {
            $this->verifierAdmin();

            $data = json_decode(file_get_contents('php://input'), true);
            $carteId = intval($data['carte_id'] ?? 0);
            $points  = intval($data['points'] ?? 0);
            $raison  = trim($data['raison'] ?? 'Ajout manuel');
            $ref     = trim($data['reference'] ?? '');

            if ($carteId <= 0 || $points <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Carte ID et points requis']);
                return;
            }

            $carte = $this->model->ajouterPoints($carteId, $points, $raison, $ref);
            echo json_encode([
                'success' => true,
                'message' => "$points points ajoutés",
                'carte'   => $this->formatterCarte($carte),
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/fidelite/utiliser-recompense — Utiliser (ADMIN)
     */
    public function utiliserRecompense()
    {
        try {
            $this->verifierAdmin();

            $data = json_decode(file_get_contents('php://input'), true);
            $carteId    = intval($data['carte_id'] ?? 0);
            $recompenseId = intval($data['recompense_id'] ?? 0);

            if ($carteId <= 0 || $recompenseId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
                return;
            }

            // Récupérer la récompense
            $stmt = $this->db->prepare("SELECT * FROM recompenses_fidelite WHERE id = :id AND actif = 1");
            $stmt->execute([':id' => $recompenseId]);
            $recompense = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$recompense) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Récompense introuvable']);
                return;
            }

            $pointsRequis = intval($recompense['points_requis']);

            $carte = $this->model->depenserPoints(
                $carteId,
                $pointsRequis,
                'Utilisation récompense : ' . $recompense['nom'],
                'REC-' . $recompense['id']
            );

            echo json_encode([
                'success'   => true,
                'message'   => "Récompense '{$recompense['nom']}' utilisée",
                'carte'     => $this->formatterCarte($carte),
                'recompense' => $recompense,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/fidelite/toggle-actif — Activer/désactiver (ADMIN)
     */
    public function toggleActif()
    {
        try {
            $this->verifierAdmin();

            $data = json_decode(file_get_contents('php://input'), true);
            $carteId = intval($data['carte_id'] ?? 0);

            if ($carteId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Carte ID requis']);
                return;
            }

            $carte = $this->model->toggleActif($carteId);
            echo json_encode([
                'success' => true,
                'message' => $carte['actif'] ? 'Carte activée' : 'Carte désactivée',
                'carte'   => $this->formatterCarte($carte),
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/fidelite/supprimer — Supprimer (ADMIN)
     */
    public function supprimer()
    {
        try {
            $this->verifierAdmin();

            $data = json_decode(file_get_contents('php://input'), true);
            $carteId = intval($data['carte_id'] ?? 0);

            if ($carteId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Carte ID requis']);
                return;
            }

            $this->model->supprimer($carteId);
            echo json_encode(['success' => true, 'message' => 'Carte supprimée']);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/fidelite/historique?carte_id=X — Historique (ADMIN)
     */
    public function historique()
    {
        try {
            $this->verifierAdmin();

            $carteId = intval($_GET['carte_id'] ?? 0);
            if ($carteId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Carte ID requis']);
                return;
            }

            $historique = $this->model->getHistorique($carteId, 100);
            echo json_encode(['success' => true, 'historique' => $historique]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // VALIDATION
    // =====================================================

    private function validerInscription($data)
    {
        $erreurs = [];

        if (empty($data['client_nom']) || mb_strlen(trim($data['client_nom'])) < 2) {
            $erreurs['client_nom'] = 'Le nom est requis (2 caractères min)';
        }

        if (empty($data['client_telephone']) || mb_strlen(trim($data['client_telephone'])) < 8) {
            $erreurs['client_telephone'] = 'Téléphone invalide (8 caractères min)';
        }

        if (!empty($data['client_email']) && !filter_var($data['client_email'], FILTER_VALIDATE_EMAIL)) {
            $erreurs['client_email'] = 'Email invalide';
        }

        return $erreurs;
    }

    // =====================================================
    // AUTHENTIFICATION ADMIN (token)
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
            echo json_encode(['success' => false, 'message' => 'Token invalide ou expiré']);
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

    // =====================================================
    // FORMATAGE
    // =====================================================

    private function formatterCarte($carte)
    {
        if (!$carte) return null;

        return [
            'id'                  => intval($carte['id']),
            'code_carte'          => $carte['code_carte'],
            'client_nom'          => $carte['client_nom'],
            'client_telephone'    => $carte['client_telephone'],
            'client_email'        => $carte['client_email'],
            'points_total'        => intval($carte['points_total']),
            'points_utilises'     => intval($carte['points_utilises']),
            'points_disponibles'  => intval($carte['points_disponibles']),
            'niveau'              => $carte['niveau'],
            'niveau_info'         => $carte['niveau_info'],
            'prochain_niveau'     => $carte['prochain_niveau'] ?? null,
            'prochain_seuil'      => $carte['prochain_seuil'] ?? null,
            'points_manquants'    => intval($carte['points_manquants'] ?? 0),
            'progression'         => floatval($carte['progression'] ?? 0),
            'actif'               => (bool)$carte['actif'],
            'date_creation'       => $carte['date_creation'],
            'date_derniere_utilisation' => $carte['date_derniere_utilisation'],
            'note_admin'          => $carte['note_admin'],
        ];
    }
}