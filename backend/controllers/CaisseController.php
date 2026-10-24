<?php
require_once __DIR__ . '/../config/database.php';

class CaisseController {

    /**
     * Lister toutes les caisses
     * GET /api/caisses
     */
    public function liste() {
        $db = (new Database())->getConnection();
        $stmt = $db->query("
            SELECT
                c.id,
                c.nom,
                c.description,
                c.statut,
                c.cree_le,
                (SELECT COUNT(*) FROM sessions_caisse s 
                 WHERE s.caisse_id = c.id AND s.statut = 'ouverte') AS utilisee,
                (SELECT COUNT(*) FROM ventes v 
                 WHERE v.caisse_id = c.id AND DATE(v.date_vente) = CURDATE()) AS ventes_jour,
                (SELECT COALESCE(SUM(v.montant), 0) FROM ventes v 
                 WHERE v.caisse_id = c.id AND DATE(v.date_vente) = CURDATE()) AS total_jour
            FROM caisses c
            ORDER BY c.id ASC
        ");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Créer une caisse
     * POST /api/caisses/creer
     */
    public function creer() {
        $data = json_decode(file_get_contents("php://input"), true);
        $nom = trim($data['nom'] ?? '');
        $description = trim($data['description'] ?? '');

        if (!$nom) {
            http_response_code(400);
            echo json_encode(["erreur" => "Nom requis"]);
            return;
        }

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("
            INSERT INTO caisses (nom, description)
            VALUES (?, ?)
        ");
        $ok = $stmt->execute([$nom, $description]);

        echo json_encode([
            "success" => $ok,
            "id" => $db->lastInsertId()
        ]);
    }

    /**
     * Modifier une caisse
     * POST /api/caisses/modifier
     */
    public function modifier() {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = (int)($data['id'] ?? 0);
        $nom = trim($data['nom'] ?? '');
        $description = trim($data['description'] ?? '');
        $statut = $data['statut'] ?? 'active';

        if (!$id || !$nom) {
            http_response_code(400);
            echo json_encode(["erreur" => "ID et nom requis"]);
            return;
        }

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("
            UPDATE caisses
            SET nom = ?, description = ?, statut = ?
            WHERE id = ?
        ");
        $ok = $stmt->execute([$nom, $description, $statut, $id]);

        echo json_encode(["success" => $ok]);
    }

    /**
     * Supprimer une caisse
     * POST /api/caisses/supprimer
     */
    public function supprimer() {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = (int)($data['id'] ?? 0);

        if (!$id) {
            http_response_code(400);
            echo json_encode(["erreur" => "ID requis"]);
            return;
        }

        $db = (new Database())->getConnection();

        // Vérifier qu'aucune session n'est ouverte
        $check = $db->prepare("
            SELECT COUNT(*) FROM sessions_caisse
            WHERE caisse_id = ? AND statut = 'ouverte'
        ");
        $check->execute([$id]);
        if ($check->fetchColumn() > 0) {
            http_response_code(403);
            echo json_encode(["erreur" => "Caisse en cours d'utilisation"]);
            return;
        }

        $stmt = $db->prepare("DELETE FROM caisses WHERE id = ?");
        $ok = $stmt->execute([$id]);

        echo json_encode(["success" => $ok]);
    }

    /**
     * Ouvrir une session de caisse
     * POST /api/caisses/ouvrir
     * Body : { "caisse_id": 1, "admin_id": 1 }
     */
    public function ouvrir() {
        $data = json_decode(file_get_contents("php://input"), true);
        $caisse_id = (int)($data['caisse_id'] ?? 0);
        $admin_id = (int)($data['admin_id'] ?? 0);

        if (!$caisse_id || !$admin_id) {
            http_response_code(400);
            echo json_encode(["erreur" => "caisse_id et admin_id requis"]);
            return;
        }

        $db = (new Database())->getConnection();

        // Vérifier que la caisse n'est pas déjà utilisée
        $check = $db->prepare("
            SELECT COUNT(*) FROM sessions_caisse
            WHERE caisse_id = ? AND statut = 'ouverte'
        ");
        $check->execute([$caisse_id]);
        if ($check->fetchColumn() > 0) {
            http_response_code(403);
            echo json_encode(["erreur" => "Cette caisse est déjà utilisée"]);
            return;
        }

        // Fermer les autres sessions de cet admin
        $db->prepare("
            UPDATE sessions_caisse 
            SET statut = 'fermee', fin = NOW()
            WHERE admin_id = ? AND statut = 'ouverte'
        ")->execute([$admin_id]);

        // Créer la nouvelle session
        $stmt = $db->prepare("
            INSERT INTO sessions_caisse (caisse_id, admin_id, debut, statut)
            VALUES (?, ?, NOW(), 'ouverte')
        ");
        $stmt->execute([$caisse_id, $admin_id]);
        $session_id = $db->lastInsertId();

        echo json_encode([
            "success" => true,
            "session_id" => $session_id,
            "caisse_id" => $caisse_id
        ]);
    }

    /**
     * Fermer la session active
     * POST /api/caisses/fermer
     * Body : { "admin_id": 1 }
     */
    public function fermer() {
        $data = json_decode(file_get_contents("php://input"), true);
        $admin_id = (int)($data['admin_id'] ?? 0);

        if (!$admin_id) {
            http_response_code(400);
            echo json_encode(["erreur" => "admin_id requis"]);
            return;
        }

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("
            UPDATE sessions_caisse
            SET statut = 'fermee', fin = NOW()
            WHERE admin_id = ? AND statut = 'ouverte'
        ");
        $stmt->execute([$admin_id]);

        echo json_encode(["success" => true]);
    }

    /**
     * Récupérer la session active d'un admin
     * GET /api/caisses/session?admin_id=1
     */
    public function session() {
        $admin_id = (int)($_GET['admin_id'] ?? 0);

        if (!$admin_id) {
            http_response_code(400);
            echo json_encode(["erreur" => "admin_id requis"]);
            return;
        }

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("
            SELECT
                s.id AS session_id,
                s.caisse_id,
                s.debut,
                s.statut,
                c.nom AS caisse_nom,
                c.description AS caisse_description
            FROM sessions_caisse s
            JOIN caisses c ON c.id = s.caisse_id
            WHERE s.admin_id = ? AND s.statut = 'ouverte'
            ORDER BY s.id DESC
            LIMIT 1
        ");
        $stmt->execute([$admin_id]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$session) {
            echo json_encode(["active" => false]);
            return;
        }

        echo json_encode(["active" => true, "session" => $session]);
    }

    /**
     * Statistiques par caisse
     * GET /api/caisses/stats
     */
    public function stats() {
        $db = (new Database())->getConnection();
        $stmt = $db->query("
            SELECT
                c.id,
                c.nom,
                COALESCE(SUM(CASE WHEN DATE(v.date_vente) = CURDATE() THEN v.montant END), 0) AS ventes_jour,
                COALESCE(SUM(CASE WHEN v.date_vente >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN v.montant END), 0) AS ventes_semaine,
                COALESCE(SUM(v.montant), 0) AS ventes_total,
                COUNT(DISTINCT CASE WHEN DATE(v.date_vente) = CURDATE() THEN v.id END) AS nb_ventes_jour
            FROM caisses c
            LEFT JOIN ventes v ON v.caisse_id = c.id
            GROUP BY c.id
            ORDER BY ventes_jour DESC
        ");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}