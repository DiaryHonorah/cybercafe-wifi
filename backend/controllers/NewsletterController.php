<?php
/**
 * Contrôleur Newsletter
 * Gère les inscriptions, confirmations et envois de newsletter
 */

use PHPMailer\PHPMailer\PHPMailer;

require_once __DIR__ . '/../models/Newsletter.php';

class NewsletterController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Newsletter($this->db);
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
     * POST /api/newsletter/inscription — Inscrire un email (PUBLIC)
     */
    public function inscription()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || empty($data['email'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email requis',
                ]);
                return;
            }

            $email = strtolower(trim($data['email']));
            $nom = isset($data['nom']) ? trim($data['nom']) : null;
            $source = $data['source'] ?? 'site';

            // Inscrire
            $abonne = $this->model->inscrire($email, $nom, $source);

            // Envoyer email de confirmation
            $this->envoyerEmailConfirmation($abonne);

            echo json_encode([
                'success' => true,
                'message' => 'Un email de confirmation vous a été envoyé. Vérifiez votre boîte.',
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
     * GET /api/newsletter/confirmer?token=X — Confirmer inscription
     */
    public function confirmer()
    {
        try {
            $token = $_GET['token'] ?? null;
            if (!$token) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Token manquant',
                ]);
                return;
            }

            $abonne = $this->model->confirmer($token);

            // Rediriger vers une page de succès si navigateur
            $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
            if (strpos($accept, 'text/html') !== false) {
                header('Location: http://localhost:5173/newsletter?confirme=1');
                exit;
            }

            echo json_encode([
                'success' => true,
                'message' => 'Inscription confirmée !',
                'email'   => $abonne['email'],
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
     * GET /api/newsletter/desinscrire?token=X ou ?email=X
     */
    public function desinscrire()
    {
        try {
            $token = $_GET['token'] ?? null;
            $email = $_GET['email'] ?? null;

            if (!$token && !$email) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Token ou email requis',
                ]);
                return;
            }

            $this->model->desinscrire($token ?: $email);

            // Rediriger si navigateur
            $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
            if (strpos($accept, 'text/html') !== false) {
                header('Location: http://localhost:5173/newsletter?desinscrit=1');
                exit;
            }

            echo json_encode([
                'success' => true,
                'message' => 'Désinscription effectuée',
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
     * GET /api/newsletter/stats-publiques — Stats publiques
     */
    public function statsPubliques()
    {
        try {
            $stats = $this->model->stats();
            echo json_encode([
                'success' => true,
                'stats'   => [
                    'total_abonnes' => intval($stats['actifs'] ?? 0),
                ],
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
     * GET /api/newsletter/admin/abonnes — Liste abonnés
     */
    public function listeAbonnes()
    {
        try {
            $this->verifierAdmin();

            $filtres = [
                'confirme'  => isset($_GET['confirme']) ? intval($_GET['confirme']) : null,
                'actif'     => isset($_GET['actif']) ? intval($_GET['actif']) : null,
                'recherche' => $_GET['recherche'] ?? null,
            ];

            $abonnes = $this->model->liste($filtres);

            echo json_encode([
                'success' => true,
                'abonnes' => $abonnes,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/newsletter/admin/stats — Statistiques
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
     * POST /api/newsletter/admin/supprimer — Supprimer un abonné
     */
    public function supprimerAbonne()
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

            $stmt = $this->db->prepare("DELETE FROM newsletter_abonnes WHERE id = :id");
            $stmt->execute([':id' => $id]);

            echo json_encode(['success' => true, 'message' => 'Abonné supprimé']);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/newsletter/admin/envoyer — Envoyer une newsletter
     */
    public function envoyer()
    {
        try {
            $admin = $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || empty($data['sujet']) || empty($data['contenu'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Sujet et contenu requis',
                ]);
                return;
            }

            $sujet = trim($data['sujet']);
            $contenu = $data['contenu'];

            // Créer l'enregistrement d'envoi
            $envoiId = $this->model->creerEnvoi($sujet, $contenu, $admin['id']);

            // Récupérer les abonnés actifs
            $abonnes = $this->model->getActifs();

            if (empty($abonnes)) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Aucun abonné actif',
                ]);
                return;
            }

            // Envoyer à chacun
            $nbEnvoyes = 0;
            $nbEchecs = 0;

            foreach ($abonnes as $abonne) {
                $success = $this->envoyerEmailNewsletter(
                    $abonne['email'],
                    $abonne['nom'],
                    $sujet,
                    $contenu,
                    $abonne['id']
                );

                if ($success) {
                    $nbEnvoyes++;
                } else {
                    $nbEchecs++;
                }

                // Petite pause pour éviter le rate limit Gmail
                usleep(200000); // 0.2s
            }

            // Mettre à jour les stats
            $this->model->majStatsEnvoi($envoiId, $nbEnvoyes, $nbEchecs);

            echo json_encode([
                'success' => true,
                'message' => "Newsletter envoyée : $nbEnvoyes succès, $nbEchecs échecs",
                'nb_envoyes' => $nbEnvoyes,
                'nb_echecs'  => $nbEchecs,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/newsletter/admin/envois — Historique des envois
     */
    public function listeEnvois()
    {
        try {
            $this->verifierAdmin();
            $envois = $this->model->listeEnvois(50);
            echo json_encode(['success' => true, 'envois' => $envois]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // HELPERS EMAIL
    // =====================================================

    private function envoyerEmailConfirmation($abonne)
    {
        $token = $abonne['token_confirmation'];
        $lienConfirm = "http://localhost/cybercafe-wifi/backend/api/newsletter/confirmer?token=$token";
        $lienDesinscrire = "http://localhost/cybercafe-wifi/backend/api/newsletter/desinscrire?token=$token";

        $nom = $abonne['nom'] ? htmlspecialchars($abonne['nom']) : 'Cher client';

        $corps = <<<HTML
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family: Arial; background: #f5f5f5; padding: 20px; margin:0;">
<div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #1E40AF, #06B6D4); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">📧 Confirmez votre inscription</h1>
        <p style="margin: 8px 0 0;">Cyber Famille Solofoson</p>
    </div>
    <div style="padding: 30px;">
        <p>Bonjour <strong>{$nom}</strong>,</p>
        <p>Merci de votre intérêt pour la newsletter de <strong>Cyber Famille Solofoson</strong> !</p>
        <p>Pour finaliser votre inscription, cliquez sur le bouton ci-dessous :</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{$lienConfirm}" style="display: inline-block; background: linear-gradient(135deg, #06B6D4, #1E40AF); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                ✅ Confirmer mon inscription
            </a>
        </div>
        <p style="font-size: 12px; color: #6B7280;">Ou copiez ce lien dans votre navigateur :<br>
        <a href="{$lienConfirm}" style="color: #06B6D4; word-break: break-all;">{$lienConfirm}</a></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #9CA3AF;">Vous recevez cet email car vous vous êtes inscrit sur notre site.<br>
        Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.<br>
        <a href="{$lienDesinscrire}" style="color: #9CA3AF;">Se désinscrire</a></p>
    </div>
    <div style="background: #0A1628; color: #9CA3AF; padding: 20px; text-align: center; font-size: 12px;">
        Cyber Famille Solofoson — Ambalavao 303<br>📞 +261 34 22 489 66
    </div>
</div>
</body></html>
HTML;

        return $this->envoyerEmail(
            $abonne['email'],
            $abonne['nom'],
            "📧 Confirmez votre inscription - Cyber Famille",
            $corps
        );
    }

    private function envoyerEmailNewsletter($toEmail, $toName, $sujet, $contenu, $abonneId)
    {
        // Ajouter footer avec lien désinscription
        $lienDesinscrire = "http://localhost/cybercafe-wifi/backend/api/newsletter/desinscrire?email=" . urlencode($toEmail);

        $corps = <<<HTML
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family: Arial; background: #f5f5f5; padding: 20px; margin:0;">
<div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #1E40AF, #06B6D4); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">Cyber Famille Solofoson</h1>
        <p style="margin: 8px 0 0; font-size: 14px;">Newsletter</p>
    </div>
    <div style="padding: 30px; line-height: 1.6; color: #333;">
        {$contenu}
    </div>
    <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6B7280; border-top: 1px solid #e5e7eb;">
        <p style="margin: 5px 0;">Cyber Famille Solofoson — Ambalavao 303<br>📞 +261 34 22 489 66</p>
        <p style="margin: 15px 0 0 0;">
            <a href="{$lienDesinscrire}" style="color: #9CA3AF; text-decoration: underline;">Se désinscrire</a>
        </p>
    </div>
</div>
</body></html>
HTML;

        return $this->envoyerEmail($toEmail, $toName, $sujet, $corps);
    }

    private function envoyerEmail($toEmail, $toName, $sujet, $corpsHtml)
    {
        try {
            $config = require __DIR__ . '/../config/mail.php';

            $phpMailerPath = __DIR__ . '/../libs/PHPMailer/src/';
            if (!file_exists($phpMailerPath . 'PHPMailer.php')) {
                error_log("PHPMailer introuvable");
                return false;
            }

            require_once $phpMailerPath . 'Exception.php';
            require_once $phpMailerPath . 'PHPMailer.php';
            require_once $phpMailerPath . 'SMTP.php';

            $mail = new PHPMailer(true);

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

            $mail->setFrom($config['from_email'], $config['from_name']);
            $mail->addAddress($toEmail, $toName ?: '');

            $mail->isHTML(true);
            $mail->Subject = $sujet;
            $mail->Body    = $corpsHtml;
            $mail->AltBody = strip_tags($corpsHtml);

            $mail->send();
            return true;

        } catch (\Exception $e) {
            error_log("Erreur email newsletter : " . $e->getMessage());
            return false;
        }
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