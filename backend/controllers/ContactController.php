<?php
/**
 * Contrôleur Contact
 * Reçoit les messages du formulaire public et envoie un email via PHPMailer
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class ContactController
{
    /**
     * POST /api/contact
     * Reçoit les données du formulaire et envoie un email
     */
    public function envoyer()
    {
        // ===== 1. Vérifier la méthode =====
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Méthode non autorisée',
            ]);
            return;
        }

        // ===== 2. Récupérer les données JSON =====
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (!$data) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Données invalides',
            ]);
            return;
        }

        // ===== 3. Valider les champs =====
        $nom       = trim($data['nom'] ?? '');
        $email     = trim($data['email'] ?? '');
        $telephone = trim($data['telephone'] ?? '');
        $sujet     = trim($data['sujet'] ?? '');
        $message   = trim($data['message'] ?? '');

        $erreurs = [];

        if (empty($nom) || mb_strlen($nom) < 2) {
            $erreurs[] = 'Le nom est requis (2 caractères minimum)';
        }

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $erreurs[] = 'Email invalide';
        }

        if (empty($sujet) || mb_strlen($sujet) < 3) {
            $erreurs[] = 'Le sujet est requis (3 caractères minimum)';
        }

        if (empty($message) || mb_strlen($message) < 10) {
            $erreurs[] = 'Le message est requis (10 caractères minimum)';
        }

        // Anti-spam basique : vérifier si trop de liens
        $nbLiens = preg_match_all('/https?:\/\//i', $message);
        if ($nbLiens > 3) {
            $erreurs[] = 'Trop de liens dans le message';
        }

        if (!empty($erreurs)) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Erreurs de validation',
                'erreurs' => $erreurs,
            ]);
            return;
        }

        // ===== 4. Charger la config et PHPMailer =====
        $config = require __DIR__ . '/../config/mail.php';

        require_once __DIR__ . '/../libs/PHPMailer/src/Exception.php';
        require_once __DIR__ . '/../libs/PHPMailer/src/PHPMailer.php';
        require_once __DIR__ . '/../libs/PHPMailer/src/SMTP.php';

        // ===== 5. Envoyer l'email =====
        $mail = new PHPMailer(true);

        try {
            // --- Configuration SMTP ---
            $mail->isSMTP();
            $mail->Host       = $config['host'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $config['username'];
            $mail->Password   = $config['password'];
            $mail->SMTPSecure = $config['encryption'] === 'ssl'
                ? PHPMailer::ENCRYPTION_SMTPS
                : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = $config['port'];
            $mail->CharSet    = $config['charset'];

            if ($config['debug'] > 0) {
                $mail->SMTPDebug = $config['debug'];
            }

            // --- Expéditeur ---
            $mail->setFrom($config['from_email'], $config['from_name']);

            // --- Destinataire ---
            $mail->addAddress($config['to_email'], $config['to_name']);

            // --- Répondre à (le client) ---
            $mail->addReplyTo($email, $nom);

            // --- Contenu ---
            $mail->isHTML(true);
            $mail->Subject = "📩 Nouveau message : {$sujet}";

            // Corps HTML
            $corps = $this->construireCorpsEmail($nom, $email, $telephone, $sujet, $message);
            $mail->Body    = $corps;
            $mail->AltBody = strip_tags($corps); // Version texte brut

            // --- Envoyer ---
            $mail->send();

            // ===== 6. Succès =====
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Message envoyé avec succès',
            ]);

        } catch (Exception $e) {
            // ===== 7. Erreur =====
            error_log("Erreur envoi email : " . $mail->ErrorInfo);

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => "Erreur lors de l'envoi. Veuillez réessayer.",
                // En développement uniquement :
                'debug' => $config['debug'] > 0 ? $mail->ErrorInfo : null,
            ]);
        }
    }

    /**
     * Construit le corps HTML de l'email
     */
    private function construireCorpsEmail($nom, $email, $telephone, $sujet, $message)
    {
        $nomEsc       = htmlspecialchars($nom, ENT_QUOTES, 'UTF-8');
        $emailEsc     = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
        $telEsc       = htmlspecialchars($telephone ?: 'Non renseigné', ENT_QUOTES, 'UTF-8');
        $sujetEsc     = htmlspecialchars($sujet, ENT_QUOTES, 'UTF-8');
        $messageEsc   = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));
        $date         = date('d/m/Y à H:i');

        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1E40AF, #06B6D4); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; }
        .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 30px; }
        .info { background: #f9fafb; border-left: 4px solid #06B6D4; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        .info-row { display: flex; margin-bottom: 8px; }
        .info-label { font-weight: bold; width: 100px; color: #1E40AF; }
        .info-value { color: #333; }
        .message-box { background: #f9fafb; border-radius: 8px; padding: 20px; margin-top: 20px; }
        .message-box h3 { margin: 0 0 15px 0; color: #1E40AF; font-size: 16px; }
        .message-content { color: #333; line-height: 1.6; }
        .footer { background: #0A1628; color: #9CA3AF; padding: 20px; text-align: center; font-size: 12px; }
        .footer a { color: #67E8F9; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📩 Nouveau message de contact</h1>
            <p>Cyber Famille Solofoson</p>
        </div>
        
        <div class="content">
            <div class="info">
                <div class="info-row">
                    <span class="info-label">Nom :</span>
                    <span class="info-value">{$nomEsc}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email :</span>
                    <span class="info-value"><a href="mailto:{$emailEsc}">{$emailEsc}</a></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Téléphone :</span>
                    <span class="info-value">{$telEsc}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Sujet :</span>
                    <span class="info-value">{$sujetEsc}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Date :</span>
                    <span class="info-value">{$date}</span>
                </div>
            </div>
            
            <div class="message-box">
                <h3>💬 Message</h3>
                <div class="message-content">{$messageEsc}</div>
            </div>
        </div>
        
        <div class="footer">
            Cet email a été envoyé depuis le formulaire de contact de<br>
            <a href="#">Cyber Famille Solofoson</a> — Ambalavao 303
        </div>
    </div>
</body>
</html>
HTML;
    }
}