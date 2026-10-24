<?php
require_once __DIR__ . '/../config/database.php';

class QrCodeController {

    /**
     * Charge la bibliothèque phpqrcode + vérifie GD
     */
    private function chargerLib() {
        $chemin = __DIR__ . '/../libs/phpqrcode/qrlib.php';

        if (!file_exists($chemin)) {
            throw new Exception("Fichier qrlib.php introuvable à : $chemin");
        }
        if (!extension_loaded('gd')) {
            throw new Exception("Extension GD non activée dans php.ini");
        }

        require_once $chemin;

        if (!class_exists('QRcode')) {
            throw new Exception("Classe QRcode introuvable après chargement");
        }
    }

    /**
     * Générer un QR Code pour un ticket (retourne du base64)
     * GET /api/qrcode?code=CF-XXXXX
     */
    public function generer() {
        $code = strtoupper(trim($_GET['code'] ?? ''));

        if (!$code) {
            http_response_code(400);
            echo json_encode(["erreur" => "Code requis"]);
            return;
        }

        // Contenu encodé dans le QR Code
        $baseUrl = $_GET['base'] ?? 'http://localhost:5173/portail';
        $contenu = $baseUrl . '?code=' . urlencode($code);

        try {
            $this->chargerLib();

            // Capture du PNG en mémoire
            ob_start();
            QRcode::png($contenu, null, QR_ECLEVEL_M, 6, 2);
            $image = ob_get_clean();

            if (!$image || strlen($image) < 100) {
                throw new Exception("Image générée vide (" . strlen($image) . " octets)");
            }

            $base64 = 'data:image/png;base64,' . base64_encode($image);

            echo json_encode([
                "success" => true,
                "code" => $code,
                "contenu" => $contenu,
                "qr_base64" => $base64
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                "erreur" => "Impossible de générer le QR Code",
                "detail" => $e->getMessage(),
                "fichier_existe" => file_exists(__DIR__ . '/../libs/phpqrcode/qrlib.php') ? "oui" : "non",
                "gd_active" => extension_loaded('gd') ? "oui" : "non"
            ]);
        }
    }

    /**
     * Récupérer un QR Code pour un ticket précis
     * GET /api/qrcode/ticket?id=1
     */
    public function pourTicket() {
        $id = (int)($_GET['id'] ?? 0);

        if (!$id) {
            http_response_code(400);
            echo json_encode(["erreur" => "ID du ticket requis"]);
            return;
        }

        $db = (new Database())->getConnection();
        $stmt = $db->prepare("SELECT code FROM tickets WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $ticket = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$ticket) {
            http_response_code(404);
            echo json_encode(["erreur" => "Ticket introuvable"]);
            return;
        }

        $_GET['code'] = $ticket['code'];
        $this->generer();
    }

    /**
     * Retourner directement l'image PNG
     * GET /api/qrcode/image?code=CF-XXXXX
     */
    public function image() {
        $code = strtoupper(trim($_GET['code'] ?? ''));

        if (!$code) {
            http_response_code(400);
            header('Content-Type: application/json');
            echo json_encode(["erreur" => "Code requis"]);
            return;
        }

        $baseUrl = $_GET['base'] ?? 'http://localhost:5173/portail';
        $contenu = $baseUrl . '?code=' . urlencode($code);

        try {
            $this->chargerLib();

            header('Content-Type: image/png');
            header('Cache-Control: public, max-age=3600');
            QRcode::png($contenu, false, QR_ECLEVEL_M, 6, 2);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                "erreur" => $e->getMessage(),
                "gd_active" => extension_loaded('gd') ? "oui" : "non"
            ]);
        }
    }
}