<?php
/**
 * Contrôleur Reservation
 * Gère les réservations de postes (public + admin)
 * 
 * Connexion : utilise la classe Database existante (config/database.php)
 * Authentification : token via header Authorization: Bearer XXX
 * Base de données : cybercafe_db
 */

use PHPMailer\PHPMailer\PHPMailer;

require_once __DIR__ . '/../models/Reservation.php';

class ReservationController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Reservation($this->db);
    }

    /**
     * Connexion via la classe Database existante
     */
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

        throw new Exception("Classe Database introuvable dans config/database.php");
    }

    // =====================================================
    // ROUTES PUBLIQUES
    // =====================================================

    /**
     * POST /api/reservations — Créer une réservation (PUBLIC)
     */
    public function creer()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Données invalides',
                ]);
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

            $conflit = $this->verifierConflit(
                $data['date_reservation'],
                $data['heure_reservation'],
                $data['duree'],
                intval($data['nombre_postes'])
            );

            if ($conflit) {
                http_response_code(409);
                echo json_encode([
                    'success' => false,
                    'message' => $conflit,
                ]);
                return;
            }

            $reservation = $this->model->creer([
                'nom'              => trim($data['nom']),
                'email'            => trim($data['email']),
                'telephone'        => trim($data['telephone']),
                'date_reservation' => $data['date_reservation'],
                'heure_reservation'=> $data['heure_reservation'],
                'duree'            => $data['duree'],
                'nombre_postes'    => intval($data['nombre_postes']),
                'message'          => trim($data['message'] ?? ''),
            ]);

            $emailClient = $this->envoyerEmailClient($reservation);
            $this->envoyerEmailAdmin($reservation);

            if ($emailClient) {
                $this->model->marquerEmailEnvoye($reservation['id']);
            }

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Réservation enregistrée avec succès',
                'reservation' => [
                    'id'     => intval($reservation['id']),
                    'code'   => $reservation['code_reservation'],
                    'statut' => $reservation['statut'],
                    'nom'    => $reservation['nom'],
                    'email'  => $reservation['email'],
                    'date_reservation'  => $reservation['date_reservation'],
                    'heure_reservation' => $reservation['heure_reservation'],
                    'duree'             => $reservation['duree'],
                    'nombre_postes'     => intval($reservation['nombre_postes']),
                ],
                'email_envoye' => $emailClient,
            ]);

        } catch (PDOException $e) {
            error_log("Erreur BDD réservation : " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur base de données',
            ]);
        } catch (Exception $e) {
            error_log("Erreur réservation : " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur serveur',
            ]);
        }
    }

    /**
     * GET /api/reservations/detail?code=RES-XXXXXX — Consulter (PUBLIC)
     */
    public function detail()
    {
        try {
            $code = $_GET['code'] ?? null;
            if (!$code) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Code manquant',
                ]);
                return;
            }

            $reservation = $this->model->trouverParCode($code);
            if (!$reservation) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Réservation introuvable',
                ]);
                return;
            }

            echo json_encode([
                'success' => true,
                'reservation' => $reservation,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }

    // =====================================================
    // ROUTES ADMIN
    // =====================================================

    /**
     * GET /api/reservations — Liste (ADMIN)
     */
    public function liste()
    {
        try {
            $this->verifierAdmin();

            $filtres = [
                'statut'      => $_GET['statut'] ?? null,
                'date_debut'  => $_GET['date_debut'] ?? null,
                'date_fin'    => $_GET['date_fin'] ?? null,
                'recherche'   => $_GET['recherche'] ?? null,
            ];

            $reservations = $this->model->liste($filtres);

            echo json_encode([
                'success' => true,
                'reservations' => $reservations,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * GET /api/reservations/stats — Statistiques (ADMIN)
     */
    public function stats()
    {
        try {
            $this->verifierAdmin();

            $stats = $this->model->stats();
            echo json_encode([
                'success' => true,
                'stats' => $stats,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * POST /api/reservations/confirmer — Confirmer (ADMIN)
     */
    public function confirmer()
    {
        try {
            $this->verifierAdmin();

            $data = json_decode(file_get_contents('php://input'), true);
            $id = intval($data['id'] ?? 0);

            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID manquant']);
                return;
            }

            $reservation = $this->model->trouverParId($id);
            if (!$reservation) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Réservation introuvable']);
                return;
            }

            $this->model->changerStatut($id, 'confirmee', null, $data['note_admin'] ?? null);

            $reservation['statut'] = 'confirmee';
            $this->envoyerEmailConfirmation($reservation);

            echo json_encode([
                'success' => true,
                'message' => 'Réservation confirmée',
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * POST /api/reservations/annuler — Annuler (ADMIN)
     */
    public function annuler()
    {
        try {
            $this->verifierAdmin();

            $data = json_decode(file_get_contents('php://input'), true);
            $id = intval($data['id'] ?? 0);
            $raison = trim($data['raison'] ?? 'Non spécifiée');

            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID manquant']);
                return;
            }

            $reservation = $this->model->trouverParId($id);
            if (!$reservation) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Réservation introuvable']);
                return;
            }

            $this->model->changerStatut($id, 'annulee', $raison);

            $reservation['statut'] = 'annulee';
            $reservation['raison_annulation'] = $raison;
            $this->envoyerEmailAnnulation($reservation);

            echo json_encode([
                'success' => true,
                'message' => 'Réservation annulée',
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * POST /api/reservations/terminer — Terminer (ADMIN)
     */
    public function terminer()
    {
        try {
            $this->verifierAdmin();

            $data = json_decode(file_get_contents('php://input'), true);
            $id = intval($data['id'] ?? 0);

            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID manquant']);
                return;
            }

            $this->model->changerStatut($id, 'terminee');

            echo json_encode([
                'success' => true,
                'message' => 'Réservation marquée comme terminée',
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * POST /api/reservations/supprimer — Supprimer (ADMIN)
     */
    public function supprimer()
    {
        try {
            $this->verifierAdmin();

            $data = json_decode(file_get_contents('php://input'), true);
            $id = intval($data['id'] ?? 0);

            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID manquant']);
                return;
            }

            $this->model->supprimer($id);

            echo json_encode([
                'success' => true,
                'message' => 'Réservation supprimée',
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }

    // =====================================================
    // MÉTHODES PRIVÉES — VALIDATION
    // =====================================================

    private function valider($data)
    {
        $erreurs = [];

        if (empty($data['nom']) || mb_strlen(trim($data['nom'])) < 2) {
            $erreurs['nom'] = 'Le nom est requis (2 caractères min)';
        }

        if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $erreurs['email'] = 'Email invalide';
        }

        if (empty($data['telephone']) || mb_strlen(trim($data['telephone'])) < 8) {
            $erreurs['telephone'] = 'Téléphone invalide';
        }

        if (empty($data['date_reservation'])) {
            $erreurs['date_reservation'] = 'Date requise';
        } else {
            $date = strtotime($data['date_reservation']);
            if ($date === false) {
                $erreurs['date_reservation'] = 'Date invalide';
            } elseif ($date < strtotime('today')) {
                $erreurs['date_reservation'] = 'La date ne peut pas être dans le passé';
            }
        }

        if (empty($data['heure_reservation'])) {
            $erreurs['heure_reservation'] = 'Heure requise';
        }

        $dureesValides = ['1h', '2h', '4h', 'Journée'];
        if (empty($data['duree']) || !in_array($data['duree'], $dureesValides)) {
            $erreurs['duree'] = 'Durée invalide';
        }

        $postes = intval($data['nombre_postes'] ?? 0);
        if ($postes < 1 || $postes > 5) {
            $erreurs['nombre_postes'] = 'Nombre de postes : entre 1 et 5';
        }

        return $erreurs;
    }

    private function verifierConflit($date, $heure, $duree, $postes)
    {
        $POSTES_TOTAL = 10;

        $dureesHeures = ['1h' => 1, '2h' => 2, '4h' => 4, 'Journée' => 10];
        $dureeHeures = $dureesHeures[$duree] ?? 1;

        $debut = strtotime("$date $heure");
        $fin = $debut + ($dureeHeures * 3600);

        $sql = "SELECT SUM(nombre_postes) as total_reserves
                FROM reservations
                WHERE date_reservation = :date
                AND statut IN ('en_attente', 'confirmee')
                AND (
                    (heure_reservation <= :heure_debut AND 
                     ADDTIME(heure_reservation, SEC_TO_TIME(
                        CASE duree
                            WHEN '1h' THEN 3600
                            WHEN '2h' THEN 7200
                            WHEN '4h' THEN 14400
                            WHEN 'Journée' THEN 36000
                        END
                     )) > :heure_debut)
                    OR
                    (heure_reservation < :heure_fin AND 
                     heure_reservation >= :heure_debut)
                )";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':date'         => $date,
            ':heure_debut'  => date('H:i:s', $debut),
            ':heure_fin'    => date('H:i:s', $fin),
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $dejaReserves = intval($result['total_reserves'] ?? 0);

        if ($dejaReserves + $postes > $POSTES_TOTAL) {
            return "Pas assez de postes disponibles sur ce créneau. " .
                   "Il reste " . ($POSTES_TOTAL - $dejaReserves) . " poste(s).";
        }

        return null;
    }

    /**
     * 🔑 VÉRIFICATION ADMIN — Utilise le TOKEN (pas la session PHP)
     * 
     * Le token doit être envoyé dans le header :
     * Authorization: Bearer <token>
     */
    private function verifierAdmin()
    {
        // Récupérer le token depuis le header Authorization
        $headers = $this->recupererHeaders();
        $authHeader = $headers['authorization'] 
            ?? $headers['Authorization'] 
            ?? '';

        $token = '';
        if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
            $token = trim($matches[1]);
        }

        if (empty($token)) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Token manquant',
            ]);
            exit;
        }

        // Vérifier le token dans la base
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
            echo json_encode([
                'success' => false,
                'message' => 'Token invalide ou expiré',
            ]);
            exit;
        }

        // Mettre à jour la dernière activité
        try {
            $this->db->prepare("
                UPDATE sessions_actives
                SET derniere_activite = NOW()
                WHERE token = ?
            ")->execute([$token]);
        } catch (Exception $e) {
            // Ignorer si la table n'existe pas
        }

        // Stocker l'admin pour usage ultérieur
        $GLOBALS['admin_connecte'] = $admin;

        return $admin;
    }

    /**
     * Récupérer les headers HTTP (compatible tous serveurs)
     */
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
    // MÉTHODES PRIVÉES — EMAILS
    // =====================================================

    private function envoyerEmailClient($res)
    {
        return $this->envoyerEmail(
            $res['email'],
            $res['nom'],
            "✅ Réservation enregistrée - " . $res['code_reservation'],
            $this->templateClientEnregistrement($res)
        );
    }

    private function envoyerEmailAdmin($res)
    {
        $config = require __DIR__ . '/../config/mail.php';
        return $this->envoyerEmail(
            $config['to_email'],
            $config['to_name'],
            "🔔 Nouvelle réservation : " . $res['code_reservation'],
            $this->templateAdmin($res)
        );
    }

    private function envoyerEmailConfirmation($res)
    {
        return $this->envoyerEmail(
            $res['email'],
            $res['nom'],
            "🎉 Réservation CONFIRMÉE - " . $res['code_reservation'],
            $this->templateConfirmation($res)
        );
    }

    private function envoyerEmailAnnulation($res)
    {
        return $this->envoyerEmail(
            $res['email'],
            $res['nom'],
            "❌ Réservation annulée - " . $res['code_reservation'],
            $this->templateAnnulation($res)
        );
    }

    private function envoyerEmail($toEmail, $toName, $sujet, $corpsHtml)
    {
        try {
            $config = require __DIR__ . '/../config/mail.php';

            $phpMailerPath = __DIR__ . '/../libs/PHPMailer/src/';
            if (!file_exists($phpMailerPath . 'PHPMailer.php')) {
                error_log("PHPMailer introuvable : $phpMailerPath");
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
            $mail->addAddress($toEmail, $toName);

            $mail->isHTML(true);
            $mail->Subject = $sujet;
            $mail->Body    = $corpsHtml;
            $mail->AltBody = strip_tags($corpsHtml);

            $mail->send();
            return true;

        } catch (\Exception $e) {
            error_log("Erreur email réservation : " . $e->getMessage());
            return false;
        }
    }

    // =====================================================
    // TEMPLATES EMAIL
    // =====================================================

    private function templateClientEnregistrement($res)
    {
        $code = $res['code_reservation'];
        $nom = htmlspecialchars($res['nom']);
        $date = date('d/m/Y', strtotime($res['date_reservation']));
        $heure = substr($res['heure_reservation'], 0, 5);
        $duree = htmlspecialchars($res['duree']);
        $postes = intval($res['nombre_postes']);

        return <<<HTML
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family: Arial; background: #f5f5f5; padding: 20px; margin:0;">
<div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #1E40AF, #06B6D4); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">✅ Réservation enregistrée</h1>
        <p style="margin: 8px 0 0;">Cyber Famille Solofoson</p>
    </div>
    <div style="padding: 30px;">
        <p>Bonjour <strong>{$nom}</strong>,</p>
        <p>Nous avons bien reçu votre demande de réservation :</p>
        <div style="background: #f9fafb; border-left: 4px solid #06B6D4; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Code :</strong> <span style="color: #1E40AF; font-size: 20px;">{$code}</span></p>
            <p style="margin: 5px 0;"><strong>Date :</strong> {$date}</p>
            <p style="margin: 5px 0;"><strong>Heure :</strong> {$heure}</p>
            <p style="margin: 5px 0;"><strong>Durée :</strong> {$duree}</p>
            <p style="margin: 5px 0;"><strong>Postes :</strong> {$postes}</p>
            <p style="margin: 5px 0;"><strong>Statut :</strong> <span style="color: #F97316;">⏳ En attente de confirmation</span></p>
        </div>
        <p>Nous vous contacterons très bientôt pour confirmer.</p>
        <p style="margin-top: 30px;">Cordialement,<br><strong>L'équipe Cyber Famille Solofoson</strong></p>
    </div>
    <div style="background: #0A1628; color: #9CA3AF; padding: 20px; text-align: center; font-size: 12px;">
        Cyber Famille Solofoson — Ambalavao 303<br>📞 +261 34 22 489 66
    </div>
</div>
</body></html>
HTML;
    }

    private function templateConfirmation($res)
    {
        $code = $res['code_reservation'];
        $nom = htmlspecialchars($res['nom']);
        $date = date('d/m/Y', strtotime($res['date_reservation']));
        $heure = substr($res['heure_reservation'], 0, 5);
        $duree = htmlspecialchars($res['duree']);
        $postes = intval($res['nombre_postes']);

        return <<<HTML
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family: Arial; background: #f5f5f5; padding: 20px; margin:0;">
<div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #22C55E, #16A34A); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">🎉 Réservation CONFIRMÉE</h1>
        <p style="margin: 8px 0 0;">Cyber Famille Solofoson</p>
    </div>
    <div style="padding: 30px;">
        <p>Bonjour <strong>{$nom}</strong>,</p>
        <p>Excellente nouvelle ! Votre réservation est <strong style="color: #22C55E;">confirmée</strong>.</p>
        <div style="background: #f9fafb; border-left: 4px solid #22C55E; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Code :</strong> <span style="color: #1E40AF; font-size: 20px;">{$code}</span></p>
            <p style="margin: 5px 0;"><strong>Date :</strong> {$date}</p>
            <p style="margin: 5px 0;"><strong>Heure :</strong> {$heure}</p>
            <p style="margin: 5px 0;"><strong>Durée :</strong> {$duree}</p>
            <p style="margin: 5px 0;"><strong>Postes :</strong> {$postes}</p>
        </div>
        <p>Présentez-vous à l'accueil avec votre code de réservation.</p>
        <p>À très bientôt ! 🚀</p>
        <p style="margin-top: 30px;">Cordialement,<br><strong>L'équipe Cyber Famille Solofoson</strong></p>
    </div>
    <div style="background: #0A1628; color: #9CA3AF; padding: 20px; text-align: center; font-size: 12px;">
        Cyber Famille Solofoson — Ambalavao 303<br>📞 +261 34 22 489 66
    </div>
</div>
</body></html>
HTML;
    }

    private function templateAnnulation($res)
    {
        $code = $res['code_reservation'];
        $nom = htmlspecialchars($res['nom']);
        $date = date('d/m/Y', strtotime($res['date_reservation']));
        $raison = htmlspecialchars($res['raison_annulation'] ?? 'Non spécifiée');

        return <<<HTML
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family: Arial; background: #f5f5f5; padding: 20px; margin:0;">
<div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #DC2626, #991B1B); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">❌ Réservation annulée</h1>
        <p style="margin: 8px 0 0;">Cyber Famille Solofoson</p>
    </div>
    <div style="padding: 30px;">
        <p>Bonjour <strong>{$nom}</strong>,</p>
        <p>Nous sommes désolés de vous informer que votre réservation a été annulée.</p>
        <div style="background: #fef2f2; border-left: 4px solid #DC2626; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Code :</strong> {$code}</p>
            <p style="margin: 5px 0;"><strong>Date :</strong> {$date}</p>
            <p style="margin: 5px 0;"><strong>Raison :</strong> {$raison}</p>
        </div>
        <p>N'hésitez pas à nous contacter pour effectuer une nouvelle réservation.</p>
        <p style="margin-top: 30px;">Cordialement,<br><strong>L'équipe Cyber Famille Solofoson</strong></p>
    </div>
    <div style="background: #0A1628; color: #9CA3AF; padding: 20px; text-align: center; font-size: 12px;">
        Cyber Famille Solofoson — Ambalavao 303<br>📞 +261 34 22 489 66
    </div>
</div>
</body></html>
HTML;
    }

    private function templateAdmin($res)
    {
        $code = $res['code_reservation'];
        $nom = htmlspecialchars($res['nom']);
        $email = htmlspecialchars($res['email']);
        $tel = htmlspecialchars($res['telephone']);
        $date = date('d/m/Y', strtotime($res['date_reservation']));
        $heure = substr($res['heure_reservation'], 0, 5);
        $duree = htmlspecialchars($res['duree']);
        $postes = intval($res['nombre_postes']);
        $message = nl2br(htmlspecialchars($res['message'] ?? 'Aucun message'));
        $dateCreation = date('d/m/Y H:i');

        return <<<HTML
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family: Arial; background: #f5f5f5; padding: 20px; margin:0;">
<div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #F97316, #EA580C); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">🔔 Nouvelle réservation</h1>
        <p style="margin: 8px 0 0;">Cyber Famille Solofoson</p>
    </div>
    <div style="padding: 30px;">
        <p>Une nouvelle réservation vient d'être effectuée :</p>
        <div style="background: #f9fafb; border-left: 4px solid #F97316; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Code :</strong> <span style="color: #1E40AF; font-size: 18px;">{$code}</span></p>
            <p style="margin: 5px 0;"><strong>Nom :</strong> {$nom}</p>
            <p style="margin: 5px 0;"><strong>Email :</strong> <a href="mailto:{$email}">{$email}</a></p>
            <p style="margin: 5px 0;"><strong>Téléphone :</strong> <a href="tel:{$tel}">{$tel}</a></p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Date :</strong> {$date}</p>
            <p style="margin: 5px 0;"><strong>Heure :</strong> {$heure}</p>
            <p style="margin: 5px 0;"><strong>Durée :</strong> {$duree}</p>
            <p style="margin: 5px 0;"><strong>Postes :</strong> {$postes}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Message :</strong></p>
            <p style="margin: 5px 0; color: #4B5563;">{$message}</p>
        </div>
        <p style="font-size: 12px; color: #6B7280;">Réservation effectuée le {$dateCreation}</p>
        <p style="margin-top: 20px;">Connectez-vous à l'espace admin pour confirmer ou annuler cette réservation.</p>
    </div>
    <div style="background: #0A1628; color: #9CA3AF; padding: 20px; text-align: center; font-size: 12px;">
        Cyber Famille Solofoson — Ambalavao 303
    </div>
</div>
</body></html>
HTML;
    }
}