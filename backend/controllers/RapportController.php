<?php
require_once __DIR__ . '/../config/database.php';

class RapportController {

    /**
     * Rapport journalier complet
     * GET /api/rapport?date=YYYY-MM-DD
     */
    public function journalier() {
        $date = $_GET['date'] ?? date('Y-m-d');
        $db = (new Database())->getConnection();

        // 1. Totaux généraux
        $stmt = $db->prepare("
            SELECT
                COUNT(*) AS nb_ventes,
                COALESCE(SUM(montant), 0) AS total
            FROM ventes
            WHERE DATE(date_vente) = ?
        ");
        $stmt->execute([$date]);
        $totaux = $stmt->fetch(PDO::FETCH_ASSOC);

        // 2. Répartition par forfait
        $stmt = $db->prepare("
            SELECT
                f.nom AS forfait,
                f.duree_minutes,
                f.prix,
                COUNT(v.id) AS nb_ventes,
                COALESCE(SUM(v.montant), 0) AS total
            FROM forfaits f
            LEFT JOIN tickets t ON t.forfait_id = f.id
            LEFT JOIN ventes v ON v.ticket_id = t.id AND DATE(v.date_vente) = ?
            GROUP BY f.id
            HAVING nb_ventes > 0
            ORDER BY total DESC
        ");
        $stmt->execute([$date]);
        $parForfait = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Répartition par caissier
        $stmt = $db->prepare("
            SELECT
                a.nom AS caissier,
                COUNT(v.id) AS nb_ventes,
                COALESCE(SUM(v.montant), 0) AS total
            FROM ventes v
            JOIN admins a ON a.id = v.admin_id
            WHERE DATE(v.date_vente) = ?
            GROUP BY a.id
            ORDER BY total DESC
        ");
        $stmt->execute([$date]);
        $parCaissier = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 4. Détail des ventes
        $stmt = $db->prepare("
            SELECT
                t.code,
                f.nom AS forfait,
                a.nom AS caissier,
                v.montant,
                v.date_vente
            FROM ventes v
            JOIN tickets t ON t.id = v.ticket_id
            JOIN forfaits f ON f.id = t.forfait_id
            JOIN admins a ON a.id = v.admin_id
            WHERE DATE(v.date_vente) = ?
            ORDER BY v.date_vente DESC
        ");
        $stmt->execute([$date]);
        $details = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 5. Paramètres système
        $params = $db->query("SELECT cle, valeur FROM parametres_systeme")->fetchAll(PDO::FETCH_ASSOC);
        $parametres = [];
        foreach ($params as $p) {
            $parametres[$p['cle']] = $p['valeur'];
        }

        echo json_encode([
            "date" => $date,
            "totaux" => $totaux,
            "par_forfait" => $parForfait,
            "par_caissier" => $parCaissier,
            "details" => $details,
            "parametres" => $parametres
        ]);
    }
}