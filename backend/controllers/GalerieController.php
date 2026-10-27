<?php
/**
 * Contrôleur Galerie
 * API pour gérer les photos de la galerie
 */

require_once __DIR__ . '/../models/Galerie.php';

class GalerieController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Galerie($this->db);
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
     * GET /api/galerie/photos
     */
    public function listePublique()
    {
        try {
            $filtres = [
                'actif' => 1,
                'categorie' => $_GET['categorie'] ?? null,
            ];

            $photos = $this->model->liste($filtres);

            // Construire les URLs complètes
            $baseUrl = 'http://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '/cybercafe-wifi/backend/';
            foreach ($photos as &$photo) {
                $photo['image_url'] = $baseUrl . $photo['image_path'];
            }

            echo json_encode([
                'success' => true,
                'photos' => $photos,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // ADMIN
    // =====================================================

    /**
     * GET /api/galerie/admin/photos
     */
    public function listeAdmin()
    {
        try {
            $this->verifierAdmin();

            $filtres = [
                'categorie' => $_GET['categorie'] ?? null,
            ];

            $photos = $this->model->liste($filtres);
            $stats = $this->model->stats();

            $baseUrl = 'http://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '/cybercafe-wifi/backend/';
            foreach ($photos as &$photo) {
                $photo['image_url'] = $baseUrl . $photo['image_path'];
            }

            echo json_encode([
                'success' => true,
                'photos' => $photos,
                'stats' => $stats,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/galerie/admin/upload
     * Upload d'une photo
     */
    public function upload()
    {
        try {
            $admin = $this->verifierAdmin();

            if (!isset($_FILES['photo'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Aucun fichier reçu']);
                return;
            }

            $file = $_FILES['photo'];

            if ($file['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Erreur upload']);
                return;
            }

            // Taille max 5 MB
            if ($file['size'] > 5 * 1024 * 1024) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Fichier trop volumineux (max 5 MB)']);
                return;
            }

            // Type MIME
            $typesAutorises = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);

            if (!in_array($mimeType, $typesAutorises)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Type de fichier non autorisé']);
                return;
            }

            // Créer le dossier
            $uploadDir = __DIR__ . '/../uploads/galerie/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            // Nom unique
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $nomFichier = 'photo_' . time() . '_' . rand(1000, 9999) . '.' . strtolower($extension);
            $cheminComplet = $uploadDir . $nomFichier;

            if (!move_uploaded_file($file['tmp_name'], $cheminComplet)) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'enregistrement']);
                return;
            }

            // Enregistrer en BDD
            $data = [
                'titre' => $_POST['titre'] ?? 'Sans titre',
                'titre_mg' => $_POST['titre_mg'] ?? null,
                'description' => $_POST['description'] ?? null,
                'description_mg' => $_POST['description_mg'] ?? null,
                'image_path' => 'uploads/galerie/' . $nomFichier,
                'categorie' => $_POST['categorie'] ?? 'espace',
                'ordre' => intval($_POST['ordre'] ?? 0),
                'actif' => isset($_POST['actif']) && $_POST['actif'] === 'true',
            ];

            $photo = $this->model->creer($data, $admin['id']);

            $baseUrl = 'http://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '/cybercafe-wifi/backend/';
            $photo['image_url'] = $baseUrl . $photo['image_path'];

            echo json_encode([
                'success' => true,
                'message' => 'Photo uploadée',
                'photo' => $photo,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/galerie/admin/modifier
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

            $photo = $this->model->modifier($id, $data);

            echo json_encode([
                'success' => true,
                'message' => 'Photo modifiée',
                'photo' => $photo,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/galerie/admin/supprimer
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

            echo json_encode(['success' => true, 'message' => 'Photo supprimée']);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/galerie/admin/toggle
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

            $photo = $this->model->toggleActif($id);

            echo json_encode([
                'success' => true,
                'message' => $photo['actif'] ? 'Activée' : 'Désactivée',
                'actif' => (bool)$photo['actif'],
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // HELPERS
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