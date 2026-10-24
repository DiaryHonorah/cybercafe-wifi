<?php
/**
 * Serveur WebSocket + Contrôle interne Cyber Famille
 * 
 * - Port 8090 : WebSocket pour les navigateurs
 * - Port 8091 : Socket TCP interne pour recevoir les ordres du backend PHP
 * 
 * Lance avec : php server.php
 */

require __DIR__ . '/vendor/autoload.php';

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use React\EventLoop\Loop;
use React\Socket\SocketServer;

class CyberFamilleWebSocket implements MessageComponentInterface {
    protected $clients;
    protected $nbClients = 0;

    public function __construct() {
        $this->clients = new \SplObjectStorage();
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        $this->nbClients++;
        echo "[WS] +1 client (#{$conn->resourceId}) — Total : {$this->nbClients}\n";

        $conn->send(json_encode([
            "type" => "bienvenue",
            "message" => "Connecté au serveur temps réel Cyber Famille",
            "timestamp" => date('Y-m-d H:i:s')
        ]));
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $data = json_decode($msg, true);

        // Ping / Pong
        if (isset($data['type']) && $data['type'] === 'ping') {
            $from->send(json_encode(["type" => "pong"]));
            return;
        }

        // Diffuser aux autres clients
        foreach ($this->clients as $client) {
            if ($client !== $from) {
                $client->send($msg);
            }
        }
    }

    public function onClose(ConnectionInterface $conn) {
        $this->clients->detach($conn);
        $this->nbClients--;
        echo "[WS] -1 client (#{$conn->resourceId}) — Total : {$this->nbClients}\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "[WS] Erreur : " . $e->getMessage() . "\n";
        $conn->close();
    }

    public function diffuser($message) {
        $json = json_encode($message);
        foreach ($this->clients as $client) {
            $client->send($json);
        }
    }
}

// ============================================
// Initialisation
// ============================================
$wsInstance = new CyberFamilleWebSocket();
$loop = Loop::get();

// ============================================
// 1. Serveur TCP de contrôle (port 8091)
//    Reçoit les ordres du backend Apache/PHP
// ============================================
$controlSocket = @stream_socket_server("tcp://0.0.0.0:8091", $errno, $errstr);
if (!$controlSocket) {
    echo "[CTRL] ❌ Impossible d'ouvrir le port 8091 : $errstr\n";
    exit(1);
}
stream_set_blocking($controlSocket, false);

$loop->addPeriodicTimer(0.1, function () use ($controlSocket, $wsInstance) {
    $conn = @stream_socket_accept($controlSocket, 0);
    if ($conn) {
        $data = '';
        while (($line = fgets($conn)) !== false) {
            $data .= $line;
            if (strpos($data, "\n") !== false) break;
        }
        fclose($conn);

        $payload = trim($data);
        if ($payload) {
            $decoded = json_decode($payload, true);
            if ($decoded && isset($decoded['type'])) {
                $wsInstance->diffuser($decoded);
                echo "[CTRL] → Diffusé : {$decoded['type']} — " . ($decoded['titre'] ?? '') . "\n";
            }
        }
    }
});

// ============================================
// 2. Serveur WebSocket (port 8090)
// ============================================
$socket = new SocketServer('0.0.0.0:8090', [], $loop);
$wsServer = new IoServer(
    new HttpServer(
        new WsServer($wsInstance)
    ),
    $socket,
    $loop
);

echo "===========================================\n";
echo "  CYBER FAMILLE — Serveur temps réel\n";
echo "  WebSocket : ws://localhost:8090\n";
echo "  Contrôle  : tcp://localhost:8091\n";
echo "===========================================\n";
echo "  En attente de connexions...\n\n";

$loop->run();