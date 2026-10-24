<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/TwoFactorService.php';

class TwoFactorController {

    /**
     * Étape 1 : Générer un secret + QR code
     * POST /api/2fa/generer
     * Body : { admin_id: 1 }
     */
    public function generer() {
        $data = json_decode(file_get_contents("php://input"), true);
        $admin_id = (int)($data['admin_id'] ?? 0);

        if (!$admin_id) {
            http_response_code(400);
            echo json_encode(["erreur" => "admin_id requis"]);
            return;
        }

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("SELECT email, nom FROM admins WHERE id = ?");
        $stmt->execute([$admin_id]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$admin) {
            http_response_code(404);
            echo json_encode(["erreur" => "Admin introuvable"]);
            return;
        }

        $service = new TwoFactorService();
        $secret = $service->genererSecret();
        $url = $service->genererURL($secret, $admin['email']);

        // Sauvegarder temporairement le secret (pas encore actif)
        $db->prepare("UPDATE admins SET twofa_secret = ?, twofa_actif = 0 WHERE id = ?")
           ->execute([$secret, $admin_id]);

        echo json_encode([
            "success" => true,
            "secret" => $secret,
            "url" => $url,
            "email" => $admin['email']
        ]);
    }

    /**
     * Étape 2 : Vérifier le code et activer le 2FA
     * POST /api/2fa/activer
     * Body : { admin_id: 1, code: "123456" }
     */
    public function activer() {
        $data = json_decode(file_get_contents("php://input"), true);
        $admin_id = (int)($data['admin_id'] ?? 0);
        $code = trim($data['code'] ?? '');

        if (!$admin_id || !$code) {
            http_response_code(400);
            echo json_encode(["erreur" => "admin_id et code requis"]);
            return;
        }

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("SELECT twofa_secret FROM admins WHERE id = ?");
        $stmt->execute([$admin_id]);
        $secret = $stmt->fetchColumn();

        if (!$secret) {
            http_response_code(400);
            echo json_encode(["erreur" => "Aucun secret généré"]);
            return;
        }

        $service = new TwoFactorService();
        if (!$service->verifierCode($secret, $code)) {
            http_response_code(400);
            echo json_encode(["erreur" => "Code incorrect"]);
            return;
        }

        // Générer les backup codes
        $backupCodes = $service->genererBackupCodes();
        $backupJson = json_encode($backupCodes);

        $db->prepare("
            UPDATE admins
            SET twofa_actif = 1, twofa_backup_codes = ?
            WHERE id = ?
        ")->execute([$backupJson, $admin_id]);

        // Log audit
        $this->logAudit($admin_id, '2fa_activer', '2FA activé');

        echo json_encode([
            "success" => true,
            "backup_codes" => $backupCodes
        ]);
    }

    /**
     * Vérifier un code 2FA à la connexion
     * POST /api/2fa/verifier
     * Body : { admin_id: 1, code: "123456" }
     */
    public function verifier() {
        $data = json_decode(file_get_contents("php://input"), true);
        $admin_id = (int)($data['admin_id'] ?? 0);
        $code = trim($data['code'] ?? '');

        if (!$admin_id || !$code) {
            http_response_code(400);
            echo json_encode(["erreur" => "admin_id et code requis"]);
            return;
        }

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("
            SELECT twofa_secret, twofa_backup_codes
            FROM admins WHERE id = ?
        ");
        $stmt->execute([$admin_id]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$admin) {
            http_response_code(404);
            echo json_encode(["erreur" => "Admin introuvable"]);
            return;
        }

        $service = new TwoFactorService();

        // 1. Vérifier le code TOTP
        if ($service->verifierCode($admin['twofa_secret'], $code)) {
            echo json_encode(["success" => true]);
            return;
        }

        // 2. Vérifier un backup code
        $resultat = $service->verifierBackupCode($admin['twofa_backup_codes'], $code);
        if ($resultat && $resultat['valide']) {
            // Mettre à jour les codes restants
            $db->prepare("UPDATE admins SET twofa_backup_codes = ? WHERE id = ?")
               ->execute([$resultat['codes_restants'], $admin_id]);
            echo json_encode(["success" => true, "backup_utilise" => true]);
            return;
        }

        http_response_code(400);
        echo json_encode(["erreur" => "Code invalide"]);
    }

    /**
     * Désactiver le 2FA
     * POST /api/2fa/desactiver
     * Body : { admin_id: 1, mot_de_passe: "..." }
     */
    public function desactiver() {
        $data = json_decode(file_get_contents("php://input"), true);
        $admin_id = (int)($data['admin_id'] ?? 0);
        $motDePasse = $data['mot_de_passe'] ?? '';

        if (!$admin_id || !$motDePasse) {
            http_response_code(400);
            echo json_encode(["erreur" => "admin_id et mot_de_passe requis"]);
            return;
        }

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("SELECT mot_de_passe FROM admins WHERE id = ?");
        $stmt->execute([$admin_id]);
        $hash = $stmt->fetchColumn();

        if (!password_verify($motDePasse, $hash)) {
            http_response_code(403);
            echo json_encode(["erreur" => "Mot de passe incorrect"]);
            return;
        }

        $db->prepare("
            UPDATE admins
            SET twofa_actif = 0, twofa_secret = NULL, twofa_backup_codes = NULL
            WHERE id = ?
        ")->execute([$admin_id]);

        $this->logAudit($admin_id, '2fa_desactiver', '2FA désactivé');

        echo json_encode(["success" => true]);
    }

    /**
     * Statut du 2FA
     * GET /api/2fa/statut?admin_id=1
     */
    public function statut() {
        $admin_id = (int)($_GET['admin_id'] ?? 0);

        if (!$admin_id) {
            http_response_code(400);
            echo json_encode(["erreur" => "admin_id requis"]);
            return;
        }

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("
            SELECT twofa_actif, twofa_backup_codes FROM admins WHERE id = ?
        ");
        $stmt->execute([$admin_id]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        $codes = json_decode($admin['twofa_backup_codes'] ?? '[]', true) ?: [];

        echo json_encode([
            "actif" => (bool)$admin['twofa_actif'],
            "backup_codes_restants" => count($codes)
        ]);
    }

    private function logAudit($admin_id, $action, $details = '') {
        try {
            $db = (new Database())->getConnection();
            $stmt = $db->prepare("
                INSERT INTO audit_log (admin_id, action, details, ip, user_agent)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $admin_id,
                $action,
                $details,
                $_SERVER['REMOTE_ADDR'] ?? '',
                $_SERVER['HTTP_USER_AGENT'] ?? ''
            ]);
        } catch (Exception $e) {}
    }
}