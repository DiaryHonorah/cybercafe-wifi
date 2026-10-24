<?php
/**
 * Notifier.php
 * 
 * Permet au backend Apache/PHP d'envoyer des événements
 * au serveur WebSocket qui tourne en arrière-plan (port 8091).
 * 
 * Usage :
 *   require_once __DIR__ . '/../websocket/Notifier.php';
 *   Notifier::vente('CF-XXXX', 500);
 */

class Notifier {

    private static $host = '127.0.0.1';
    private static $port = 8091;

    /**
     * Envoyer une notification via le socket de contrôle
     */
    public static function envoyer($type, $titre, $message = '', $donnees = []) {
        $payload = json_encode([
            "type" => $type,
            "titre" => $titre,
            "message" => $message,
            "donnees" => $donnees,
            "timestamp" => date('Y-m-d H:i:s')
        ]);

        $socket = @fsockopen(self::$host, self::$port, $errno, $errstr, 1);

        if ($socket) {
            fwrite($socket, $payload . "\n");
            fclose($socket);
            return true;
        }

        // Serveur WS non lancé → on ignore silencieusement
        return false;
    }

    public static function vente($code, $montant) {
        return self::envoyer(
            'vente',
            'Nouvelle vente',
            "Ticket {$code} vendu pour {$montant} Ar",
            ["code" => $code, "montant" => $montant]
        );
    }

    public static function session($code, $duree) {
        return self::envoyer(
            'session',
            'Nouvelle session',
            "Client {$code} connecté pour {$duree} minutes",
            ["code" => $code, "duree" => $duree]
        );
    }

    public static function expiration($code) {
        return self::envoyer(
            'expiration',
            'Session terminée',
            "Le ticket {$code} a expiré",
            ["code" => $code]
        );
    }

    public static function systeme($titre, $message = '') {
        return self::envoyer('systeme', $titre, $message);
    }
}