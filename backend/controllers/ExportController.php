<?php
require_once __DIR__ . '/../config/database.php';

class ExportController {

    /**
     * Export CSV des ventes
     * GET /api/export/csv?debut=YYYY-MM-DD&fin=YYYY-MM-DD
     */
    public function csv() {
        $debut = $_GET['debut'] ?? date('Y-m-d');
        $fin = $_GET['fin'] ?? date('Y-m-d');

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("
            SELECT
                v.id,
                t.code,
                f.nom AS forfait,
                f.duree_minutes,
                v.montant,
                a.nom AS caissier,
                v.date_vente
            FROM ventes v
            JOIN tickets t ON t.id = v.ticket_id
            JOIN forfaits f ON f.id = t.forfait_id
            JOIN admins a ON a.id = v.admin_id
            WHERE DATE(v.date_vente) BETWEEN ? AND ?
            ORDER BY v.date_vente DESC
        ");
        $stmt->execute([$debut, $fin]);
        $ventes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // En-têtes CSV
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="recettes_' . $debut . '_' . $fin . '.csv"');

        $output = fopen('php://output', 'w');

        // BOM UTF-8 pour Excel
        fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

        // En-têtes
        fputcsv($output, [
            'ID', 'Code ticket', 'Forfait', 'Durée (min)', 'Montant (Ar)', 'Caissier', 'Date'
        ], ';');

        // Lignes
        foreach ($ventes as $v) {
            fputcsv($output, [
                $v['id'],
                $v['code'],
                $v['forfait'],
                $v['duree_minutes'],
                $v['montant'],
                $v['caissier'],
                $v['date_vente']
            ], ';');
        }

        // Total
        $total = array_sum(array_column($ventes, 'montant'));
        fputcsv($output, [], ';');
        fputcsv($output, ['', '', '', 'TOTAL', $total, '', ''], ';');

        fclose($output);
        exit;
    }

    /**
     * Résumé JSON pour export PDF côté client
     * GET /api/export/resume?debut=YYYY-MM-DD&fin=YYYY-MM-DD
     */
    public function resume() {
        $debut = $_GET['debut'] ?? date('Y-m-d');
        $fin = $_GET['fin'] ?? date('Y-m-d');

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("
            SELECT
                v.id,
                t.code,
                f.nom AS forfait,
                v.montant,
                a.nom AS caissier,
                v.date_vente
            FROM ventes v
            JOIN tickets t ON t.id = v.ticket_id
            JOIN forfaits f ON f.id = t.forfait_id
            JOIN admins a ON a.id = v.admin_id
            WHERE DATE(v.date_vente) BETWEEN ? AND ?
            ORDER BY v.date_vente DESC
        ");
        $stmt->execute([$debut, $fin]);
        $ventes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $total = array_sum(array_column($ventes, 'montant'));

        echo json_encode([
            "periode" => ["debut" => $debut, "fin" => $fin],
            "total" => $total,
            "nombre_ventes" => count($ventes),
            "ventes" => $ventes
        ]);
    }
}