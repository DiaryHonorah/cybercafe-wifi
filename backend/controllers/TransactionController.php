<?php
/**
 * Contrôleur Transaction
 */

require_once __DIR__ . '/../models/Transaction.php';

class TransactionController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Transaction($this->db);
    }

    private function connecter()
    {
        $configPath = __DIR__ . '/../config/database.php';
        if (!file_exists($configPath)) {
            throw new Exception("Fichier config/database.php introuvable");
        }
        require_once $configPath;
        if (class_exists('Database')) {
            $database = new Database();
            return $database->getConnection();
        }
        throw new Exception("Classe Database introuvable");
    }

    // =====================================================
    // CLIENT
    // =====================================================

    /**
     * GET /api/client/transactions
     */
    public function mesTransactions()
    {
        try {
            $client = $this->verifierClient();

            $filtres = [
                'type' => $_GET['type'] ?? null,
                'sens' => $_GET['sens'] ?? null,
                'date_debut' => $_GET['date_debut'] ?? null,
                'date_fin' => $_GET['date_fin'] ?? null,
                'limite' => isset($_GET['limite']) ? intval($_GET['limite']) : 100,
            ];

            $transactions = $this->model->mesTransactions($client['id'], $filtres);
            $stats = $this->model->mesStats($client['id']);

            // Ajouter les libellés
            foreach ($transactions as &$t) {
                $t['type_label'] = $this->model->getTypeLabel($t['type']);
                if (!empty($t['metadata'])) {
                    $t['metadata'] = json_decode($t['metadata'], true);
                }
            }

            echo json_encode([
                'success' => true,
                'transactions' => $transactions,
                'stats' => $stats,
            ]);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/client/transactions/export
     */
    public function exportCSV()
    {
        try {
            $client = $this->verifierClient();
            $csv = $this->model->exportCSV($client['id']);

            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="transactions_' . date('Y-m-d') . '.csv"');
            header('Pragma: no-cache');
            header('Expires: 0');

            echo "\xEF\xBB\xBF"; // BOM UTF-8 pour Excel
            echo $csv;
            exit;

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // ADMIN
    // =====================================================

    /**
     * GET /api/transactions/admin/liste
     */
    public function listeAdmin()
    {
        try {
            $this->verifierAdmin();

            $filtres = [
                'client_id' => isset($_GET['client_id']) ? intval($_GET['client_id']) : null,
                'type' => $_GET['type'] ?? null,
                'sens' => $_GET['sens'] ?? null,
                'recherche' => $_GET['recherche'] ?? null,
                'limite' => isset($_GET['limite']) ? intval($_GET['limite']) : 200,
            ];

            $transactions = $this->model->listeAdmin($filtres);
            $stats = $this->model->statsGlobales();

            foreach ($transactions as &$t) {
                $t['type_label'] = $this->model->getTypeLabel($t['type']);
                if (!empty($t['metadata'])) {
                    $t['metadata'] = json_decode($t['metadata'], true);
                }
            }

            echo json_encode([
                'success' => true,
                'transactions' => $transactions,
                'stats' => $stats,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/transactions/admin/ajuster
     * Ajustement manuel du solde bonus par l'admin
     */
    public function ajuster()
    {
        try {
            $admin = $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            $clientId = intval($data['client_id'] ?? 0);
            $montant = floatval($data['montant'] ?? 0);
            $sens = $data['sens'] ?? 'credit';
            $description = trim($data['description'] ?? '');

            if ($clientId <= 0 || $montant <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Client ID et montant requis']);
                return;
            }

            if (!in_array($sens, ['credit', 'debit'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Sens invalide']);
                return;
            }

            if (empty($description)) {
                $description = ($sens === 'credit' ? 'Bonus manuel' : 'Retrait manuel') . 
                    ' par ' . $admin['nom'];
            }

            $resultat = $this->model->enregistrer(
                $clientId,
                'bonus_manuel',
                $sens,
                $montant,
                $description,
                ['reference_type' => 'admin', 'reference_id' => $admin['id']]
            );

            // Notification au client
            $stmt = $this->db->prepare("
                INSERT INTO clients_notifications (client_id, titre, message, type) 
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([
                $clientId,
                $sens === 'credit' ? '💰 Bonus reçu !' : '💸 Retrait de bonus',
                $sens === 'credit'
                    ? "Vous avez reçu " . number_format($montant, 0, ',', ' ') . " Ar de bonus : $description"
                    : number_format($montant, 0, ',', ' ') . " Ar retirés de votre solde : $description",
                $sens === 'credit' ? 'success' : 'info',
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Solde ajusté',
                'resultat' => $resultat,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // AUTH
    // =====================================================

    private function verifierClient()
    {
        $headers = $this->recupererHeaders();
        $authHeader = $headers['authorization'] ?? $headers['Authorization'] ?? '';

        $token = '';
        if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
            $token = trim($matches[1]);
        }

        if (empty($token)) {
            throw new Exception('Token client manquant');
        }

        $stmt = $this->db->prepare("
            SELECT c.* 
            FROM clients_sessions cs
            JOIN clients c ON c.id = cs.client_id
            WHERE cs.token = ? AND cs.expire_le > NOW() AND c.actif = 1
        ");
        $stmt->execute([$token]);
        $client = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$client) {
            throw new Exception('Session invalide');
        }

        return $client;
    }

    private function verifierAdmin()
    {
        $headers = $this->recupererHeaders();
        $authHeader = $headers['authorization'] ?? $headers['Authorization'] ?? '';

        $token = '';
        if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
            $token = trim($matches[1]);
        }

        if (empty($token)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Token manquant']);
            exit;
        }

        $stmt = $this->db->prepare("
            SELECT a.id, a.nom, a.email, a.role
            FROM sessions_admin s
            JOIN admins a ON a.id = s.admin_id
            WHERE s.token = ? AND s.expire_le > NOW()
        ");
        $stmt->execute([$token]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$admin) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Token invalide']);
            exit;
        }

        return $admin;
    }

    private function recupererHeaders()
    {
        if (function_exists('getallheaders')) {
            return getallheaders();
        }
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) === 'HTTP_') {
                $headerName = str_replace(' ', '-', ucwords(
                    strtolower(str_replace('_', ' ', substr($name, 5)))
                ));
                $headers[$headerName] = $value;
            }
        }
        return $headers;
    }
}