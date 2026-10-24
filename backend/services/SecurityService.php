<?php
/**
 * Service de sécurité
 * - Protection XSS
 * - Anti-injection
 * - Détection de patterns suspects
 * - Logs de sécurité
 */

class SecurityService
{
    /**
     * Nettoie une chaîne pour éviter le XSS
     */
    public static function nettoyer($input)
    {
        if (is_array($input)) {
            return array_map([self::class, 'nettoyer'], $input);
        }

        if (!is_string($input)) {
            return $input;
        }

        // Supprimer les balises script et les attributs dangereux
        $input = str_replace(['<script', '</script', 'javascript:', 'onerror=', 'onclick=', 'onload='], '', $input);

        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }

    /**
     * Nettoie récursivement un tableau (pour $_POST / $_GET)
     */
    public static function nettoyerTableau($tableau)
    {
        if (!is_array($tableau)) {
            return self::nettoyer($tableau);
        }
        return array_map([self::class, 'nettoyerTableau'], $tableau);
    }

    /**
     * Détecte les tentatives d'injection SQL
     */
    public static function detecterInjectionSql($input)
    {
        if (!is_string($input)) {
            return false;
        }

        $patterns = [
            '/(\bUNION\b.*\bSELECT\b)/i',
            '/(\bSELECT\b.*\bFROM\b.*\bWHERE\b)/i',
            '/(\bINSERT\b.*\bINTO\b)/i',
            '/(\bDROP\b.*\bTABLE\b)/i',
            '/(\bDELETE\b.*\bFROM\b)/i',
            '/(\bUPDATE\b.*\bSET\b)/i',
            '/(\bEXEC\b|\bEXECUTE\b)/i',
            '/(\bOR\b\s+1\s*=\s*1)/i',
            '/(\bAND\b\s+1\s*=\s*1)/i',
            "/(--|\/\*|\*\/|;)/",
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Détecte les tentatives XSS
     */
    public static function detecterXss($input)
    {
        if (!is_string($input)) {
            return false;
        }

        $patterns = [
            '/<script\b[^>]*>/i',
            '/javascript:/i',
            '/onerror\s*=/i',
            '/onclick\s*=/i',
            '/onload\s*=/i',
            '/<iframe/i',
            '/<object/i',
            '/<embed/i',
            '/eval\s*\(/i',
            '/document\.cookie/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Enregistre un événement de sécurité
     */
    public static function log($db, $type, $niveau, $donnees = null)
    {
        try {
            $stmt = $db->prepare("
                INSERT INTO security_logs 
                (type, niveau, ip, user_agent, endpoint, methode, donnees) 
                VALUES (:type, :niveau, :ip, :ua, :endpoint, :methode, :donnees)
            ");
            $stmt->execute([
                ':type' => $type,
                ':niveau' => $niveau,
                ':ip' => self::getIp(),
                ':ua' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                ':endpoint' => $_SERVER['REQUEST_URI'] ?? '',
                ':methode' => $_SERVER['REQUEST_METHOD'] ?? '',
                ':donnees' => $donnees ? json_encode($donnees) : null,
            ]);
        } catch (Exception $e) {
            // Silencieux
        }
    }

    /**
     * Vérifie une requête complète
     * Retourne true si OK, false si suspecte (log l'événement)
     */
    public static function verifierRequete($db)
    {
        // ===== Vérifier URI =====
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        if (self::detecterInjectionSql($uri) || self::detecterXss($uri)) {
            self::log($db, 'uri_suspecte', 'danger', ['uri' => $uri]);
            self::envoyerErreur400('Requête invalide');
            return false;
        }

        // ===== Vérifier GET =====
        foreach ($_GET as $cle => $valeur) {
            if (self::detecterInjectionSql($valeur) || self::detecterXss($valeur)) {
                self::log($db, 'get_suspect', 'danger', ['cle' => $cle, 'valeur' => $valeur]);
                self::envoyerErreur400('Paramètre invalide');
                return false;
            }
        }

        // ===== Vérifier POST (JSON) =====
        $body = file_get_contents('php://input');
        if ($body && (self::detecterInjectionSql($body) || self::detecterXss($body))) {
            self::log($db, 'post_suspect', 'danger', ['body' => substr($body, 0, 500)]);
            self::envoyerErreur400('Contenu invalide');
            return false;
        }

        return true;
    }

    /**
     * Envoie une erreur 400
     */
    private static function envoyerErreur400($message)
    {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => $message,
        ]);
        exit;
    }

    /**
     * Récupère l'IP
     */
    private static function getIp()
    {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] 
            ?? $_SERVER['HTTP_X_REAL_IP'] 
            ?? $_SERVER['REMOTE_ADDR'] 
            ?? '0.0.0.0';

        if (strpos($ip, ',') !== false) {
            $ip = trim(explode(',', $ip)[0]);
        }

        return $ip;
    }
}