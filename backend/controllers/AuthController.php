<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/TwoFactorService.php';

class AuthController {

    private $maxTentatives = 5;
    private $fenetreMinutes = 15;

    public function login() {
        $data = json_decode(file_get_contents("php://input"), true);
        $email = trim($data['email'] ?? '');
        $mot_de_passe = $data['mot_de_passe'] ?? '';
        $code_2fa = trim($data['code_2fa'] ?? '');

        $ip = $_SERVER['REMOTE_ADDR'] ?? '';

        if (!$email || !$mot_de_passe) {
            http_response_code(400);
            echo json_encode(["erreur" => "Email et mot de passe requis"]);
            return;
        }

        $db = (new Database())->getConnection();

        // 1. Vérifier anti-brute force
        if ($this->estBloque($email, $ip)) {
            http_response_code(429);
            echo json_encode([
                "erreur" => "Trop de tentatives. Réessayez dans 15 minutes."
            ]);
            return;
        }

        // 2. Vérifier les identifiants
        $stmt = $db->prepare("
            SELECT id, nom, email, mot_de_passe, role,
                   twofa_secret, twofa_actif
            FROM admins WHERE email = ?
        ");
        $stmt->execute([$email]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$admin || !password_verify($mot_de_passe, $admin['mot_de_passe'])) {
            $this->logTentative($email, $ip, 'echoue');
            http_response_code(401);
            echo json_encode(["erreur" => "Identifiants incorrects"]);
            return;
        }

        // 3. Vérifier 2FA si actif
        if ($admin['twofa_actif']) {
            if (!$code_2fa) {
                echo json_encode([
                    "success" => false,
                    "requires_2fa" => true,
                    "admin_id" => $admin['id'],
                    "message" => "Code 2FA requis"
                ]);
                return;
            }

            $service = new TwoFactorService();
            $codeValide = $service->verifierCode($admin['twofa_secret'], $code_2fa);

            // Vérifier aussi les backup codes
            if (!$codeValide) {
                $stmt = $db->prepare("SELECT twofa_backup_codes FROM admins WHERE id = ?");
                $stmt->execute([$admin['id']]);
                $backup = $stmt->fetchColumn();
                $resultat = $service->verifierBackupCode($backup, $code_2fa);
                if ($resultat && $resultat['valide']) {
                    $db->prepare("UPDATE admins SET twofa_backup_codes = ? WHERE id = ?")
                       ->execute([$resultat['codes_restants'], $admin['id']]);
                    $codeValide = true;
                }
            }

            if (!$codeValide) {
                $this->logTentative($email, $ip, 'echoue');
                http_response_code(401);
                echo json_encode(["erreur" => "Code 2FA invalide"]);
                return;
            }
        }

        // 4. Succès : log + création du token
        $this->logTentative($email, $ip, 'reussi');

        $token = bin2hex(random_bytes(32));
        $expire = date('Y-m-d H:i:s', strtotime('+8 hours'));

        $ins = $db->prepare("
            INSERT INTO sessions_admin (admin_id, token, expire_le)
            VALUES (?, ?, ?)
        ");
        $ins->execute([$admin['id'], $token, $expire]);

        // 5. Enregistrer la session active
        $device = $this->detecterDevice($_SERVER['HTTP_USER_AGENT'] ?? '');
        $db->prepare("
            INSERT INTO sessions_actives
            (admin_id, token, device, ip, user_agent)
            VALUES (?, ?, ?, ?, ?)
        ")->execute([
            $admin['id'],
            $token,
            $device,
            $ip,
            $_SERVER['HTTP_USER_AGENT'] ?? ''
        ]);

        // 6. Log audit
        $this->logAudit($admin['id'], 'login', 'Connexion réussie');

        echo json_encode([
            "success" => true,
            "token" => $token,
            "admin" => [
                "id" => $admin['id'],
                "nom" => $admin['nom'],
                "email" => $admin['email'],
                "role" => $admin['role'],
                "twofa_actif" => (bool)$admin['twofa_actif']
            ]
        ]);
    }

    public function verifier() {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');

        if (!$token) {
            http_response_code(401);
            echo json_encode(["valide" => false]);
            return;
        }

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("
            SELECT a.id, a.nom, a.email, a.role, a.twofa_actif
            FROM sessions_admin s
            JOIN admins a ON a.id = s.admin_id
            WHERE s.token = ? AND s.expire_le > NOW()
        ");
        $stmt->execute([$token]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$admin) {
            http_response_code(401);
            echo json_encode(["valide" => false]);
            return;
        }

        // Mettre à jour la dernière activité
        $db->prepare("
            UPDATE sessions_actives
            SET derniere_activite = NOW()
            WHERE token = ?
        ")->execute([$token]);

        $admin['twofa_actif'] = (bool)$admin['twofa_actif'];

        echo json_encode(["valide" => true, "admin" => $admin]);
    }

    public function logout() {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');

        if ($token) {
            $db = (new Database())->getConnection();
            $db->prepare("DELETE FROM sessions_admin WHERE token = ?")->execute([$token]);
            $db->prepare("DELETE FROM sessions_actives WHERE token = ?")->execute([$token]);
        }

        echo json_encode(["success" => true]);
    }

    // ===== Helpers =====

    private function estBloque($email, $ip) {
        $db = (new Database())->getConnection();
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM tentatives_connexion
            WHERE (email = ? OR ip = ?)
              AND statut = 'echoue'
              AND cree_le >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
        ");
        $stmt->execute([$email, $ip, $this->fenetreMinutes]);
        return $stmt->fetchColumn() >= $this->maxTentatives;
    }

    private function logTentative($email, $ip, $statut) {
        try {
            $db = (new Database())->getConnection();
            $stmt = $db->prepare("
                INSERT INTO tentatives_connexion (email, ip, statut)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$email, $ip, $statut]);
        } catch (Exception $e) {}
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

    private function detecterDevice($ua) {
        if (preg_match('/Mobile|Android|iPhone|iPad/i', $ua)) {
            if (preg_match('/iPhone/i', $ua)) return 'iPhone';
            if (preg_match('/iPad/i', $ua)) return 'iPad';
            if (preg_match('/Android/i', $ua)) return 'Android';
            return 'Mobile';
        }
        if (preg_match('/Windows/i', $ua)) return 'Windows';
        if (preg_match('/Macintosh|Mac OS X/i', $ua)) return 'Mac';
        if (preg_match('/Linux/i', $ua)) return 'Linux';
        return 'Inconnu';
    }
}