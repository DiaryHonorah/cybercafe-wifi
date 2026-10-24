<?php
require_once __DIR__ . '/../config/database.php';

class AdminController {

    /**
     * Lister tous les administrateurs
     * GET /api/admins
     */
    public function liste() {
        $db = (new Database())->getConnection();
        $stmt = $db->query("
            SELECT id, nom, email, role, cree_le
            FROM admins
            ORDER BY cree_le DESC
        ");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Créer un nouvel administrateur
     * POST /api/admins/creer
     */
    public function creer() {
        $data = json_decode(file_get_contents("php://input"), true);
        $nom = trim($data['nom'] ?? '');
        $email = trim($data['email'] ?? '');
        $motDePasse = $data['mot_de_passe'] ?? '';
        $role = $data['role'] ?? 'caissier';

        if (!$nom || !$email || !$motDePasse) {
            http_response_code(400);
            echo json_encode(["erreur" => "Nom, email et mot de passe requis"]);
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["erreur" => "Email invalide"]);
            return;
        }

        $db = (new Database())->getConnection();

        // Vérifier si l'email existe déjà
        $check = $db->prepare("SELECT id FROM admins WHERE email = ?");
        $check->execute([$email]);
        if ($check->fetch()) {
            http_response_code(409);
            echo json_encode(["erreur" => "Cet email est déjà utilisé"]);
            return;
        }

        $hash = password_hash($motDePasse, PASSWORD_BCRYPT);

        $stmt = $db->prepare("
            INSERT INTO admins (nom, email, mot_de_passe, role)
            VALUES (?, ?, ?, ?)
        ");
        $ok = $stmt->execute([$nom, $email, $hash, $role]);

        echo json_encode([
            "success" => $ok,
            "id" => $db->lastInsertId()
        ]);
    }

    /**
     * Modifier un administrateur
     * POST /api/admins/modifier
     */
    public function modifier() {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;
        $nom = trim($data['nom'] ?? '');
        $email = trim($data['email'] ?? '');
        $role = $data['role'] ?? 'caissier';
        $motDePasse = $data['mot_de_passe'] ?? '';

        if (!$id || !$nom || !$email) {
            http_response_code(400);
            echo json_encode(["erreur" => "ID, nom et email requis"]);
            return;
        }

        $db = (new Database())->getConnection();

        if ($motDePasse) {
            $hash = password_hash($motDePasse, PASSWORD_BCRYPT);
            $stmt = $db->prepare("
                UPDATE admins
                SET nom = ?, email = ?, role = ?, mot_de_passe = ?
                WHERE id = ?
            ");
            $ok = $stmt->execute([$nom, $email, $role, $hash, $id]);
        } else {
            $stmt = $db->prepare("
                UPDATE admins
                SET nom = ?, email = ?, role = ?
                WHERE id = ?
            ");
            $ok = $stmt->execute([$nom, $email, $role, $id]);
        }

        echo json_encode(["success" => $ok]);
    }

    /**
     * Supprimer un administrateur
     * POST /api/admins/supprimer
     */
    public function supprimer() {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(["erreur" => "ID requis"]);
            return;
        }

        $db = (new Database())->getConnection();

        // Empêcher la suppression du dernier admin
        $count = $db->query("SELECT COUNT(*) FROM admins")->fetchColumn();
        if ($count <= 1) {
            http_response_code(403);
            echo json_encode(["erreur" => "Impossible de supprimer le dernier administrateur"]);
            return;
        }

        $stmt = $db->prepare("DELETE FROM admins WHERE id = ?");
        $ok = $stmt->execute([$id]);

        echo json_encode(["success" => $ok]);
    }
}