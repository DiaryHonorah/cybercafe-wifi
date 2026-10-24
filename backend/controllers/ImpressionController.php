<?php
require_once __DIR__ . '/../config/database.php';

class ImpressionController {

    private $host;
    private $port = 9100;
    private $largeur = 32;
    private $simulation = false;

    public function __construct() {
        $db = (new Database())->getConnection();

        $stmt = $db->query("
            SELECT cle, valeur FROM parametres_systeme
            WHERE cle IN ('imprimante_ip', 'imprimante_port', 'imprimante_active', 'imprimante_largeur')
        ");
        $params = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $params[$row['cle']] = $row['valeur'];
        }

        $this->host = $params['imprimante_ip'] ?? '';
        $this->port = (int)($params['imprimante_port'] ?? 9100);
        $this->largeur = (int)($params['imprimante_largeur'] ?? 32);
        $actif = (int)($params['imprimante_active'] ?? 0);

        if (!$actif || empty($this->host)) {
            $this->simulation = true;
        }
    }

    /**
     * Envoyer les données brutes à l'imprimante
     */
    private function envoyer($data) {
        if ($this->simulation) {
            error_log("[IMPRESSION SIMULATION] " . strlen($data) . " octets");
            return true;
        }

        $socket = @fsockopen($this->host, $this->port, $errno, $errstr, 3);
        if (!$socket) {
            error_log("[IMPRESSION ERREUR] $errstr ($errno)");
            return false;
        }

        fwrite($socket, $data);
        fclose($socket);
        return true;
    }

    /**
     * Générer les commandes ESC/POS pour un ticket
     */
    private function genererEscPosTicket($ticket, $nomCyber, $nomReseau, $qrBase64 = null) {
        $esc = chr(27);
        $gs = chr(29);
        $lf = chr(10);

        $data = '';

        // Initialisation
        $data .= $esc . '@';

        // ===== En-tête =====
        $data .= $esc . 'a' . chr(1); // Centrer
        $data .= $esc . 'E' . chr(1); // Gras
        $data .= $gs . '!' . chr(0x11); // Double taille
        $data .= $nomCyber . $lf;
        $data .= $gs . '!' . chr(0x00); // Taille normale
        $data .= $esc . 'E' . chr(0);
        $data .= "Starlink Wi-Fi Haut Debit" . $lf;
        $data .= str_repeat('-', $this->largeur) . $lf;

        // ===== Titre =====
        $data .= $esc . 'E' . chr(1);
        $data .= "TICKET DE CONNEXION WI-FI" . $lf;
        $data .= $esc . 'E' . chr(0);

        // ===== Informations =====
        $data .= $esc . 'a' . chr(0); // Gauche
        $data .= $this->ligne("Reseau", $nomReseau);
        $data .= $this->ligne("Code", $ticket['code']);
        $data .= $this->ligne("Mot de passe", $ticket['mot_de_passe']);
        $data .= $this->ligne("Duree", $ticket['duree_minutes'] . " minutes");
        $data .= $this->ligne("Prix", $ticket['prix'] . " Ar");
        $data .= str_repeat('-', $this->largeur) . $lf;

        // ===== QR Code (optionnel) =====
        if ($qrBase64) {
            $qrBin = $this->base64ToEscPosRaster($qrBase64);
            if ($qrBin) {
                $data .= $esc . 'a' . chr(1); // Centrer
                $data .= $qrBin;
                $data .= $lf;
                $data .= "Scannez pour vous connecter" . $lf;
                $data .= $lf;
            }
        }

        // ===== Instructions =====
        $data .= $esc . 'a' . chr(1); // Centrer
        $data .= "1. Connectez-vous au Wi-Fi" . $lf;
        $data .= "2. Ouvrez votre navigateur" . $lf;
        $data .= "3. Entrez le code et mot de passe" . $lf;
        $data .= "4. Bonne navigation !" . $lf;
        $data .= $lf;

        // ===== Date =====
        $data .= date('d/m/Y H:i') . $lf;
        $data .= $lf . $lf;

        // ===== Couper le papier =====
        $data .= $gs . 'V' . chr(66) . chr(0);

        return $data;
    }

    /**
     * Formater une ligne "label : valeur"
     */
    private function ligne($label, $valeur) {
        $label = $label . " :";
        $espace = $this->largeur - strlen($label) - strlen($valeur);
        if ($espace < 1) $espace = 1;
        return $label . str_repeat(' ', $espace) . $valeur . chr(10);
    }

    /**
     * Convertir un QR base64 en image raster ESC/POS
     */
    private function base64ToEscPosRaster($base64) {
        // Retirer le préfixe "data:image/png;base64,"
        $base64 = preg_replace('#^data:image/\w+;base64,#i', '', $base64);
        $bin = base64_decode($base64);
        if (!$bin) return null;

        // Créer une image GD
        $image = @imagecreatefromstring($bin);
        if (!$image) return null;

        $largeur = imagesx($image);
        $hauteur = imagesy($image);

        // Convertir en noir & blanc
        $data = chr(27) . 'a' . chr(1); // Centrer

        // ESC/POS raster : GS v 0 m xL xH yL yH
        $data .= chr(29) . 'v' . '0' . chr(0);
        $data .= chr($largeur % 256) . chr(intval($largeur / 256));
        $data .= chr($hauteur % 256) . chr(intval($hauteur / 256));

        // Convertir en bits
        for ($y = 0; $y < $hauteur; $y++) {
            $byte = 0;
            $bits = 0;
            for ($x = 0; $x < $largeur; $x++) {
                $rgb = imagecolorat($image, $x, $y);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;
                $niveau = ($r + $g + $b) / 3;

                if ($niveau < 128) {
                    $byte |= (1 << (7 - $bits));
                }
                $bits++;
                if ($bits == 8) {
                    $data .= chr($byte);
                    $byte = 0;
                    $bits = 0;
                }
            }
            if ($bits > 0) {
                $data .= chr($byte);
            }
        }

        imagedestroy($image);
        return $data;
    }

