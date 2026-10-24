<?php
/**
 * Service de communication avec MikroTik RouterOS via l'API native (port 8728)
 * 
 * Utilise la bibliothèque "routeros-api-php" (téléchargée via Composer)
 * OU une implémentation simplifiée si Composer n'est pas dispo.
 * 
 * Si le routeur n'est pas configuré ou injoignable, le service bascule
 * automatiquement en MODE SIMULATION : toutes les méthodes retournent true
 * sans rien envoyer au routeur.
 */

class MikroTikService {
    private $host;
    private $port;
    private $username;
    private $password;
    private $hotspotServer;
    private $actif;
    private $socket = null;
    private $simulation = false;

    public function __construct() {
        require_once __DIR__ . '/../config/database.php';
        $db = (new Database())->getConnection();
        $stmt = $db->query("SELECT * FROM config_routeur WHERE id = 1 LIMIT 1");
        $config = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$config) {
            $this->simulation = true;
            return;
        }

        $this->host = $config['host'];
        $this->port = (int)$config['port'];
        $this->username = $config['username'];
        $this->password = $config['password'];
        $this->hotspotServer = $config['hotspot_server'];
        $this->actif = (bool)$config['actif'];

        // Si désactivé ou pas de mot de passe → simulation
        if (!$this->actif || empty($this->password)) {
            $this->simulation = true;
        }
    }

    /**
     * Connexion au routeur
     */
    private function connecter() {
        if ($this->simulation) return false;

        $this->socket = @fsockopen($this->host, $this->port, $errno, $errstr, 3);
        if (!$this->socket) {
            $this->simulation = true;
            return false;
        }
        stream_set_timeout($this->socket, 3);
        return true;
    }

    private function deconnecter() {
        if ($this->socket) {
            fclose($this->socket);
            $this->socket = null;
        }
    }

    /**
     * Envoyer une commande simple (login, add, remove)
     */
    private function envoyerCommande($commandes) {
        if ($this->simulation) return ["!done"];

        if (!$this->connecter()) return null;

        $reponse = [];
        foreach ($commandes as $cmd) {
            fwrite($this->socket, $cmd);
        }

        // Lecture de la réponse
        $dernierMot = '';
        while (true) {
            $line = fgets($this->socket, 4096);
            if ($line === false) break;

            $line = trim($line);
            if ($line === '!done') {
                $reponse[] = '!done';
                break;
            }
            if ($line === '!trap' || $line === '!fatal') {
                $reponse[] = $line;
                break;
            }
            $reponse[] = $line;
        }
        $this->deconnecter();
        return $reponse;
    }

    /**
     * Encoder une phrase RouterOS
     */
    private function encoder($str) {
        return chr(strlen($str)) . $str;
    }

    /**
     * Créer un utilisateur Hotspot (utilisé quand un ticket est vendu)
     */
    public function creerUtilisateur($code, $motDePasse, $dureeMinutes) {
        if ($this->simulation) {
            error_log("[MikroTik SIMULATION] Créer utilisateur : $code / $motDePasse / $dureeMinutes min");
            return true;
        }

        $cmd = [
            '/ip/hotspot/user/add',
            '=name=' . $code,
            '=password=' . $motDePasse,
            '=profile=' . 'default',
            '=limit-uptime=' . $dureeMinutes . 'm',
            '=comment=Cyber Famille',
        ];

        $commande = '';
        foreach ($cmd as $c) {
            $commande .= $this->encoder($c) . "\x00";
        }

        $reponse = $this->envoyerCommande([$commande]);
        return $reponse !== null;
    }

    /**
     * Supprimer un utilisateur Hotspot (coupure manuelle)
     */
    public function supprimerUtilisateur($code) {
        if ($this->simulation) {
            error_log("[MikroTik SIMULATION] Supprimer utilisateur : $code");
            return true;
        }

        // 1. Trouver l'utilisateur
        $cmdFind = '';
        foreach (['/ip/hotspot/user/print', '?name=' . $code] as $c) {
            $cmdFind .= $this->encoder($c) . "\x00";
        }

        $this->connecter();
        fwrite($this->socket, $cmdFind);
        $id = null;
        while (($line = fgets($this->socket, 4096)) !== false) {
            $line = trim($line);
            if (strpos($line, '=.id=') === 0) {
                $id = substr($line, 5);
            }
            if ($line === '!done') break;
        }
        $this->deconnecter();

        if (!$id) return false;

        // 2. Supprimer l'utilisateur
        $cmdDel = '';
        foreach (['/ip/hotspot/user/remove', '=.id=' . $id] as $c) {
            $cmdDel .= $this->encoder($c) . "\x00";
        }
        $reponse = $this->envoyerCommande([$cmdDel]);
        return $reponse !== null;
    }

    /**
     * Déconnecter une session active
     */
    public function deconnecterSession($code) {
        if ($this->simulation) {
            error_log("[MikroTik SIMULATION] Déconnecter session : $code");
            return true;
        }

        // Trouver la session active
        $cmdFind = '';
        foreach (['/ip/hotspot/active/print', '?user=' . $code] as $c) {
            $cmdFind .= $this->encoder($c) . "\x00";
        }

        $this->connecter();
        fwrite($this->socket, $cmdFind);
        $id = null;
        while (($line = fgets($this->socket, 4096)) !== false) {
            $line = trim($line);
            if (strpos($line, '=.id=') === 0) {
                $id = substr($line, 5);
            }
            if ($line === '!done') break;
        }
        $this->deconnecter();

        if (!$id) return false;

        // Déconnecter
        $cmdDel = '';
        foreach (['/ip/hotspot/active/remove', '=.id=' . $id] as $c) {
            $cmdDel .= $this->encoder($c) . "\x00";
        }
        $reponse = $this->envoyerCommande([$cmdDel]);
        return $reponse !== null;
    }

    /**
     * Tester la connexion
     */
    public function testerConnexion() {
        if ($this->simulation) {
            return [
                "connecte" => false,
                "mode" => "simulation",
                "message" => "Routeur non configuré ou désactivé — mode simulation actif"
            ];
        }

        if (!$this->connecter()) {
            return [
                "connecte" => false,
                "mode" => "erreur",
                "message" => "Impossible de joindre {$this->host}:{$this->port}"
            ];
        }

        $this->deconnecter();
        return [
            "connecte" => true,
            "mode" => "reel",
            "message" => "Connexion au routeur réussie"
        ];
    }

    public function isSimulation() {
        return $this->simulation;
    }
}