<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/MikroTikService.php';
require_once __DIR__ . '/../websocket/Notifier.php';

class SessionController {

    public function demarrer() {
        $data = json_decode(file_get_contents("php://input"), true);
        $code = strtoupper(trim($data['code'] ?? ''));
        $mdp  = strtoupper(trim($data['mot_de_passe'] ?? ''));

        error_log("[SESSION] Tentative : code=$code");

        if (!$code || !$mdp) {
            http_response_code(400);
            echo json_encode(["erreur" => "Code et mot de passe requis"]);
            return;
        }

        $db = (new Database())->getConnection();

        // 1. Vérifier le ticket
        $stmt = $db->prepare("
            SELECT t.*, f.nom AS forfait_nom, f.duree_minutes AS forfait_duree
            FROM tickets t
            JOIN forfaits f ON f.id = t.forfait_id
            WHERE t.code = ? AND t.mot_de_passe = ?
        ");
        $stmt->execute([$code, $mdp]);
        $ticket = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$ticket) {
            http_response_code(404);
            echo json_encode(["erreur" => "Ticket introuvable ou mot de passe incorrect"]);
            return;
        }

        // 2. Vérifier l'état
        if ($ticket['statut'] !== 'disponible') {
            http_response_code(403);
            echo json_encode(["erreur" => "Ce ticket n'est pas disponible (statut: {$ticket['statut']})"]);
            return;
        }

        // 3. Déterminer la durée (ROBUSTE)
        $duree = 0;
        
        if (isset($ticket['duree_minutes']) && $ticket['duree_minutes'] !== null) {
            $duree = (int)$ticket['duree_minutes'];
        }
        
        if ($duree <= 0 && isset($ticket['forfait_duree'])) {
            $duree = (int)$ticket['forfait_duree'];
        }
        
        if ($duree <= 0) {
            $duree = 60;
        }

        error_log("[SESSION] Durée finale utilisée : $duree minutes");

        // 4. Calcul expiration (MÉTHODE SÛRE : modify, pas DateInterval)
        $maintenant = new DateTime();
        $expiration = new DateTime();
        $expiration->modify("+{$duree} minutes");

        $debutStr = $maintenant->format('Y-m-d H:i:s');
        $expStr = $expiration->format('Y-m-d H:i:s');

        error_log("[SESSION] Début=$debutStr Expiration=$expStr");

        // 5. Mise à jour du ticket
        $upd = $db->prepare("
            UPDATE tickets
            SET statut = 'utilise',
                duree_minutes = ?,
                debut_session = ?,
                expiration = ?
            WHERE id = ?
        ");
        $upd->execute([$duree, $debutStr, $expStr, $ticket['id']]);

        // 6. Création de la session
        try {
            $ins = $db->prepare("
                INSERT INTO sessions_wifi (ticket_id, debut, fin, statut)
                VALUES (?, ?, ?, 'active')
            ");
            $ins->execute([$ticket['id'], $debutStr, $expStr]);
            $session_id = $db->lastInsertId();

            error_log("[SESSION] ✅ Session créée : id=$session_id ticket_id={$ticket['id']}");

        } catch (PDOException $e) {
            error_log("[SESSION] ❌ ERREUR INSERT : " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                "erreur" => "Impossible de créer la session",
                "detail" => $e->getMessage()
            ]);
            return;
        }

        // 7. MikroTik (silencieux)
        try {
            $service = new MikroTikService();
            $service->creerUtilisateur($ticket['code'], $ticket['mot_de_passe'], $duree);
        } catch (Exception $e) {}

        // 8. Notifications
        try { Notifier::session($ticket['code'], $duree); } catch (Exception $e) {}
        try {
            $notif = $db->prepare("
                INSERT INTO notifications (type, titre, message)
                VALUES ('session', 'Nouvelle session', ?)
            ");
            $notif->execute(["Client {$ticket['code']} connecté pour {$duree} minutes"]);
        } catch (Exception $e) {}

        echo json_encode([
            "success" => true,
            "session_id" => $session_id,
            "code" => $ticket['code'],
            "forfait" => $ticket['forfait_nom'],
            "duree_minutes" => $duree,
            "debut" => $debutStr,
            "expiration" => $expStr,
            "secondes_restantes" => $duree * 60
        ]);
    }

    public function liste() {
        $db = (new Database())->getConnection();

        $db->exec("
            UPDATE sessions_wifi
            SET statut = 'expiree'
            WHERE statut = 'active' AND fin IS NOT NULL AND fin <= NOW()
        ");
        $db->exec("
            UPDATE tickets
            SET statut = 'expire'
            WHERE statut = 'utilise' AND expiration IS NOT NULL AND expiration <= NOW()
        ");

        $stmt = $db->query("
            SELECT
                s.id,
                t.code,
                t.duree_minutes,
                f.nom AS forfait_nom,
                s.debut,
                s.fin,
                s.statut,
                GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), s.fin)) AS secondes_restantes
            FROM sessions_wifi s
            JOIN tickets t ON t.id = s.ticket_id
            JOIN forfaits f ON f.id = t.forfait_id
            WHERE s.statut = 'active'
            ORDER BY s.debut DESC
        ");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function terminer() {
        $data = json_decode(file_get_contents("php://input"), true);
        $session_id = $data['session_id'] ?? null;

        if (!$session_id) {
            http_response_code(400);
            echo json_encode(["erreur" => "session_id requis"]);
            return;
        }

        $db = (new Database())->getConnection();
        $db->prepare("
            UPDATE sessions_wifi SET statut = 'terminee', fin = NOW()
            WHERE id = ? AND statut = 'active'
        ")->execute([$session_id]);

        $db->prepare("
            UPDATE tickets t
            JOIN sessions_wifi s ON s.ticket_id = t.id
            SET t.statut = 'expire', t.expiration = NOW()
            WHERE s.id = ?
        ")->execute([$session_id]);

        echo json_encode(["success" => true]);
    }

    public function statut() {
        $code = strtoupper(trim($_GET['code'] ?? ''));
        if (!$code) {
            http_response_code(400);
            echo json_encode(["erreur" => "Code requis"]);
            return;
        }

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("
            SELECT
                t.code,
                t.statut AS ticket_statut,
                t.debut_session,
                t.expiration,
                s.id AS session_id,
                s.statut AS session_statut,
                GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), s.fin)) AS secondes_restantes
            FROM tickets t
            LEFT JOIN sessions_wifi s ON s.ticket_id = t.id
            WHERE t.code = ?
            ORDER BY s.id DESC
            LIMIT 1
        ");
        $stmt->execute([$code]);
        echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
    }
}