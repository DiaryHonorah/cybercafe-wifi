<?php
/**
 * Modèle Chat
 * Gère les conversations et les messages du chat en direct
 * + Système de bot automatique
 */

require_once __DIR__ . '/../services/ChatBot.php';

class Chat
{
    private $db;

    public function __construct($db = null)
    {
        if ($db instanceof PDO) {
            $this->db = $db;
        } else {
            $this->db = $this->connecter();
        }

        if (!$this->db) {
            throw new Exception("Impossible de se connecter à la base de données");
        }
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
    // CONVERSATIONS
    // =====================================================

    public function getOuCreerConversation($clientToken, $nom = null, $email = null)
    {
        $stmt = $this->db->prepare("
            SELECT * FROM chat_conversations 
            WHERE client_token = :token
        ");
        $stmt->execute([':token' => $clientToken]);
        $conv = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($conv) {
            $this->db->prepare("
                UPDATE chat_conversations 
                SET derniere_activite = NOW()
                WHERE id = :id
            ")->execute([':id' => $conv['id']]);

            return $conv;
        }

        $stmt = $this->db->prepare("
            INSERT INTO chat_conversations 
            (client_token, client_nom, client_email, client_ip) 
            VALUES (:token, :nom, :email, :ip)
        ");
        $stmt->execute([
            ':token' => $clientToken,
            ':nom'   => $nom ?: 'Visiteur',
            ':email' => $email,
            ':ip'    => $_SERVER['REMOTE_ADDR'] ?? null,
        ]);

        $id = $this->db->lastInsertId();
        return $this->trouverConversation($id);
    }

    public function trouverConversation($id)
    {
        $stmt = $this->db->prepare("
            SELECT c.*, 
                   (SELECT COUNT(*) FROM chat_messages 
                    WHERE conversation_id = c.id AND expediteur = 'client' AND lu = 0) as messages_non_lus_admin,
                   (SELECT contenu FROM chat_messages 
                    WHERE conversation_id = c.id 
                    ORDER BY created_at DESC LIMIT 1) as dernier_message,
                   (SELECT created_at FROM chat_messages 
                    WHERE conversation_id = c.id 
                    ORDER BY created_at DESC LIMIT 1) as dernier_message_date,
                   (SELECT COUNT(*) FROM chat_messages 
                    WHERE conversation_id = c.id) as total_messages
            FROM chat_conversations c
            WHERE c.id = :id
        ");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function trouverParToken($token)
    {
        $stmt = $this->db->prepare("
            SELECT * FROM chat_conversations 
            WHERE client_token = :token
        ");
        $stmt->execute([':token' => $token]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function listeConversations($filtres = [])
    {
        $sql = "SELECT c.*, 
                       (SELECT COUNT(*) FROM chat_messages 
                        WHERE conversation_id = c.id AND expediteur = 'client' AND lu = 0) as messages_non_lus_admin,
                       (SELECT contenu FROM chat_messages 
                        WHERE conversation_id = c.id 
                        ORDER BY created_at DESC LIMIT 1) as dernier_message,
                       (SELECT created_at FROM chat_messages 
                        WHERE conversation_id = c.id 
                        ORDER BY created_at DESC LIMIT 1) as dernier_message_date,
                       (SELECT COUNT(*) FROM chat_messages 
                        WHERE conversation_id = c.id) as total_messages
                FROM chat_conversations c
                WHERE 1=1";
        $params = [];

        if (!empty($filtres['statut'])) {
            $sql .= " AND c.statut = :statut";
            $params[':statut'] = $filtres['statut'];
        }

        if (!empty($filtres['recherche'])) {
            $sql .= " AND (c.client_nom LIKE :recherche OR c.client_email LIKE :recherche)";
            $params[':recherche'] = '%' . $filtres['recherche'] . '%';
        }

        $sql .= " ORDER BY 
                    messages_non_lus_admin DESC,
                    c.derniere_activite DESC";

        if (!empty($filtres['limit'])) {
            $sql .= " LIMIT " . intval($filtres['limit']);
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function fermerConversation($id)
    {
        $stmt = $this->db->prepare("
            UPDATE chat_conversations 
            SET statut = 'fermee' 
            WHERE id = :id
        ");
        return $stmt->execute([':id' => $id]);
    }

    public function rouvrirConversation($id)
    {
        $stmt = $this->db->prepare("
            UPDATE chat_conversations 
            SET statut = 'ouverte', derniere_activite = NOW()
            WHERE id = :id
        ");
        return $stmt->execute([':id' => $id]);
    }

    public function supprimerConversation($id)
    {
        $stmt = $this->db->prepare("DELETE FROM chat_conversations WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    // =====================================================
    // MESSAGES
    // =====================================================

    /**
     * Envoie un message
     * 
     * @param string $expediteur : 'client' | 'admin' | 'bot'
     */
    public function envoyerMessage($conversationId, $expediteur, $contenu)
    {
        $contenu = trim($contenu);
        if (empty($contenu)) {
            throw new Exception("Le message ne peut pas être vide");
        }

        if (!in_array($expediteur, ['client', 'admin', 'bot'])) {
            throw new Exception("Expéditeur invalide");
        }

        $conv = $this->trouverConversation($conversationId);
        if (!$conv) {
            throw new Exception("Conversation introuvable");
        }

        if ($conv['statut'] === 'fermee') {
            $this->rouvrirConversation($conversationId);
        }

        $stmt = $this->db->prepare("
            INSERT INTO chat_messages 
            (conversation_id, expediteur, contenu) 
            VALUES (:conv, :exp, :contenu)
        ");
        $stmt->execute([
            ':conv'    => $conversationId,
            ':exp'     => $expediteur,
            ':contenu' => $contenu,
        ]);

        $this->db->prepare("
            UPDATE chat_conversations 
            SET derniere_activite = NOW()
            WHERE id = :id
        ")->execute([':id' => $conversationId]);

        // Si c'est un admin qui répond, désactiver le bot
        if ($expediteur === 'admin') {
            $this->desactiverBot($conversationId);
        }

        // Si c'est le bot qui répond, mettre à jour derniere_reponse_bot
        if ($expediteur === 'bot') {
            $this->db->prepare("
                UPDATE chat_conversations 
                SET derniere_reponse_bot = NOW()
                WHERE id = :id
            ")->execute([':id' => $conversationId]);
        }

        $messageId = $this->db->lastInsertId();
        return $this->trouverMessage($messageId);
    }

    /**
     * Envoie un message client + déclenche réponse automatique du bot si actif
     */
    public function envoyerMessageClient($conversationId, $contenu)
    {
        // Envoyer le message du client
        $message = $this->envoyerMessage($conversationId, 'client', $contenu);

        // Vérifier si le bot doit répondre
        $conv = $this->trouverConversation($conversationId);
        
        if ($conv && intval($conv['bot_actif']) === 1) {
            // Générer la réponse du bot
            $reponseBot = ChatBot::genererReponse($contenu);

            // Attendre 1 seconde pour faire plus naturel (optionnel, mais mieux pour l'UX)
            // On insère directement, la latence viendra du polling 3s côté client

            // Envoyer la réponse du bot
            $this->envoyerMessage($conversationId, 'bot', $reponseBot);
        }

        return $message;
    }

    public function trouverMessage($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM chat_messages WHERE id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getMessages($conversationId, $apresId = 0)
    {
        $sql = "SELECT * FROM chat_messages 
                WHERE conversation_id = :conv";
        $params = [':conv' => $conversationId];

        if ($apresId > 0) {
            $sql .= " AND id > :apres";
            $params[':apres'] = $apresId;
        }

        $sql .= " ORDER BY created_at ASC LIMIT 200";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function marquerLus($conversationId, $expediteur)
    {
        // Admin lit → messages client ET bot marqués lus
        // Client lit → messages admin ET bot marqués lus
        $stmt = $this->db->prepare("
            UPDATE chat_messages 
            SET lu = 1 
            WHERE conversation_id = :conv 
              AND expediteur != :exp 
              AND lu = 0
        ");
        return $stmt->execute([
            ':conv' => $conversationId,
            ':exp'  => $expediteur,
        ]);
    }

    public function compterMessagesNonLus()
    {
        $stmt = $this->db->query("
            SELECT COUNT(*) FROM chat_messages 
            WHERE expediteur = 'client' AND lu = 0
        ");
        return intval($stmt->fetchColumn());
    }

    public function compterConversationsNonLues()
    {
        $stmt = $this->db->query("
            SELECT COUNT(DISTINCT conversation_id) FROM chat_messages 
            WHERE expediteur = 'client' AND lu = 0
        ");
        return intval($stmt->fetchColumn());
    }

    // =====================================================
    // BOT
    // =====================================================

    /**
     * Désactive le bot (quand l'admin prend le relais)
     */
    public function desactiverBot($conversationId)
    {
        $stmt = $this->db->prepare("
            UPDATE chat_conversations 
            SET bot_actif = 0
            WHERE id = :id
        ");
        return $stmt->execute([':id' => $conversationId]);
    }

    /**
     * Réactive le bot (si l'admin le souhaite)
     */
    public function reactiverBot($conversationId)
    {
        $stmt = $this->db->prepare("
            UPDATE chat_conversations 
            SET bot_actif = 1
            WHERE id = :id
        ");
        return $stmt->execute([':id' => $conversationId]);
    }

    // =====================================================
    // STATISTIQUES
    // =====================================================

    public function stats()
    {
        $stats = [];

        $stmt = $this->db->query("SELECT COUNT(*) FROM chat_conversations");
        $stats['total_conversations'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM chat_conversations WHERE statut = 'ouverte'");
        $stats['ouvertes'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM chat_conversations WHERE statut = 'fermee'");
        $stats['fermees'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM chat_messages");
        $stats['total_messages'] = intval($stmt->fetchColumn());

        $stats['non_lus'] = $this->compterMessagesNonLus();

        $stmt = $this->db->query("
            SELECT COUNT(*) FROM chat_conversations 
            WHERE DATE(created_at) = CURDATE()
        ");
        $stats['aujourd_hui'] = intval($stmt->fetchColumn());

        // Stats bot
        $stmt = $this->db->query("
            SELECT COUNT(*) FROM chat_messages WHERE expediteur = 'bot'
        ");
        $stats['messages_bot'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COUNT(*) FROM chat_conversations WHERE bot_actif = 0
        ");
        $stats['conversations_avec_admin'] = intval($stmt->fetchColumn());

        return $stats;
    }
}