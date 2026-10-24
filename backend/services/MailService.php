<?php
/**
 * Service d'envoi d'email via SMTP
 * Compatible avec Gmail, Outlook, serveur SMTP custom, etc.
 */

class MailService {

    private $host;
    private $port;
    private $user;
    private $password;
    private $secure;
    private $fromEmail;
    private $fromNom;
    private $simulation = false;

    public function __construct() {
        require_once __DIR__ . '/../config/database.php';
        $db = (new Database())->getConnection();
        $stmt = $db->query("SELECT * FROM config_notifications WHERE type = 'email' LIMIT 1");
        $config = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$config || !$config['actif']) {
            $this->simulation = true;
            return;
        }

        $this->host = $config['smtp_host'];
        $this->port = (int)$config['smtp_port'];
        $this->user = $config['smtp_user'];
        $this->password = $config['smtp_password'];
        $this->secure = $config['smtp_secure'];
        $this->fromEmail = $config['email_from'] ?: $config['smtp_user'];
        $this->fromNom = $config['email_from_nom'] ?: 'Cyber Famille';

        if (!$this->host || !$this->user) {
            $this->simulation = true;
        }
    }

    /**
     * Envoyer un email
     */
    public function envoyer($destinataires, $sujet, $message, $html = true) {
        // Normaliser les destinataires
        if (is_string($destinataires)) {
            $destinataires = array_map('trim', explode(',', $destinataires));
        }
        $destinataires = array_filter($destinataires);

        if (empty($destinataires)) {
            return ['success' => false, 'erreur' => 'Aucun destinataire'];
        }

        // Mode simulation
        if ($this->simulation) {
            error_log("[MAIL SIMULATION] To: " . implode(', ', $destinataires));
            error_log("[MAIL SIMULATION] Sujet: $sujet");
            $this->logHistorique('email', $sujet, $message, $destinataires, 'reussi', 'Mode simulation');
            return ['success' => true, 'simulation' => true];
        }

        // Envoi réel via socket SMTP
        try {
            $this->envoyerSMTP($destinataires, $sujet, $message, $html);
            $this->logHistorique('email', $sujet, $message, $destinataires, 'reussi', '');
            return ['success' => true, 'simulation' => false];
        } catch (Exception $e) {
            $this->logHistorique('email', $sujet, $message, $destinataires, 'echoue', $e->getMessage());
            return ['success' => false, 'erreur' => $e->getMessage()];
        }
    }

    /**
     * Envoi SMTP pur en PHP (sans librairie externe)
     */
    private function envoyerSMTP($destinataires, $sujet, $message, $html) {
        $socket = @fsockopen(
            ($this->secure === 'ssl' ? 'ssl://' : '') . $this->host,
            $this->port,
            $errno,
            $errstr,
            10
        );

        if (!$socket) {
            throw new Exception("Connexion SMTP impossible : $errstr ($errno)");
        }

        $this->lireReponse($socket);

        // EHLO
        fwrite($socket, "EHLO " . gethostname() . "\r\n");
        $this->lireReponse($socket);

        // STARTTLS si nécessaire
        if ($this->secure === 'tls') {
            fwrite($socket, "STARTTLS\r\n");
            $this->lireReponse($socket);
            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            fwrite($socket, "EHLO " . gethostname() . "\r\n");
            $this->lireReponse($socket);
        }

        // Authentification
        if ($this->user && $this->password) {
            fwrite($socket, "AUTH LOGIN\r\n");
            $this->lireReponse($socket);
            fwrite($socket, base64_encode($this->user) . "\r\n");
            $this->lireReponse($socket);
            fwrite($socket, base64_encode($this->password) . "\r\n");
            $rep = $this->lireReponse($socket);
            if (strpos($rep, '235') === false) {
                throw new Exception("Authentification SMTP échouée : $rep");
            }
        }

        // MAIL FROM
        fwrite($socket, "MAIL FROM:<{$this->fromEmail}>\r\n");
        $this->lireReponse($socket);

        // RCPT TO
        foreach ($destinataires as $dest) {
            fwrite($socket, "RCPT TO:<$dest>\r\n");
            $this->lireReponse($socket);
        }

        // DATA
        fwrite($socket, "DATA\r\n");
        $this->lireReponse($socket);

        // En-têtes
        $headers = "From: =?UTF-8?B?" . base64_encode($this->fromNom) . "?= <{$this->fromEmail}>\r\n";
        $headers .= "To: " . implode(', ', $destinataires) . "\r\n";
        $headers .= "Subject: =?UTF-8?B?" . base64_encode($sujet) . "?=\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= $html
            ? "Content-Type: text/html; charset=UTF-8\r\n"
            : "Content-Type: text/plain; charset=UTF-8\r\n";
        $headers .= "Date: " . date('r') . "\r\n";
        $headers .= "\r\n";

        // Corps
        if ($html) {
            $body = "<html><body style='font-family:Arial,sans-serif;color:#333'>";
            $body .= $message;
            $body .= "</body></html>";
        } else {
            $body = $message;
        }

        fwrite($socket, $headers . $body . "\r\n.\r\n");
        $rep = $this->lireReponse($socket);

        // QUIT
        fwrite($socket, "QUIT\r\n");
        fclose($socket);

        if (strpos($rep, '250') === false) {
            throw new Exception("Envoi échoué : $rep");
        }
    }

    private function lireReponse($socket) {
        $data = '';
        while ($ligne = fgets($socket, 512)) {
            $data .= $ligne;
            if (isset($ligne[3]) && $ligne[3] === ' ') break;
        }
        return $data;
    }

    private function logHistorique($type, $sujet, $message, $destinataires, $statut, $erreur = '') {
        try {
            $db = (new Database())->getConnection();
            $stmt = $db->prepare("
                INSERT INTO historique_notifications
                (type, sujet, message, destinataires, statut, erreur)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $type,
                $sujet,
                $message,
                is_array($destinataires) ? implode(', ', $destinataires) : $destinataires,
                $statut,
                $erreur
            ]);
        } catch (Exception $e) {}
    }

    /**
     * Envoyer un rapport par email
     */
    public function envoyerRapport($destinataires, $titre, $donnees) {
        $html = "
            <h2 style='color:#F97316'>$titre</h2>
            <table style='border-collapse:collapse;width:100%;max-width:600px'>
                <tr style='background:#F97316;color:#fff'>
                    <th style='padding:8px;text-align:left'>Indicateur</th>
                    <th style='padding:8px;text-align:right'>Valeur</th>
                </tr>
        ";

        foreach ($donnees as $cle => $valeur) {
            $html .= "
                <tr style='border-bottom:1px solid #eee'>
                    <td style='padding:8px'>$cle</td>
                    <td style='padding:8px;text-align:right;font-weight:bold'>$valeur</td>
                </tr>
            ";
        }

        $html .= "</table>";
        $html .= "<p style='color:#666;font-size:12px;margin-top:20px'>Rapport généré automatiquement par Cyber Famille</p>";

        return $this->envoyer($destinataires, $titre, $html, true);
    }

    public function isSimulation() {
        return $this->simulation;
    }
}