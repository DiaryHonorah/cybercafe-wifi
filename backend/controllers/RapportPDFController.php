<?php
require_once __DIR__ . '/../config/database.php';

class RapportPDFController {

    /**
     * Données complètes pour un rapport
     * GET /api/rapport-pdf?debut=YYYY-MM-DD&fin=YYYY-MM-DD&type=journalier|hebdo|mensuel
     */
    public function donnees() {
        $debut = $_GET['debut'] ?? date('Y-m-d');
        $fin = $_GET['fin'] ?? date('Y-m-d');
        $type = $_GET['type'] ?? 'journalier';

        $db = (new Database())->getConnection();

        // 1. En-tête
        $parametres = [];
        $stmt = $db->query("SELECT cle, valeur FROM parametres_systeme");
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $parametres[$row['cle']] = $row['valeur'];
        }

        // 2. Totaux
        $stmt = $db->prepare("
            SELECT
                COUNT(*) AS nb_ventes,
                COALESCE(SUM(montant), 0) AS total,
                COUNT(DISTINCT ticket_id) AS nb_tickets
            FROM ventes
            WHERE DATE(date_vente) BETWEEN ? AND ?
        ");
        $stmt->execute([$debut, $fin]);
        $totaux = $stmt->fetch(PDO::FETCH_ASSOC);

        // 3. Détail par forfait
        $stmt = $db->prepare("
            SELECT
                f.nom AS forfait,
                f.duree_minutes,
                f.prix,
                COUNT(v.id) AS nb_ventes,
                COALESCE(SUM(v.montant), 0) AS total
            FROM forfaits f
            LEFT JOIN tickets t ON t.forfait_id = f.id
            LEFT JOIN ventes v ON v.ticket_id = t.id AND DATE(v.date_vente) BETWEEN ? AND ?
            GROUP BY f.id
            HAVING nb_ventes > 0
            ORDER BY total DESC
        ");
        $stmt->execute([$debut, $fin]);
        $par_forfait = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 4. Détail par caissier
        $stmt = $db->prepare("
            SELECT
                a.nom AS caissier,
                COUNT(v.id) AS nb_ventes,
                COALESCE(SUM(v.montant), 0) AS total
            FROM ventes v
            JOIN admins a ON a.id = v.admin_id
            WHERE DATE(v.date_vente) BETWEEN ? AND ?
            GROUP BY a.id
            ORDER BY total DESC
        ");
        $stmt->execute([$debut, $fin]);
        $par_caissier = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 5. Détail par jour
        $stmt = $db->prepare("
            SELECT
                DATE(date_vente) AS jour,
                COUNT(*) AS nb_ventes,
                COALESCE(SUM(montant), 0) AS total
            FROM ventes
            WHERE DATE(date_vente) BETWEEN ? AND ?
            GROUP BY DATE(date_vente)
            ORDER BY jour ASC
        ");
        $stmt->execute([$debut, $fin]);
        $par_jour = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 6. Détail des ventes
        $stmt = $db->prepare("
            SELECT
                t.code,
                f.nom AS forfait,
                a.nom AS caissier,
                v.montant,
                v.date_vente,
                v.nom_client
            FROM ventes v
            JOIN tickets t ON t.id = v.ticket_id
            JOIN forfaits f ON f.id = t.forfait_id
            JOIN admins a ON a.id = v.admin_id
            WHERE DATE(v.date_vente) BETWEEN ? AND ?
            ORDER BY v.date_vente DESC
        ");
        $stmt->execute([$debut, $fin]);
        $details = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 7. Top clients (si reçus renseignés)
        $stmt = $db->prepare("
            SELECT
                v.nom_client,
                v.telephone_client,
                COUNT(*) AS nb_achats,
                COALESCE(SUM(v.montant), 0) AS total
            FROM ventes v
            WHERE DATE(v.date_vente) BETWEEN ? AND ?
              AND v.nom_client IS NOT NULL AND v.nom_client != ''
            GROUP BY v.nom_client, v.telephone_client
            ORDER BY total DESC
            LIMIT 5
        ");
        $stmt->execute([$debut, $fin]);
        $top_clients = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "type" => $type,
            "periode" => ["debut" => $debut, "fin" => $fin],
            "parametres" => $parametres,
            "totaux" => $totaux,
            "par_forfait" => $par_forfait,
            "par_caissier" => $par_caissier,
            "par_jour" => $par_jour,
            "details" => $details,
            "top_clients" => $top_clients,
            "genere_le" => date('Y-m-d H:i:s')
        ]);
    }
}