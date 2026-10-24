<?php
require_once __DIR__ . '/../config/database.php';

class SiteController {

    /**
     * Lister tous les sites
     * GET /api/sites
     */
    public function liste() {
        $db = (new Database())->getConnection();
        $stmt = $db->query("
            SELECT
                s.id,
                s.nom,
                s.adresse,
                s.telephone,
                s.actif,
                s.cree_le,
                COUNT(a.id) AS nb_admins
            FROM sites s
            LEFT JOIN admins a ON a.site_id = s.id
            GROUP BY s.id
            ORDER BY s.cree_le DESC
        ");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Créer un site
     * POST /api/sites/creer
     */
    public function creer() {
        $data = json_decode(file_get_contents("php://input"), true);
        $nom = trim($data['nom'] ?? '');
        $adresse = trim($data['adresse'] ?? '');
        $telephone = trim($data['telephone'] ?? '');

        if (!$nom) {
            http_response_code(400);
            echo json_encode(["erreur" => "Nom du site requis"]);
            return;
        }

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("
            INSERT INTO sites (nom, adresse, telephone)
            VALUES (?, ?, ?)
        ");
        $ok = $stmt->execute([$nom, $adresse, $telephone]);

        echo json_encode([
            "success" => $ok,
            "id" => $db->lastInsertId()
        ]);
    }

    /**
     * Modifier un site
     * POST /api/sites/modifier
     */
    public function modifier() {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = (int)($data['id'] ?? 0);
        $nom = trim($data['nom'] ?? '');
        $adresse = trim($data['adresse'] ?? '');
        $telephone = trim($data['telephone'] ?? '');
        $actif = !empty($data['actif']) ? 1 : 0;

        if (!$id || !$nom) {
            http_response_code(400);
            echo json_encode(["erreur" => "ID et nom requis"]);
            return;
        }

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("
            UPDATE sites
            SET nom = ?, adresse = ?, telephone = ?, actif = ?
            WHERE id = ?
        ");
        $ok = $stmt->execute([$nom, $adresse, $telephone, $actif, $id]);

        echo json_encode(["success" => $ok]);
    }

    /**
     * Supprimer un site
     * POST /api/sites/supprimer
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

        $count = $db->query("SELECT COUNT(*) FROM sites")->fetchColumn();
        if ($count <= 1) {
            http_response_code(403);
            echo json_encode(["erreur" => "Impossible de supprimer le dernier site"]);
            return;
        }

        $stmt = $db->prepare("DELETE FROM sites WHERE id = ?");
        $ok = $stmt->execute([$id]);

        echo json_encode(["success" => $ok]);
    }

    /**
     * Statistiques comparatives entre sites
     * GET /api/sites/comparaison
     */
    public function comparaison() {
        $db = (new Database())->getConnection();
        $stmt = $db->query("
            SELECT
                s.id,
                s.nom,
                COALESCE(SUM(CASE WHEN DATE(v.date_vente) = CURDATE() THEN v.montant END), 0) AS ventes_jour,
                COALESCE(SUM(CASE WHEN v.date_vente >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN v.montant END), 0) AS ventes_semaine,
                COALESCE(SUM(v.montant), 0) AS ventes_total,
                COUNT(DISTINCT v.id) AS nb_ventes
            FROM sites s
            LEFT JOIN admins a ON a.site_id = s.id
            LEFT JOIN ventes v ON v.admin_id = a.id
            GROUP BY s.id
            ORDER BY ventes_total DESC
        ");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}