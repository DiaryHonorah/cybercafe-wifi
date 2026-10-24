<?php
/**
 * Contrôleur Blog
 * Gère les articles de blog (public + admin)
 */

require_once __DIR__ . '/../models/Article.php';

class BlogController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Article($this->db);
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
     * GET /api/blog/articles — Liste articles publiés (PUBLIC)
     */
    public function listePublique()
    {
        try {
            $filtres = [
                'categorie_slug' => $_GET['categorie'] ?? null,
                'recherche'      => $_GET['recherche'] ?? null,
                'a_la_une'       => isset($_GET['a_la_une']) ? (bool)$_GET['a_la_une'] : null,
                'limit'          => isset($_GET['limit']) ? intval($_GET['limit']) : 20,
            ];

            $articles = $this->model->liste($filtres, true);
            $categories = $this->model->getCategories();

            echo json_encode([
                'success'    => true,
                'articles'   => $articles,
                'categories' => $categories,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/blog/article?slug=XXX — Article par slug (PUBLIC)
     */
    public function detailPublique()
    {
        try {
            $slug = $_GET['slug'] ?? null;
            if (!$slug) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Slug manquant']);
                return;
            }

            $article = $this->model->trouverParSlug($slug);
            if (!$article) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Article introuvable']);
                return;
            }

            // Incrémenter les vues
            $this->model->incrementerVues($article['id']);

            // Articles similaires (même catégorie)
            $similaires = [];
            if (!empty($article['categorie_id'])) {
                $similaires = $this->model->liste([
                    'categorie_id' => $article['categorie_id'],
                    'limit'        => 3,
                ], true);

                // Enlever l'article actuel de la liste
                $similaires = array_values(array_filter($similaires, function($a) use ($article) {
                    return $a['id'] != $article['id'];
                }));
            }

            echo json_encode([
                'success'    => true,
                'article'    => $article,
                'similaires' => $similaires,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/blog/categories — Liste catégories (PUBLIC)
     */
    public function categories()
    {
        try {
            $categories = $this->model->getCategories();
            echo json_encode(['success' => true, 'categories' => $categories]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // ADMIN
    // =====================================================

    /**
     * GET /api/blog/admin/articles — Liste admin
     */
    public function listeAdmin()
    {
        try {
            $this->verifierAdmin();

            $filtres = [
                'statut'       => $_GET['statut'] ?? null,
                'categorie_id' => $_GET['categorie_id'] ?? null,
                'recherche'    => $_GET['recherche'] ?? null,
            ];

            $articles = $this->model->liste($filtres, false);
            $categories = $this->model->getCategories();

            echo json_encode([
                'success'    => true,
                'articles'   => $articles,
                'categories' => $categories,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/blog/admin/stats — Stats admin
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
     * POST /api/blog/admin/creer — Créer article
     */
    public function creer()
    {
        try {
            $admin = $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Données invalides']);
                return;
            }

            $erreurs = $this->valider($data);
            if (!empty($erreurs)) {
                http_response_code(422);
                echo json_encode([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'erreurs' => $erreurs,
                ]);
                return;
            }

            $article = $this->model->creer($data, $admin['id']);

            echo json_encode([
                'success' => true,
                'message' => 'Article créé',
                'article' => $article,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/blog/admin/modifier — Modifier article
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

            $erreurs = $this->valider($data);
            if (!empty($erreurs)) {
                http_response_code(422);
                echo json_encode([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'erreurs' => $erreurs,
                ]);
                return;
            }

            $article = $this->model->modifier($id, $data);

            echo json_encode([
                'success' => true,
                'message' => 'Article modifié',
                'article' => $article,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/blog/admin/supprimer — Supprimer article
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
            echo json_encode(['success' => true, 'message' => 'Article supprimé']);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/blog/admin/article?id=X — Détail article admin
     */
    public function detailAdmin()
    {
        try {
            $this->verifierAdmin();
            $id = intval($_GET['id'] ?? 0);
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $article = $this->model->trouverParId($id);
            if (!$article) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Article introuvable']);
                return;
            }

            echo json_encode(['success' => true, 'article' => $article]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // HELPERS
    // =====================================================

    private function valider($data)
    {
        $erreurs = [];

        if (empty($data['titre']) || mb_strlen(trim($data['titre'])) < 3) {
            $erreurs['titre'] = 'Le titre est requis (3 caractères min)';
        }

        if (empty($data['contenu']) || mb_strlen(trim($data['contenu'])) < 10) {
            $erreurs['contenu'] = 'Le contenu est requis (10 caractères min)';
        }

        $statutsValides = ['brouillon', 'publie', 'archive'];
        if (!empty($data['statut']) && !in_array($data['statut'], $statutsValides)) {
            $erreurs['statut'] = 'Statut invalide';
        }

        return $erreurs;
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
}