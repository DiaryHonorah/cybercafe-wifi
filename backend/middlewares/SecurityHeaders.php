<?php
/**
 * Middleware : Headers de sécurité
 * À inclure au début de index.php
 */

class SecurityHeaders
{
    /**
     * Applique tous les headers de sécurité
     */
    public static function appliquer()
    {
        $config = require __DIR__ . '/../config/security.php';

        // ===== Headers standards =====
        foreach ($config['security_headers'] as $header => $value) {
            // Skip HSTS si pas en HTTPS (ne fonctionne qu'en HTTPS)
            if ($header === 'Strict-Transport-Security' && !self::estHttps()) {
                continue;
            }
            header("$header: $value");
        }

        // ===== Forcer HTTPS =====
        if ($config['force_https'] && !self::estHttps() && !self::estLocalhost()) {
            $url = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
            header("Location: $url", true, 301);
            exit;
        }

        // ===== Masquer la version de PHP =====
        header_remove('X-Powered-By');

        // ===== Cache-Control pour les API =====
        if (strpos($_SERVER['REQUEST_URI'] ?? '', '/api/') !== false) {
            header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
            header('Pragma: no-cache');
        }
    }

    /**
     * Détecte si on est en HTTPS
     */
    private static function estHttps()
    {
        if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
            return true;
        }
        if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
            return true;
        }
        if (!empty($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) {
            return true;
        }
        return false;
    }

    /**
     * Détecte si on est sur localhost
     */
    private static function estLocalhost()
    {
        $host = $_SERVER['HTTP_HOST'] ?? '';
        return strpos($host, 'localhost') !== false 
            || strpos($host, '127.0.0.1') !== false
            || strpos($host, '192.168.') === 0;
    }
}