<?php
require_once __DIR__ . '/../config/database.php';

class RecuController {

    /**
     * Enregistrer les infos client sur une vente
     * POST /api/recu/client
     * Body : { "vente_id": 5, "nom_client": "Rakoto", "telephone": "034...", "remarque": "..." }
     */
    public function enregistrerClient() {
        $data = json_decode(file_get_contents("php://input"), true);
        $vente_id = (int)($data['vente_id'] ?? 0);
        $nom = trim($data['nom_client'] ?? '');
        $tel = trim($data['telephone'] ?? '');
        $remarque = trim($data['remarque'] ?? '');

        if (!$vente_id) {
            http_response_code(400);
            echo json_encode(["erreur" => "vente_id requis"]);
            return;
        }

        $db = (new Database())->getConnection();

        // Générer un numéro de reçu unique
        $numero_recu = 'REC-' . date('Ymd') . '-' . str_pad($vente_id, 5, '0', STR_PAD_LEFT);

        $stmt = $db->prepare("
            UPDATE ventes 
            SET nom_client = ?, telephone_client = ?, numero_recu = ?, remarque = ?
            WHERE id = ?
        ");
        $ok = $stmt->execute([$nom, $tel, $numero_recu, $remarque, $vente_id]);

        echo json_encode([
            "success" => $ok,
            "numero_recu" => $numero_recu,
            "vente_id" => $vente_id
        ]);
    }

    /**
     * Récupérer les données d'un reçu
     * GET /api/recu?vente_id=5
     */
    public function getRecu() {
        $vente_id = (int)($_GET['vente_id'] ?? 0);

        if (!$vente_id) {
            http_response_code(400);
            echo json_encode(["erreur" => "vente_id requis"]);
            return;
        }

        $db = (new Database())->getConnection();

        $stmt = $db->prepare("
            SELECT 
                v.id AS vente_id,
                v.montant,
                v.date_vente,
                v.nom_client,
                v.telephone_client,
                v.numero_recu,
                v.remarque,
                t.code AS ticket_code,
                t.duree_minutes,
                f.nom AS forfait_nom,
                f.prix AS forfait_prix,
                a.nom AS caissier
            FROM ventes v
            JOIN tickets t ON t.id = v.ticket_id
            JOIN forfaits f ON f.id = t.forfait_id
            JOIN admins a ON a.id = v.admin_id
            WHERE v.id = ?
            LIMIT 1
        ");
        $stmt->execute([$vente_id]);
        $recu = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$recu) {
            http_response_code(404);
            echo json_encode(["erreur" => "Reçu introuvable"]);
            return;
        }

        // Ajouter les infos du cybercafé
        $params = [];
        $p = $db->query("SELECT cle, valeur FROM parametres_systeme")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($p as $row) {
            $params[$row['cle']] = $row['valeur'];
        }

        $recu['nom_cyber'] = $params['nom_cyber'] ?? 'Cyber Famille';
        $recu['adresse_cyber'] = $params['adresse'] ?? '';
        $recu['telephone_cyber'] = $params['telephone'] ?? '';
        $recu['devise'] = $params['devise'] ?? 'Ar';

        echo json_encode($recu);
    }

    /**
     * Récupérer le dernier reçu (pour impression rapide)
     * GET /api/recu/dernier
     */
    public function dernier() {
        $db = (new Database())->getConnection();

        $stmt = $db->query("
            SELECT 
                v.id AS vente_id,
                v.montant,
                v.date_vente,
                v.nom_client,
                v.telephone_client,
                v.numero_recu,
                v.remarque,
                t.code AS ticket_code,
                t.duree_minutes,
                f.nom AS forfait_nom,
                a.nom AS caissier
            FROM ventes v
            JOIN tickets t ON t.id = v.ticket_id
            JOIN forfaits f ON f.id = t.forfait_id
            JOIN admins a ON a.id = v.admin_id
            ORDER BY v.date_vente DESC
            LIMIT 1
        ");
        $recu = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$recu) {
            http_response_code(404);
            echo json_encode(["erreur" => "Aucune vente"]);
            return;
        }

        $params = [];
        $p = $db->query("SELECT cle, valeur FROM parametres_systeme")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($p as $row) {
            $params[$row['cle']] = $row['valeur'];
        }

        $recu['nom_cyber'] = $params['nom_cyber'] ?? 'Cyber Famille';
        $recu['adresse_cyber'] = $params['adresse'] ?? '';
        $recu['telephone_cyber'] = $params['telephone'] ?? '';
        $recu['devise'] = $params['devise'] ?? 'Ar';

        echo json_encode($recu);
    }
}