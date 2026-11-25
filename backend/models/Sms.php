<?php
/**
 * Modèle Sms
 * Gestion de l'envoi de SMS automatiques
 */

class Sms
{
    private $db;

    public function __construct($db = null)
    {
        if ($db instanceof PDO) {
            $this->db = $db;
        } else {
            $this->db = $this->connecter();
        }

        if (!$this->db) {
            throw new Exception("Impossible de se connecter à la base de données");
        }
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

    public function getConfig()
    {
        $stmt = $this->db->query("SELECT * FROM sms_config LIMIT 1");
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Envoie un SMS (point d'entrée principal)
     */
    public function envoyer($telephone, $message, $type = 'autre', $referenceId = null)
    {
        $config = $this->getConfig();

        // Si le système SMS est désactivé
        if (!$config || !$config['actif']) {
            $this->log($telephone, $message, $type, 'echec', $referenceId, 'SMS désactivé');
            return false;
        }

        // Vérifier le numéro
        $telephone = $this->normaliserTelephone($telephone);
        if (empty($telephone)) {
            $this->log($telephone, $message, $type, 'echec', $referenceId, 'Numéro invalide');
            return false;
        }

        // Mode test
        if ($config['mode_test']) {
            $this->log($telephone, $message, $type, 'simule', $referenceId, null);
            return true;
        }

        // Envoi réel
        try {
            $resultat = false;
            switch ($config['fournisseur']) {
                case 'twilio':
                    $resultat = $this->envoyerTwilio($config, $telephone, $message);
                    break;
                case 'vonage':
                    $resultat = $this->envoyerVonage($config, $telephone, $message);
                    break;
                case 'local':
                    $resultat = $this->envoyerLocal($config, $telephone, $message);
                    break;
                default:
                    throw new Exception("Fournisseur non supporté");
            }

            if ($resultat) {
                $this->log($telephone, $message, $type, 'succes', $referenceId, null);
                return true;
            } else {
                $this->log($telephone, $message, $type, 'echec', $referenceId, 'Échec envoi');
                return false;
            }

        } catch (Exception $e) {
            $this->log($telephone, $message, $type, 'echec', $referenceId, $e->getMessage());
            return false;
        }
    }

    /**
     * Envoi via Twilio
     */
    private function envoyerTwilio($config, $telephone, $message)
    {
        $url = "https://api.twilio.com/2010-04-01/Accounts/{$config['api_key']}/Messages.json";

        $data = [
            'From' => $config['expediteur'],
            'To' => $telephone,
            'Body' => $message,
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERPWD, $config['api_key'] . ':' . $config['api_secret']);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $httpCode >= 200 && $httpCode < 300;
    }

    /**
     * Envoi via Vonage (Nexmo)
     */
    private function envoyerVonage($config, $telephone, $message)
    {
        $url = "https://rest.nexmo.com/sms/json";

        $data = [
            'api_key' => $config['api_key'],
            'api_secret' => $config['api_secret'],
            'to' => $telephone,
            'from' => $config['expediteur'],
            'text' => $message,
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $httpCode >= 200 && $httpCode < 300;
    }

    /**
     * Envoi via API locale / générique (ex: Orange Money, MVola)
     */
    private function envoyerLocal($config, $telephone, $message)
    {
        if (empty($config['api_url'])) {
            throw new Exception("URL API local non configurée");
        }

        $data = [
            'to' => $telephone,
            'message' => $message,
            'sender' => $config['expediteur'],
        ];

        $ch = curl_init($config['api_url']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $config['api_key'],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $httpCode >= 200 && $httpCode < 300;
    }

    /**
     * Normalise un numéro de téléphone (format international)
     */
    private function normaliserTelephone($telephone)
    {
        $telephone = preg_replace('/[^0-9+]/', '', $telephone);
        if (empty($telephone)) return '';

        // Si commence par 0, ajouter l'indicatif Madagascar (+261)
        if (substr($telephone, 0, 1) === '0') {
            $telephone = '+261' . substr($telephone, 1);
        }
        // Si ne commence pas par +, ajouter +
        elseif (substr($telephone, 0, 1) !== '+') {
            $telephone = '+' . $telephone;
        }

        return $telephone;
    }

    /**
     * Enregistre un SMS dans l'historique
     */
    private function log($telephone, $message, $type, $statut, $referenceId = null, $erreur = null)
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO sms_historique 
                (telephone, message, type, statut, reference_id, erreur) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$telephone, $message, $type, $statut, $referenceId, $erreur]);
        } catch (Exception $e) {
            error_log("Erreur log SMS: " . $e->getMessage());
        }
    }

    // =====================================================
    // MÉTHODES SPÉCIFIQUES (à appeler depuis les contrôleurs)
    // =====================================================

    public function envoyerReservationCreation($telephone, $code, $date, $heure)
    {
        $msg = "Cyber Famille: Votre reservation $code pour le $date a $heure a bien ete enregistree. Nous vous confirmerons rapidement.";
        return $this->envoyer($telephone, $msg, 'reservation', null);
    }

    public function envoyerReservationConfirmation($telephone, $code, $date, $heure)
    {
        $msg = "Cyber Famille: Votre reservation $code pour le $date a $heure est CONFIRMEE. A bientot !";
        return $this->envoyer($telephone, $msg, 'reservation', null);
    }

    public function envoyerReservationAnnulation($telephone, $code, $raison = '')
    {
        $msg = "Cyber Famille: Votre reservation $code a ete ANNULEE. " . ($raison ? "Raison: $raison" : '');
        return $this->envoyer($telephone, $msg, 'reservation', null);
    }

    public function envoyerRdvCreation($telephone, $reference, $date, $heure)
    {
        $msg = "Cyber Famille: Votre RDV $reference pour le $date a $heure a bien ete enregistre.";
        return $this->envoyer($telephone, $msg, 'rdv', null);
    }

    public function envoyerRdvConfirmation($telephone, $reference, $date, $heure)
    {
        $msg = "Cyber Famille: Votre RDV $reference pour le $date a $heure est CONFIRME. A bientot !";
        return $this->envoyer($telephone, $msg, 'rdv', null);
    }

    public function envoyerRdvRappel($telephone, $reference, $date, $heure)
    {
        $msg = "Rappel Cyber Famille: N'oubliez pas votre RDV $reference demain a $heure. A bientot !";
        return $this->envoyer($telephone, $msg, 'rdv', null);
    }

    public function envoyerTicketSupportReponse($telephone, $reference)
    {
        $msg = "Cyber Famille: Notre equipe a repondu a votre ticket $reference. Consultez votre espace client.";
        return $this->envoyer($telephone, $msg, 'support', null);
    }

    // =====================================================
    // ADMIN
    // =====================================================

    public function updateConfig($data)
    {
        $stmt = $this->db->prepare("
            UPDATE sms_config SET
                actif = ?,
                mode_test = ?,
                fournisseur = ?,
                api_url = ?,
                api_key = ?,
                api_secret = ?,
                expediteur = ?,
                sms_reservation_creation = ?,
                sms_reservation_confirmation = ?,
                sms_reservation_annulation = ?,
                sms_rdv_creation = ?,
                sms_rdv_confirmation = ?,
                sms_rdv_rappel = ?,
                sms_ticket_support_reponse = ?
            WHERE id = 1
        ");
        return $stmt->execute([
            !empty($data['actif']) ? 1 : 0,
            !empty($data['mode_test']) ? 1 : 0,
            $data['fournisseur'] ?? 'twilio',
            $data['api_url'] ?? null,
            $data['api_key'] ?? null,
            $data['api_secret'] ?? null,
            $data['expediteur'] ?? 'CYBERFAMILLE',
            !empty($data['sms_reservation_creation']) ? 1 : 0,
            !empty($data['sms_reservation_confirmation']) ? 1 : 0,
            !empty($data['sms_reservation_annulation']) ? 1 : 0,
            !empty($data['sms_rdv_creation']) ? 1 : 0,
            !empty($data['sms_rdv_confirmation']) ? 1 : 0,
            !empty($data['sms_rdv_rappel']) ? 1 : 0,
            !empty($data['sms_ticket_support_reponse']) ? 1 : 0,
        ]);
    }

    public function getHistorique($limite = 100)
    {
        $stmt = $this->db->prepare("
            SELECT * FROM sms_historique 
            ORDER BY created_at DESC 
            LIMIT ?
        ");
        $stmt->bindValue(1, $limite, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getStats()
    {
        $stats = [];

        $stmt = $this->db->query("SELECT COUNT(*) FROM sms_historique");
        $stats['total'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM sms_historique WHERE statut = 'succes'");
        $stats['succes'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM sms_historique WHERE statut = 'echec'");
        $stats['echecs'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM sms_historique WHERE statut = 'simule'");
        $stats['simules'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM sms_historique WHERE DATE(created_at) = CURDATE()");
        $stats['aujourdhui'] = intval($stmt->fetchColumn());

        return $stats;
    }
}