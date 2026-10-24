<?php
/**
 * Service d'envoi de SMS via Twilio ou autre
 * En mode simulation si non configuré
 */

class SmsService {

    private $provider;
    private $apiKey;
    private $apiSecret;
    private $from;
    private $simulation = false;

    public function __construct() {
        require_once __DIR__ . '/../config/database.php';
        $db = (new Database())->getConnection();
        $stmt = $db->query("SELECT * FROM config_notifications WHERE type = 'sms' LIMIT 1");
        $config = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$config || !$config['actif']) {
            $this->simulation = true;
            return;
        }

        $this->provider = $config['sms_provider'];
        $this->apiKey = $config['sms_api_key'];
        $this->apiSecret = $config['sms_api_secret'];
        $this->from = $config['sms_from'];

        if (!$this->apiKey || !$this->from) {
            $this->simulation = true;
        }
    }

    /**
     * Envoyer un SMS
     */
    public function envoyer($destinataires, $message) {
        if (is_string($destinataires)) {
            $destinataires = array_map('trim', explode(',', $destinataires));
        }
        $destinataires = array_filter($destinataires);

        if (empty($destinataires)) {
            return ['success' => false, 'erreur' => 'Aucun destinataire'];
        }

        if ($this->simulation) {
            error_log("[SMS SIMULATION] To: " . implode(', ', $destinataires));
            error_log("[SMS SIMULATION] Message: $message");
            $this->logHistorique($message, $destinataires, 'reussi', 'Mode simulation');
            return ['success' => true, 'simulation' => true];
        }

        try {
            $resultats = [];
            foreach ($destinataires as $dest) {
                $resultats[] = $this->envoyerTwilio($dest, $message);
            }
            $this->logHistorique($message, $destinataires, 'reussi', '');
            return ['success' => true, 'simulation' => false, 'resultats' => $resultats];
        } catch (Exception $e) {
            $this->logHistorique($message, $destinataires, 'echoue', $e->getMessage());
            return ['success' => false, 'erreur' => $e->getMessage()];
        }
    }

    /**
     * Envoi via Twilio
     */
    private function envoyerTwilio($destinataire, $message) {
        $url = "https://api.twilio.com/2010-04-01/Accounts/{$this->apiKey}/Messages.json";

        $data = [
            'From' => $this->from,
            'To' => $destinataire,
            'Body' => $message
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_USERPWD, $this->apiKey . ':' . $this->apiSecret);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 201) {
            throw new Exception("Twilio erreur HTTP $httpCode : $response");
        }

        return json_decode($response, true);
    }

    private function logHistorique($message, $destinataires, $statut, $erreur = '') {
        try {
            $db = (new Database())->getConnection();
            $stmt = $db->prepare("
                INSERT INTO historique_notifications
                (type, sujet, message, destinataires, statut, erreur)
                VALUES ('sms', 'SMS', ?, ?, ?, ?)
            ");
            $stmt->execute([
                $message,
                is_array($destinataires) ? implode(', ', $destinataires) : $destinataires,
                $statut,
                $erreur
            ]);
        } catch (Exception $e) {}
    }

    public function isSimulation() {
        return $this->simulation;
    }
}