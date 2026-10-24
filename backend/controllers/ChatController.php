<?php
/**
 * Contrôleur Chat
 * Gère le chat en direct entre clients et admin
 * + Système de bot automatique
 */

require_once __DIR__ . '/../models/Chat.php';

class ChatController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Chat($this->db);
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
    // PUBLIC — CLIENT
    // =====================================================

    /**
     * POST /api/chat/init
     * Initialise ou récupère la conversation du client (PUBLIC)
     */
    public function init()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || empty($data['client_token'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Token client requis']);
                return;
            }

            $conv = $this->model->getOuCreerConversation(
                $data['client_token'],
                $data['client_nom'] ?? null,
                $data['client_email'] ?? null
            );

            $messages = $this->model->getMessages($conv['id']);

            echo json_encode([
                'success'      => true,
                'conversation' => $conv,
                'messages'     => $messages,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/chat/envoyer
     * Envoyer un message depuis le client (PUBLIC)
     * + Déclenche automatiquement la réponse du bot si actif
     */
    public function envoyerClient()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || empty($data['client_token']) || empty($data['contenu'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Token et contenu requis']);
                return;
            }

            $conv = $this->model->trouverParToken($data['client_token']);
            if (!$conv) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Conversation introuvable']);
                return;
            }

            // Utilise la méthode qui déclenche le bot
            $message = $this->model->envoyerMessageClient(
                $conv['id'],
                $data['contenu']
            );

            // Récupérer les nouveaux messages (le message client + la réponse bot)
            $nouveauxMessages = $this->model->getMessages($conv['id'], $message['id'] - 1);

            echo json_encode([
                'success'  => true,
                'message'  => $message,
                'messages' => $nouveauxMessages, // inclut la réponse du bot si générée
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/chat/messages?token=XXX&apres=ID
     * Récupère les nouveaux messages (PUBLIC)
     */
    public function messagesClient()
    {
        try {
            $token = $_GET['token'] ?? null;
            $apres = intval($_GET['apres'] ?? 0);

            if (!$token) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Token requis']);
                return;
            }

            $conv = $this->model->trouverParToken($token);
            if (!$conv) {
                echo json_encode([
                    'success' => true,
                    'messages' => [],
                    'conversation' => null,
                ]);
                return;
            }

            $messages = $this->model->getMessages($conv['id'], $apres);

            if (!empty($messages)) {
                $this->model->marquerLus($conv['id'], 'client');
            }

            echo json_encode([
                'success'      => true,
                'messages'     => $messages,
                'conversation' => $conv,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // ADMIN
    // =====================================================

    /**
     * GET /api/chat/admin/conversations
     */
    public function listeAdmin()
    {
        try {
            $this->verifierAdmin();

            $filtres = [
                'statut'    => $_GET['statut'] ?? null,
                'recherche' => $_GET['recherche'] ?? null,
            ];

            $conversations = $this->model->listeConversations($filtres);

            echo json_encode([
                'success'       => true,
                'conversations' => $conversations,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/chat/admin/conversation?id=X
     */
    public function detailAdmin()
    {
        try {
            $this->verifierAdmin();

            $id = intval($_GET['id'] ?? 0);
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $conv = $this->model->trouverConversation($id);
            if (!$conv) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Conversation introuvable']);
                return;
            }

            $messages = $this->model->getMessages($id);

            $this->model->marquerLus($id, 'admin');

            echo json_encode([
                'success'      => true,
                'conversation' => $conv,
                'messages'     => $messages,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/chat/admin/repondre
     * Répondre en tant qu'admin → désactive automatiquement le bot
     */
    public function repondre()
    {
        try {
            $this->verifierAdmin();

            $data = json_decode(file_get_contents('php://input'), true);
            $convId = intval($data['conversation_id'] ?? 0);
            $contenu = trim($data['contenu'] ?? '');

            if ($convId <= 0 || empty($contenu)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Conversation et contenu requis']);
                return;
            }

            // Le bot est automatiquement désactivé dans envoyerMessage()
            $message = $this->model->envoyerMessage($convId, 'admin', $contenu);

            echo json_encode([
                'success' => true,
                'message' => $message,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/chat/admin/messages?id=X&apres=Y
     */
    public function messagesAdmin()
    {
        try {
            $this->verifierAdmin();

            $id = intval($_GET['id'] ?? 0);
            $apres = intval($_GET['apres'] ?? 0);

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $messages = $this->model->getMessages($id, $apres);

            if (!empty($messages)) {
                $this->model->marquerLus($id, 'admin');
            }

            echo json_encode([
                'success'  => true,
                'messages' => $messages,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/chat/admin/fermer
     */
    public function fermer()
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

            $this->model->fermerConversation($id);

            echo json_encode(['success' => true, 'message' => 'Conversation fermée']);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/chat/admin/rouvrir
     */
    public function rouvrir()
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

            $this->model->rouvrirConversation($id);

            echo json_encode(['success' => true, 'message' => 'Conversation rouverte']);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/chat/admin/supprimer
     */
    public function supprimer()
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

            $this->model->supprimerConversation($id);

            echo json_encode(['success' => true, 'message' => 'Conversation supprimée']);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/chat/admin/non-lus
     */
    public function nonLus()
    {
        try {
            $this->verifierAdmin();

            $nbMessages = $this->model->compterMessagesNonLus();
            $nbConversations = $this->model->compterConversationsNonLues();

            echo json_encode([
                'success'       => true,
                'messages'      => $nbMessages,
                'conversations' => $nbConversations,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/chat/admin/stats
     */
    public function stats()
    {
        try {
            $this->verifierAdmin();

            $stats = $this->model->stats();
            echo json_encode(['success' => true, 'stats' => $stats]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/chat/admin/toggle-bot
     * Active ou désactive le bot pour une conversation
     */
    public function toggleBot()
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

            $conv = $this->model->trouverConversation($id);
            if (!$conv) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Conversation introuvable']);
                return;
            }

            if (intval($conv['bot_actif']) === 1) {
                $this->model->desactiverBot($id);
                $message = 'Bot désactivé';
                $nouveauStatut = 0;
            } else {
                $this->model->reactiverBot($id);
                $message = 'Bot réactivé';
                $nouveauStatut = 1;
            }

            echo json_encode([
                'success' => true,
                'message' => $message,
                'bot_actif' => $nouveauStatut,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // AUTHENTIFICATION
    // =====================================================

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
            echo json_encode(['success' => false, 'message' => 'Token invalide ou expiré']);
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