<?php
/**
 * Middleware : Rate Limiting
 * Limite le nombre de requêtes par IP/endpoint
 */

class RateLimit
{
    private $db;
    private $config;

    public function __construct($db)
    {
        $this->db = $db;
        $this->config = require __DIR__ . '/../config/security.php';
    }

    /**
     * Vérifie si la requête est autorisée
     * Retourne true si OK, false si bloqué (envoie une réponse 429)
     */
    public function verifier($endpoint, $methode)
    {
        if (!$this->config['rate_limit']['enabled']) {
            return true;
        }

        $ip = $this->getIp();

        // Vérifier si l'IP est dans la liste blanche
        if (in_array($ip, $this->config['ips_autorisees'] ?? [])) {
            return true;
        }

        // Vérifier si l'IP est bloquée
        if ($this->estBloquee($ip)) {
            $this->envoyerReponse429('IP temporairement bloquée');
            return false;
        }

        // Déterminer la limite
        $limite = $this->getLimite($endpoint);

        // Vérifier le rate limit
        if (!$this->estDansLaLimite($ip, $endpoint, $methode, $limite)) {
            $this->logRateLimit($ip, $endpoint, $methode);
            $this->envoyerReponse429('Trop de requêtes. Veuillez patienter.');
            return false;
        }

        return true;
    }

    /**
     * Retourne la limite pour un endpoint
     */
    private function getLimite($endpoint)
    {
        $endpoints = $this->config['rate_limit']['endpoints'];
        
        foreach ($endpoints as $pattern => $limite) {
            if (strpos($endpoint, $pattern) !== false) {
                return $limite;
            }
        }

        return $this->config['rate_limit']['par_defaut'];
    }

    /**
     * Vérifie si la requête est dans la limite
     */
    private function estDansLaLimite($ip, $endpoint, $methode, $limite)
    {
        $fenetre = $limite['fenetre'];
        $max = $limite['max'];
        $depuis = date('Y-m-d H:i:s', time() - $fenetre);

        // Compter les requêtes dans la fenêtre
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM rate_limit
            WHERE ip = :ip 
              AND endpoint = :endpoint 
              AND methode = :methode
              AND derniere_requete >= :depuis
        ");
        $stmt->execute([
            ':ip' => $ip,
            ':endpoint' => $endpoint,
            ':methode' => $methode,
            ':depuis' => $depuis,
        ]);
        $nb = intval($stmt->fetchColumn());

        if ($nb >= $max) {
            return false;
        }

        // Enregistrer la requête
        $stmt = $this->db->prepare("
            INSERT INTO rate_limit (ip, endpoint, methode, nb_requetes, derniere_requete)
            VALUES (:ip, :endpoint, :methode, 1, NOW())
            ON DUPLICATE KEY UPDATE 
                nb_requetes = nb_requetes + 1,
                derniere_requete = NOW()
        ");
        $stmt->execute([
            ':ip' => $ip,
            ':endpoint' => $endpoint,
            ':methode' => $methode,
        ]);

        return true;
    }

    /**
     * Vérifie si l'IP est bloquée
     */
    private function estBloquee($ip)
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM ips_bloquees
            WHERE ip = :ip AND bloque_jusqu_a > NOW()
        ");
        $stmt->execute([':ip' => $ip]);
        return intval($stmt->fetchColumn()) > 0;
    }

    /**
     * Bloque une IP pour X minutes
     */
    public function bloquerIp($ip, $raison)
    {
        $minutes = $this->config['bruteforce']['blocage_minutes'];
        $jusquA = date('Y-m-d H:i:s', time() + ($minutes * 60));

        $stmt = $this->db->prepare("
            INSERT INTO ips_bloquees (ip, raison, bloque_jusqu_a)
            VALUES (:ip, :raison, :jusqu)
            ON DUPLICATE KEY UPDATE 
                raison = :raison,
                bloque_jusqu_a = :jusqu
        ");
        $stmt->execute([
            ':ip' => $ip,
            ':raison' => $raison,
            ':jusqu' => $jusquA,
        ]);
    }

    /**
     * Enregistre l'événement rate limit
     */
    private function logRateLimit($ip, $endpoint, $methode)
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO security_logs (type, niveau, ip, endpoint, methode, user_agent)
                VALUES ('rate_limit', 'warning', :ip, :endpoint, :methode, :ua)
            ");
            $stmt->execute([
                ':ip' => $ip,
                ':endpoint' => $endpoint,
                ':methode' => $methode,
                ':ua' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            ]);
        } catch (Exception $e) {}
    }

    /**
     * Envoie une réponse 429 Too Many Requests
     */
    private function envoyerReponse429($message)
    {
        http_response_code(429);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => $message,
            'retry_after' => 60,
        ]);
        exit;
    }

    /**
     * Récupère l'IP du client
     */
    private function getIp()
    {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] 
            ?? $_SERVER['HTTP_X_REAL_IP'] 
            ?? $_SERVER['REMOTE_ADDR'] 
            ?? '0.0.0.0';

        // Si plusieurs IPs, prendre la première
        if (strpos($ip, ',') !== false) {
            $ip = trim(explode(',', $ip)[0]);
        }

        return $ip;
    }
}