<?php
/**
 * Contrôleur TicketSupport
 * Endpoints pour les tickets de support (SOS)
 */

require_once __DIR__ . '/../models/Ticket.php';

class TicketSupportController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Ticket($this->db);
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
     * GET /api/client/support/tickets
     */
    public function mesTickets()
    {
        try {
            $client = $this->verifierClient();
            $tickets = $this->model->mesTickets($client['id']);
            $nonLus = $this->model->compterNonLus($client['id']);
            $config = $this->model->getConfig();

            echo json_encode([
                'success' => true,
                'tickets' => $tickets,
                'non_lus' => $nonLus,
                'config' => $config,
            ]);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/client/support/tickets
     */
    public function creer()
    {
        try {
            $client = $this->verifierClient();
            $data = json_decode(file_get_contents('php://input'), true);

            $ticket = $this->model->creer($client['id'], $data);

            echo json_encode([
                'success' => true,
                'message' => 'Ticket créé avec succès',
                'ticket' => $ticket,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/client/support/tickets/{id}
     */
    public function detailClient($ticketId)
    {
        try {
            $client = $this->verifierClient();
            $ticket = $this->model->detail($ticketId, $client['id'], false);

            echo json_encode([
                'success' => true,
                'ticket' => $ticket,
            ]);

        } catch (Exception $e) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/client/support/tickets/{id}/messages
     */
    public function ajouterMessageClient($ticketId)
    {
        try {
            $client = $this->verifierClient();
            $data = json_decode(file_get_contents('php://input'), true);

            $messageId = $this->model->ajouterMessage(
                $ticketId,
                'client',
                $client['id'],
                $data['message'] ?? ''
            );

            echo json_encode([
                'success' => true,
                'message_id' => $messageId,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/client/support/tickets/{id}/noter
     */
    public function noter($ticketId)
    {
        try {
            $client = $this->verifierClient();
            $data = json_decode(file_get_contents('php://input'), true);

            $this->model->noterSatisfaction($ticketId, $client['id'], $data['note'] ?? 0);

            echo json_encode([
                'success' => true,
                'message' => 'Merci pour votre retour !',
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/client/support/non-lus
     */
    public function nonLusClient()
    {
        try {
            $client = $this->verifierClient();
            $nonLus = $this->model->compterNonLus($client['id']);

            echo json_encode(['success' => true, 'non_lus' => $nonLus]);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // ADMIN
    // =====================================================

    /**
     * GET /api/support/admin/tickets
     */
    public function listeAdmin()
    {
        try {
            $this->verifierAdmin();

            $filtres = [
                'statut' => $_GET['statut'] ?? 'tous',
                'priorite' => $_GET['priorite'] ?? 'toutes',
                'recherche' => $_GET['recherche'] ?? null,
                'limite' => isset($_GET['limite']) ? intval($_GET['limite']) : 100,
            ];

            $tickets = $this->model->listeAdmin($filtres);
            $stats = $this->model->statsAdmin();

            echo json_encode([
                'success' => true,
                'tickets' => $tickets,
                'stats' => $stats,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/support/admin/tickets/{id}
     */
    public function detailAdmin($ticketId)
    {
        try {
            $this->verifierAdmin();
            $ticket = $this->model->detail($ticketId, null, true);

            echo json_encode([
                'success' => true,
                'ticket' => $ticket,
            ]);

        } catch (Exception $e) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/support/admin/tickets/{id}/messages
     */
    public function ajouterMessageAdmin($ticketId)
    {
        try {
            $admin = $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            $messageId = $this->model->ajouterMessage(
                $ticketId,
                'admin',
                $admin['id'],
                $data['message'] ?? ''
            );

            echo json_encode([
                'success' => true,
                'message_id' => $messageId,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/support/admin/tickets/{id}/statut
     */
    public function changerStatut($ticketId)
    {
        try {
            $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            $this->model->changerStatut($ticketId, $data['statut'] ?? '');

            echo json_encode([
                'success' => true,
                'message' => 'Statut mis à jour',
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/support/admin/tickets/{id}/priorite
     */
    public function changerPriorite($ticketId)
    {
        try {
            $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            $this->model->changerPriorite($ticketId, $data['priorite'] ?? '');

            echo json_encode([
                'success' => true,
                'message' => 'Priorité mise à jour',
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/support/admin/tickets/{id}/supprimer
     */
    public function supprimer($ticketId)
    {
        try {
            $this->verifierAdmin();
            $this->model->supprimer($ticketId);

            echo json_encode([
                'success' => true,
                'message' => 'Ticket supprimé',
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/support/admin/non-lus
     */
    public function nonLusAdmin()
    {
        try {
            $this->verifierAdmin();
            $nonLus = $this->model->compterNonLus(null);

            echo json_encode(['success' => true, 'non_lus' => $nonLus]);

        } catch (Exception $e) {
            http_response_code(401);
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