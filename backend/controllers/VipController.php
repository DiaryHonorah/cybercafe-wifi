<?php
/**
 * Contrôleur Vip
 */

require_once __DIR__ . '/../models/Vip.php';

class VipController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Vip($this->db);
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
     * GET /api/client/vip/mon-abonnement
     */
    public function monAbonnement()
    {
        try {
            $client = $this->verifierClient();

            $abonnement = $this->model->getAbonnementActif($client['id']);
            $historique = $this->model->monHistorique($client['id']);
            $config = $this->model->getConfig();

            echo json_encode([
                'success' => true,
                'abonnement' => $abonnement,
                'historique' => $historique,
                'config' => $config,
                'solde_bonus' => floatval($client['solde_bonus'] ?? 0),
            ]);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/client/vip/souscrire
     */
    public function souscrire()
    {
        try {
            $client = $this->verifierClient();
            $data = json_decode(file_get_contents('php://input'), true);
            $autoRenouvellement = !empty($data['auto_renouvellement']);

            $abonnement = $this->model->souscrire($client['id'], $autoRenouvellement);

            echo json_encode([
                'success' => true,
                'message' => 'Félicitations ! Vous êtes maintenant VIP 💎',
                'abonnement' => $abonnement,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/client/vip/renouveler
     */
    public function renouveler()
    {
        try {
            $client = $this->verifierClient();
            $abonnement = $this->model->renouveler($client['id']);

            echo json_encode([
                'success' => true,
                'message' => 'Abonnement VIP renouvelé',
                'abonnement' => $abonnement,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // ADMIN
    // =====================================================

    /**
     * GET /api/vip/admin/liste
     */
    public function listeAdmin()
    {
        try {
            $this->verifierAdmin();

            $filtres = [
                'statut' => $_GET['statut'] ?? null,
                'recherche' => $_GET['recherche'] ?? null,
            ];

            $abonnements = $this->model->liste($filtres);
            $stats = $this->model->stats();
            $config = $this->model->getConfig();

            echo json_encode([
                'success' => true,
                'abonnements' => $abonnements,
                'stats' => $stats,
                'config' => $config,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/vip/admin/annuler
     */
    public function annuler()
    {
        try {
            $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);
            $id = intval($data['id'] ?? 0);

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $this->model->annuler($id);

            echo json_encode(['success' => true, 'message' => 'Abonnement annulé']);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/vip/admin/activer
     * Active manuellement un VIP pour un client (admin)
     */
    public function activerManuellement()
    {
        try {
            $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);
            $clientId = intval($data['client_id'] ?? 0);

            if ($clientId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Client ID requis']);
                return;
            }

            $dateDebut = date('Y-m-d');
            $dateFin = date('Y-m-d', strtotime('+30 days'));
            $config = $this->model->getConfig();

            $stmt = $this->db->prepare("
                INSERT INTO vip_abonnements 
                (client_id, date_debut, date_fin, montant_paye, impressions_limite) 
                VALUES (?, ?, ?, 0, ?)
            ");
            $stmt->execute([$clientId, $dateDebut, $dateFin, $config['impressions_limite']]);

            // Notification
            $stmt = $this->db->prepare("
                INSERT INTO clients_notifications (client_id, titre, message, type) 
                VALUES (?, ?, ?, 'success')
            ");
            $stmt->execute([
                $clientId,
                "💎 Cadeau VIP !",
                "L'administrateur vous a offert un abonnement VIP gratuit pendant 30 jours !",
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Abonnement VIP activé manuellement',
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