    /**
     * Imprimer un ticket
     * POST /api/impression/ticket
     */
    public function ticket() {
        $input = json_decode(file_get_contents("php://input"), true);
        $ticket_id = (int)($input['ticket_id'] ?? 0);

        if (!$ticket_id) {
            http_response_code(400);
            echo json_encode(["erreur" => "ticket_id requis"]);
            return;
        }

        $db = (new Database())->getConnection();

        $stmt = $db->prepare("
            SELECT t.*, f.prix, f.duree_minutes
            FROM tickets t
            JOIN forfaits f ON f.id = t.forfait_id
            WHERE t.id = ?
        ");
        $stmt->execute([$ticket_id]);
        $ticket = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$ticket) {
            http_response_code(404);
            echo json_encode(["erreur" => "Ticket introuvable"]);
            return;
        }

        // Paramètres système
        $params = [];
        $p = $db->query("SELECT cle, valeur FROM parametres_systeme")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($p as $row) {
            $params[$row['cle']] = $row['valeur'];
        }

        $nomCyber = $params['nom_cyber'] ?? 'Cyber Famille';
        $nomReseau = $params['nom_reseau'] ?? 'CYBER_FAMILLE';

        // Générer le QR Code
        $qrBase64 = null;
        try {
            require_once __DIR__ . '/../libs/phpqrcode/qrlib.php';
            $baseUrl = 'http://localhost:5173/portail';
            $contenu = $baseUrl . '?code=' . urlencode($ticket['code']);

            ob_start();
            QRcode::png($contenu, null, QR_ECLEVEL_M, 4, 1);
            $qrBin = ob_get_clean();
            $qrBase64 = 'data:image/png;base64,' . base64_encode($qrBin);
        } catch (Exception $e) {
            // QR non bloquant
        }

        // Générer ESC/POS
        $escpos = $this->genererEscPosTicket($ticket, $nomCyber, $nomReseau, $qrBase64);

        // Envoyer
        $ok = $this->envoyer($escpos);

        // Journaliser
        $log = $db->prepare("
            INSERT INTO impressions (ticket_id, type, statut, message)
            VALUES (?, 'ticket', ?, ?)
        ");
        $log->execute([
            $ticket_id,
            $ok ? 'reussi' : 'echoue',
            $this->simulation ? 'Mode simulation' : 'Impression réseau'
        ]);

        echo json_encode([
            "success" => $ok,
            "simulation" => $this->simulation,
            "message" => $ok
                ? ($this->simulation ? "Simulation réussie (aucune imprimante)" : "Ticket imprimé")
                : "Échec d'impression"
        ]);
    }

    /**
     * Tester la connexion à l'imprimante
     * POST /api/impression/tester
     */
    public function tester() {
        if ($this->simulation) {
            echo json_encode([
                "connecte" => false,
                "mode" => "simulation",
                "message" => "Aucune imprimante configurée — mode simulation actif"
            ]);
            return;
        }

        $socket = @fsockopen($this->host, $this->port, $errno, $errstr, 3);
        if (!$socket) {
            echo json_encode([
                "connecte" => false,
                "mode" => "erreur",
                "message" => "Impossible de joindre {$this->host}:{$this->port} — $errstr"
            ]);
            return;
        }
        fclose($socket);

        echo json_encode([
            "connecte" => true,
            "mode" => "reel",
            "message" => "Imprimante joignable sur {$this->host}:{$this->port}"
        ]);
    }

    /**
     * Imprimer un ticket de test
     * POST /api/impression/test
     */
    public function testImprimante() {
        $esc = chr(27);
        $gs = chr(29);
        $lf = chr(10);

        $data = $esc . '@';
        $data .= $esc . 'a' . chr(1);
        $data .= $esc . 'E' . chr(1);
        $data .= $gs . '!' . chr(0x11);
        $data .= "CYBER FAMILLE" . $lf;
        $data .= $gs . '!' . chr(0x00);
        $data .= $esc . 'E' . chr(0);
        $data .= "Test d'impression" . $lf;
        $data .= str_repeat('-', $this->largeur) . $lf;
        $data .= "Imprimante operationnelle !" . $lf;
        $data .= date('d/m/Y H:i') . $lf;
        $data .= $lf . $lf;
        $data .= $gs . 'V' . chr(66) . chr(0);

        $ok = $this->envoyer($data);

        echo json_encode([
            "success" => $ok,
            "simulation" => $this->simulation,
            "message" => $ok
                ? ($this->simulation ? "Simulation réussie" : "Test envoyé")
                : "Échec d'envoi"
        ]);
    }
}