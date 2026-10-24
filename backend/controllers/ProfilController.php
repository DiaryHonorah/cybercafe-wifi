<?php
/**
 * Contrôleur Profil
 * Gère la photo de profil des admins
 */

class ProfilController
{
    private $db;

    public function __construct()
    {
        $this->db = $this->connecter();
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
     * POST /api/profil/upload-avatar
     * Upload d'une nouvelle photo de profil
     */
    public function uploadAvatar()
    {
        try {
            $admin = $this->verifierAdmin();

            if (!isset($_FILES['avatar'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Aucun fichier reçu']);
                return;
            }

            $file = $_FILES['avatar'];

            // Vérifier les erreurs
            if ($file['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Erreur upload']);
                return;
            }

            // Vérifier la taille (max 2 MB)
            if ($file['size'] > 2 * 1024 * 1024) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Fichier trop volumineux (max 2 MB)']);
                return;
            }

            // Vérifier le type MIME
            $typesAutorises = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);

            if (!in_array($mimeType, $typesAutorises)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Type de fichier non autorisé (JPG, PNG, WEBP uniquement)']);
                return;
            }

            // Créer le dossier si nécessaire
            $uploadDir = __DIR__ . '/../uploads/avatars/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            // Générer un nom unique
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $nomFichier = 'avatar_' . $admin['id'] . '_' . time() . '.' . strtolower($extension);
            $cheminComplet = $uploadDir . $nomFichier;

            // Déplacer le fichier
            if (!move_uploaded_file($file['tmp_name'], $cheminComplet)) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'enregistrement']);
                return;
            }

            // Supprimer l'ancienne photo si elle existe
            $stmt = $this->db->prepare("SELECT avatar FROM admins WHERE id = ?");
            $stmt->execute([$admin['id']]);
            $ancienAvatar = $stmt->fetchColumn();

            if ($ancienAvatar && file_exists(__DIR__ . '/../' . $ancienAvatar)) {
                @unlink(__DIR__ . '/../' . $ancienAvatar);
            }

            // Enregistrer le chemin en BDD
            $urlAvatar = 'uploads/avatars/' . $nomFichier;
            $stmt = $this->db->prepare("
                UPDATE admins 
                SET avatar = ?, avatar_updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$urlAvatar, $admin['id']]);

            // Construire l'URL complète
            $baseUrl = 'http://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '/cybercafe-wifi/backend/';
            $urlComplete = $baseUrl . $urlAvatar;

            echo json_encode([
                'success' => true,
                'message' => 'Photo de profil mise à jour',
                'avatar' => $urlComplete,
                'avatar_path' => $urlAvatar,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/profil/supprimer-avatar
     * Supprime la photo de profil
     */
    public function supprimerAvatar()
    {
        try {
            $admin = $this->verifierAdmin();

            // Récupérer l'ancien avatar
            $stmt = $this->db->prepare("SELECT avatar FROM admins WHERE id = ?");
            $stmt->execute([$admin['id']]);
            $ancienAvatar = $stmt->fetchColumn();

            // Supprimer le fichier
            if ($ancienAvatar && file_exists(__DIR__ . '/../' . $ancienAvatar)) {
                @unlink(__DIR__ . '/../' . $ancienAvatar);
            }

            // Mettre à NULL en BDD
            $stmt = $this->db->prepare("UPDATE admins SET avatar = NULL WHERE id = ?");
            $stmt->execute([$admin['id']]);

            echo json_encode([
                'success' => true,
                'message' => 'Photo de profil supprimée',
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/profil/mon-profil
     * Récupère les infos du profil connecté
     */
    public function monProfil()
    {
        try {
            $admin = $this->verifierAdmin();

            $stmt = $this->db->prepare("
                SELECT id, nom, email, role, avatar, avatar_updated_at
                FROM admins WHERE id = ?
            ");
            $stmt->execute([$admin['id']]);
            $profil = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($profil['avatar']) {
                $baseUrl = 'http://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '/cybercafe-wifi/backend/';
                $profil['avatar_url'] = $baseUrl . $profil['avatar'];
            } else {
                $profil['avatar_url'] = null;
            }

            echo json_encode(['success' => true, 'profil' => $profil]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/profil/modifier
     * Modifie nom/email
     */
    public function modifierProfil()
    {
        try {
            $admin = $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            $nom = trim($data['nom'] ?? '');
            $email = trim($data['email'] ?? '');

            if (empty($nom) || mb_strlen($nom) < 2) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Nom requis (2 caractères min)']);
                return;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Email invalide']);
                return;
            }

            // Vérifier que l'email n'est pas déjà utilisé
            $stmt = $this->db->prepare("SELECT id FROM admins WHERE email = ? AND id != ?");
            $stmt->execute([$email, $admin['id']]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé']);
                return;
            }

            $stmt = $this->db->prepare("UPDATE admins SET nom = ?, email = ? WHERE id = ?");
            $stmt->execute([$nom, $email, $admin['id']]);

            echo json_encode([
                'success' => true,
                'message' => 'Profil mis à jour',
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/profil/changer-mot-de-passe
     */
    public function changerMotDePasse()
    {
        try {
            $admin = $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            $ancienMdp = $data['ancien_mot_de_passe'] ?? '';
            $nouveauMdp = $data['nouveau_mot_de_passe'] ?? '';

            if (empty($ancienMdp) || empty($nouveauMdp)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Tous les champs requis']);
                return;
            }

            if (strlen($nouveauMdp) < 8) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Le mot de passe doit faire au moins 8 caractères']);
                return;
            }

            // Vérifier l'ancien mot de passe
            $stmt = $this->db->prepare("SELECT mot_de_passe FROM admins WHERE id = ?");
            $stmt->execute([$admin['id']]);
            $hashActuel = $stmt->fetchColumn();

            if (!password_verify($ancienMdp, $hashActuel)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Ancien mot de passe incorrect']);
                return;
            }

            // Mettre à jour
            $nouveauHash = password_hash($nouveauMdp, PASSWORD_DEFAULT);
            $stmt = $this->db->prepare("UPDATE admins SET mot_de_passe = ? WHERE id = ?");
            $stmt->execute([$nouveauHash, $admin['id']]);

            echo json_encode([
                'success' => true,
                'message' => 'Mot de passe modifié',
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Vérifie le token admin
     */
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