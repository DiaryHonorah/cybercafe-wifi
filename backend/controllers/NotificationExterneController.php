<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/MailService.php';
require_once __DIR__ . '/../services/SmsService.php';

class NotificationExterneController {

    /**
     * Récupérer la config email/sms
     * GET /api/notifications-externes/config
     */
    public function getConfig() {
        $db = (new Database())->getConnection();
        $stmt = $db->query("SELECT * FROM config_notifications ORDER BY id ASC");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $resultat = [];
        foreach ($rows as $row) {
            // Masquer les mots de passe
            if (!empty($row['smtp_password'])) $row['smtp_password'] = '••••••••';
            if (!empty($row['sms_api_secret'])) $row['sms_api_secret'] = '••••••••';
            $resultat[$row['type']] = $row;
        }

        echo json_encode($resultat);
    }

    /**
     * Sauvegarder la config
     * POST /api/notifications-externes/config
     * Body : { "type": "email"|"sms", ... }
     */
    public function saveConfig() {
        $data = json_decode(file_get_contents("php://input"), true);
        $type = $data['type'] ?? 'email';

        if (!in_array($type, ['email', 'sms'])) {
            http_response_code(400);
            echo json_encode(["erreur" => "Type invalide"]);
            return;
        }

        $db = (new Database())->getConnection();
        $actif = !empty($data['actif']) ? 1 : 0;

        if ($type === 'email') {
            $smtp_password = $data['smtp_password'] ?? '';
            if ($smtp_password === '••••••••') {
                // Ne pas modifier
                $stmt = $db->prepare("
                    UPDATE config_notifications SET
                        actif = ?,
                        smtp_host = ?,
                        smtp_port = ?,
                        smtp_user = ?,
                        smtp_secure = ?,
                        email_from = ?,
                        email_from_nom = ?,
                        destinataires_email = ?,
                        alerte_vente = ?,
                        alerte_expiration = ?,
                        alerte_stock_faible = ?,
                        alerte_rapport_journalier = ?
                    WHERE type = 'email'
                ");
                $stmt->execute([
                    $actif,
                    $data['smtp_host'] ?? '',
                    (int)($data['smtp_port'] ?? 587),
                    $data['smtp_user'] ?? '',
                    $data['smtp_secure'] ?? 'tls',
                    $data['email_from'] ?? '',
                    $data['email_from_nom'] ?? 'Cyber Famille',
                    $data['destinataires_email'] ?? '',
                    !empty($data['alerte_vente']) ? 1 : 0,
                    !empty($data['alerte_expiration']) ? 1 : 0,
                    !empty($data['alerte_stock_faible']) ? 1 : 0,
                    !empty($data['alerte_rapport_journalier']) ? 1 : 0
                ]);
            } else {
                $stmt = $db->prepare("
                    UPDATE config_notifications SET
                        actif = ?,
                        smtp_host = ?,
                        smtp_port = ?,
                        smtp_user = ?,
                        smtp_password = ?,
                        smtp_secure = ?,
                        email_from = ?,
                        email_from_nom = ?,
                        destinataires_email = ?,
                        alerte_vente = ?,
                        alerte_expiration = ?,
                        alerte_stock_faible = ?,
                        alerte_rapport_journalier = ?
                    WHERE type = 'email'
                ");
                $stmt->execute([
                    $actif,
                    $data['smtp_host'] ?? '',
                    (int)($data['smtp_port'] ?? 587),
                    $data['smtp_user'] ?? '',
                    $smtp_password,
                    $data['smtp_secure'] ?? 'tls',
                    $data['email_from'] ?? '',
                    $data['email_from_nom'] ?? 'Cyber Famille',
                    $data['destinataires_email'] ?? '',
                    !empty($data['alerte_vente']) ? 1 : 0,
                    !empty($data['alerte_expiration']) ? 1 : 0,
                    !empty($data['alerte_stock_faible']) ? 1 : 0,
                    !empty($data['alerte_rapport_journalier']) ? 1 : 0
                ]);
            }
        } else {
            // SMS
            $api_secret = $data['sms_api_secret'] ?? '';
            if ($api_secret === '••••••••') {
                $stmt = $db->prepare("
                    UPDATE config_notifications SET
                        actif = ?,
                        sms_provider = ?,
                        sms_api_key = ?,
                        sms_from = ?,
                        destinataires_sms = ?,
                        alerte_vente = ?,
                        alerte_expiration = ?,
                        alerte_stock_faible = ?,
                        alerte_rapport_journalier = ?
                    WHERE type = 'sms'
                ");
                $stmt->execute([
                    $actif,
                    $data['sms_provider'] ?? 'twilio',
                    $data['sms_api_key'] ?? '',
                    $data['sms_from'] ?? '',
                    $data['destinataires_sms'] ?? '',
                    !empty($data['alerte_vente']) ? 1 : 0,
                    !empty($data['alerte_expiration']) ? 1 : 0,
                    !empty($data['alerte_stock_faible']) ? 1 : 0,
                    !empty($data['alerte_rapport_journalier']) ? 1 : 0
                ]);
            } else {
                $stmt = $db->prepare("
                    UPDATE config_notifications SET
                        actif = ?,
                        sms_provider = ?,
                        sms_api_key = ?,
                        sms_api_secret = ?,
                        sms_from = ?,
                        destinataires_sms = ?,
                        alerte_vente = ?,
                        alerte_expiration = ?,
                        alerte_stock_faible = ?,
                        alerte_rapport_journalier = ?
                    WHERE type = 'sms'
                ");
                $stmt->execute([
                    $actif,
                    $data['sms_provider'] ?? 'twilio',
                    $data['sms_api_key'] ?? '',
                    $api_secret,
                    $data['sms_from'] ?? '',
                    $data['destinataires_sms'] ?? '',
                    !empty($data['alerte_vente']) ? 1 : 0,
                    !empty($data['alerte_expiration']) ? 1 : 0,
                    !empty($data['alerte_stock_faible']) ? 1 : 0,
                    !empty($data['alerte_rapport_journalier']) ? 1 : 0
                ]);
            }
        }

        echo json_encode(["success" => true]);
    }

    /**
     * Tester l'envoi d'email
     * POST /api/notifications-externes/test-email
     */
    public function testEmail() {
        $mail = new MailService();
        $r = $mail->envoyer(
            $_POST['destinataire'] ?? '',
            "Test de configuration",
            "<h2>✅ Test réussi !</h2><p>Votre configuration email fonctionne correctement.</p>"
        );
        echo json_encode($r);
    }

    /**
     * Tester l'envoi de SMS
     * POST /api/notifications-externes/test-sms
     */
    public function testSms() {
        $sms = new SmsService();
        $r = $sms->envoyer(
            $_POST['destinataire'] ?? '',
            "Test Cyber Famille : configuration SMS OK"
        );
        echo json_encode($r);
    }

    /**
     * Envoyer un email manuellement
     * POST /api/notifications-externes/envoyer-email
     * Body : { destinataires, sujet, message }
     */
    public function envoyerEmail() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['destinataires']) || empty($data['sujet'])) {
            http_response_code(400);
            echo json_encode(["erreur" => "Destinataires et sujet requis"]);
            return;
        }

        $mail = new MailService();
        $r = $mail->envoyer(
            $data['destinataires'],
            $data['sujet'],
            $data['message'] ?? ''
        );

        echo json_encode($r);
    }

    /**
     * Historique des envois
     * GET /api/notifications-externes/historique
     */
    public function historique() {
        $db = (new Database())->getConnection();
        $stmt = $db->query("
            SELECT id, type, sujet, message, destinataires, statut, erreur, cree_le
            FROM historique_notifications
            ORDER BY cree_le DESC
            LIMIT 50
        ");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Statistiques
     * GET /api/notifications-externes/stats
     */
    public function stats() {
        $db = (new Database())->getConnection();

        $total = $db->query("SELECT COUNT(*) FROM historique_notifications")->fetchColumn();
        $email = $db->query("SELECT COUNT(*) FROM historique_notifications WHERE type = 'email'")->fetchColumn();
        $sms = $db->query("SELECT COUNT(*) FROM historique_notifications WHERE type = 'sms'")->fetchColumn();
        $echecs = $db->query("SELECT COUNT(*) FROM historique_notifications WHERE statut = 'echoue'")->fetchColumn();

        echo json_encode([
            "total" => (int)$total,
            "email" => (int)$email,
            "sms" => (int)$sms,
            "echecs" => (int)$echecs
        ]);
    }
}