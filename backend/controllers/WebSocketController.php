<?php
require_once __DIR__ . '/../websocket/Notifier.php';

class WebSocketController {

    /**
     * Envoyer une notification manuellement
     * POST /api/websocket/envoyer
     */
    public function envoyer() {
        $data = json_decode(file_get_contents("php://input"), true);
        $type = $data['type'] ?? 'systeme';
        $titre = $data['titre'] ?? 'Notification';
        $message = $data['message'] ?? '';

        $ok = Notifier::envoyer($type, $titre, $message);

        echo json_encode([
            "success" => $ok,
            "message" => $ok
                ? "Notification envoyée"
                : "Serveur WebSocket non joignable (ignoré)"
        ]);
    }

    /**
     * Vérifier si le serveur WebSocket est en marche
     * GET /api/websocket/statut
     */
    public function statut() {
        $socket = @fsockopen('127.0.0.1', 8091, $errno, $errstr, 1);

        if ($socket) {
            fclose($socket);
            echo json_encode([
                "actif" => true,
                "message" => "Serveur WebSocket en marche sur ws://localhost:8090"
            ]);
        } else {
            echo json_encode([
                "actif" => false,
                "message" => "Serveur WebSocket non démarré"
            ]);
        }
    }
}