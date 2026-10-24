<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/MikroTikService.php';
require_once __DIR__ . '/../websocket/Notifier.php';

class TicketController {
    public function creer() {
        $data = json_decode(file_get_contents("php://input"), true);
        $forfait_id = $data['forfait_id'] ?? null;
        $admin_id   = $data['admin_id'] ?? 1;
        $quantite   = (int)($data['quantite'] ?? 1);

        if (!$forfait_id) {
            http_response_code(400);
            echo json_encode(["erreur" => "Forfait obligatoire"]);
            return;
        }

        $db = (new Database())->getConnection();
        $forfait = $db->prepare("SELECT * FROM forfaits WHERE id = ?");
        $forfait->execute([$forfait_id]);
        $f = $forfait->fetch(PDO::FETCH_ASSOC);

        if (!$f) {
            http_response_code(404);
            echo json_encode(["erreur" => "Forfait introuvable"]);
            return;
        }

        $service = new MikroTikService();
        $tickets = [];

        for ($i = 0; $i < $quantite; $i++) {
            $code = "CF-" . strtoupper(bin2hex(random_bytes(3)));
            $mdp  = strtoupper(bin2hex(random_bytes(3)));

            $stmt = $db->prepare("
                INSERT INTO tickets (code, mot_de_passe, forfait_id, duree_minutes)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$code, $mdp, $forfait_id, $f['duree_minutes']]);
            $ticket_id = $db->lastInsertId();

            $vente = $db->prepare("
                INSERT INTO ventes (ticket_id, admin_id, montant)
                VALUES (?, ?, ?)
            ");
            $vente->execute([$ticket_id, $admin_id, $f['prix']]);

            $service->creerUtilisateur($code, $mdp, (int)$f['duree_minutes']);

            // Notification WebSocket (silencieux si serveur non lancé)
            Notifier::vente($code, $f['prix']);

            // Enregistrer en base
            try {
                $notif = $db->prepare("
                    INSERT INTO notifications (type, titre, message)
                    VALUES ('vente', 'Nouvelle vente', ?)
                ");
                $notif->execute(["Ticket $code vendu pour {$f['prix']} Ar"]);
            } catch (Exception $e) {
                // Ignorer si la table n'existe pas
            }

            $tickets[] = [
                "id" => $ticket_id,
                "code" => $code,
                "mot_de_passe" => $mdp,
                "duree" => (int)$f['duree_minutes'],
                "prix" => (int)$f['prix']
            ];
        }

        echo json_encode([
            "success" => true,
            "tickets" => $tickets,
            "simulation" => $service->isSimulation()
        ]);
    }
}