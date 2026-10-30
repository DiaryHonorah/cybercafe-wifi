<?php
/**
 * Modèle Ticket
 * Gestion des tickets de support
 */

class Ticket
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

    public function getConfig()
    {
        $stmt = $this->db->query("SELECT * FROM support_config LIMIT 1");
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Génère une référence unique de ticket
     */
    private function genererReference()
    {
        $annee = date('Y');
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM support_tickets 
            WHERE YEAR(created_at) = ?
        ");
        $stmt->execute([$annee]);
        $count = intval($stmt->fetchColumn()) + 1;
        return "TKT-{$annee}-" . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    // =====================================================
    // CLIENT
    // =====================================================

    /**
     * Créer un ticket
     */
    public function creer($clientId, $data)
    {
        $sujet = trim($data['sujet'] ?? '');
        $message = trim($data['message'] ?? '');

        if (empty($sujet) || mb_strlen($sujet) < 5) {
            throw new Exception("Sujet requis (5 caractères min)");
        }
        if (empty($message) || mb_strlen($message) < 10) {
            throw new Exception("Message requis (10 caractères min)");
        }

        $categoriesValides = ['wifi', 'impression', 'reservation', 'facturation', 'vip', 'autre'];
        $categorie = $data['categorie'] ?? 'autre';
        if (!in_array($categorie, $categoriesValides)) {
            $categorie = 'autre';
        }

        $prioritesValides = ['basse', 'normale', 'haute', 'urgente'];
        $priorite = $data['priorite'] ?? 'normale';
        if (!in_array($priorite, $prioritesValides)) {
            $priorite = 'normale';
        }

        try {
            $this->db->beginTransaction();

            $reference = $this->genererReference();

            // Créer le ticket
            $stmt = $this->db->prepare("
                INSERT INTO support_tickets 
                (client_id, reference, sujet, categorie, priorite, statut, dernier_message_le) 
                VALUES (?, ?, ?, ?, ?, 'ouvert', NOW())
            ");
            $stmt->execute([$clientId, $reference, $sujet, $categorie, $priorite]);
            $ticketId = $this->db->lastInsertId();

            // Ajouter le premier message
            $stmt = $this->db->prepare("
                INSERT INTO support_messages 
                (ticket_id, auteur_type, auteur_id, message) 
                VALUES (?, 'client', ?, ?)
            ");
            $stmt->execute([$ticketId, $clientId, $message]);

            // Notification
            $stmt = $this->db->prepare("
                INSERT INTO clients_notifications (client_id, titre, message, type) 
                VALUES (?, ?, ?, 'info')
            ");
            $stmt->execute([
                $clientId,
                "🎫 Ticket créé",
                "Votre ticket $reference a été créé. Notre équipe vous répondra au plus vite.",
            ]);

            $this->db->commit();

            return $this->trouverParId($ticketId);

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Liste des tickets d'un client
     */
    public function mesTickets($clientId)
    {
        $stmt = $this->db->prepare("
            SELECT t.*, 
                (SELECT COUNT(*) FROM support_messages WHERE ticket_id = t.id) AS nb_messages,
                (SELECT COUNT(*) FROM support_messages 
                 WHERE ticket_id = t.id AND auteur_type = 'admin' AND lu_par_client = 0) AS non_lus
            FROM support_tickets t
            WHERE t.client_id = ?
            ORDER BY 
                CASE t.statut 
                    WHEN 'ouvert' THEN 1 
                    WHEN 'en_cours' THEN 2 
                    WHEN 'resolu' THEN 3 
                    ELSE 4 
                END,
                t.dernier_message_le DESC
        ");
        $stmt->execute([$clientId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Détail d'un ticket avec ses messages
     */
    public function detail($ticketId, $clientId = null, $isAdmin = false)
    {
        $sql = "SELECT t.*, c.nom AS client_nom, c.email AS client_email, c.telephone AS client_telephone
                FROM support_tickets t
                JOIN clients c ON c.id = t.client_id
                WHERE t.id = ?";
        $params = [$ticketId];

        if (!$isAdmin && $clientId !== null) {
            $sql .= " AND t.client_id = ?";
            $params[] = $clientId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $ticket = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$ticket) {
            throw new Exception("Ticket introuvable");
        }

        // Récupérer les messages
        $stmt = $this->db->prepare("
            SELECT m.*, 
                CASE 
                    WHEN m.auteur_type = 'client' THEN c.nom
                    WHEN m.auteur_type = 'admin' THEN a.nom
                    ELSE 'Système'
                END AS auteur_nom
            FROM support_messages m
            LEFT JOIN clients c ON c.id = m.auteur_id AND m.auteur_type = 'client'
            LEFT JOIN admins a ON a.id = m.auteur_id AND m.auteur_type = 'admin'
            WHERE m.ticket_id = ?
            ORDER BY m.created_at ASC
        ");
        $stmt->execute([$ticketId]);
        $ticket['messages'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Marquer comme lus
        if ($isAdmin) {
            $this->db->prepare("
                UPDATE support_messages 
                SET lu_par_admin = 1 
                WHERE ticket_id = ? AND auteur_type = 'client'
            ")->execute([$ticketId]);
        } else {
            $this->db->prepare("
                UPDATE support_messages 
                SET lu_par_client = 1 
                WHERE ticket_id = ? AND auteur_type = 'admin'
            ")->execute([$ticketId]);
        }

        return $ticket;
    }

    /**
     * Ajouter un message à un ticket
     */
    public function ajouterMessage($ticketId, $auteurType, $auteurId, $message)
    {
        $message = trim($message);
        if (empty($message) || mb_strlen($message) < 2) {
            throw new Exception("Message trop court");
        }

        $ticket = $this->trouverParId($ticketId);
        if (!$ticket) {
            throw new Exception("Ticket introuvable");
        }

        if (in_array($ticket['statut'], ['ferme'])) {
            throw new Exception("Ce ticket est fermé. Impossible d'ajouter un message.");
        }

        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                INSERT INTO support_messages 
                (ticket_id, auteur_type, auteur_id, message, lu_par_client, lu_par_admin) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $ticketId,
                $auteurType,
                $auteurId,
                $message,
                $auteurType === 'admin' ? 0 : 1,
                $auteurType === 'client' ? 0 : 1,
            ]);

            // Mettre à jour la date du dernier message + statut
            $nouveauStatut = $ticket['statut'];
            if ($ticket['statut'] === 'resolu' && $auteurType === 'client') {
                $nouveauStatut = 'en_cours'; // Réouvert
            } elseif ($ticket['statut'] === 'ouvert' && $auteurType === 'admin') {
                $nouveauStatut = 'en_cours';
            }

            $stmt = $this->db->prepare("
                UPDATE support_tickets 
                SET dernier_message_le = NOW(), statut = ?
                WHERE id = ?
            ");
            $stmt->execute([$nouveauStatut, $ticketId]);

            // Notification si admin répond au client
            if ($auteurType === 'admin') {
                $stmt = $this->db->prepare("
                    INSERT INTO clients_notifications (client_id, titre, message, type) 
                    VALUES (?, ?, ?, 'info')
                ");
                $stmt->execute([
                    $ticket['client_id'],
                    "🎫 Nouvelle réponse",
                    "Notre équipe a répondu à votre ticket {$ticket['reference']}.",
                ]);
            }

            $this->db->commit();
            return $this->db->lastInsertId();

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Note de satisfaction
     */
    public function noterSatisfaction($ticketId, $clientId, $note)
    {
        $note = intval($note);
        if ($note < 1 || $note > 5) {
            throw new Exception("Note invalide (1-5)");
        }

        $ticket = $this->trouverParId($ticketId);
        if (!$ticket || intval($ticket['client_id']) !== intval($clientId)) {
            throw new Exception("Ticket introuvable");
        }

        $stmt = $this->db->prepare("
            UPDATE support_tickets 
            SET note_satisfaction = ?, statut = 'ferme', ferme_le = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$note, $ticketId]);

        return true;
    }

    // =====================================================
    // ADMIN
    // =====================================================

    /**
     * Liste tous les tickets (admin)
     */
    public function listeAdmin($filtres = [])
    {
        $sql = "SELECT t.*, c.nom AS client_nom, c.email AS client_email,
                    (SELECT COUNT(*) FROM support_messages WHERE ticket_id = t.id) AS nb_messages,
                    (SELECT COUNT(*) FROM support_messages 
                     WHERE ticket_id = t.id AND auteur_type = 'client' AND lu_par_admin = 0) AS non_lus
                FROM support_tickets t
                JOIN clients c ON c.id = t.client_id
                WHERE 1=1";
        $params = [];

        if (!empty($filtres['statut']) && $filtres['statut'] !== 'tous') {
            $sql .= " AND t.statut = ?";
            $params[] = $filtres['statut'];
        }

        if (!empty($filtres['priorite']) && $filtres['priorite'] !== 'toutes') {
            $sql .= " AND t.priorite = ?";
            $params[] = $filtres['priorite'];
        }

        if (!empty($filtres['recherche'])) {
            $sql .= " AND (t.reference LIKE ? OR t.sujet LIKE ? OR c.nom LIKE ? OR c.email LIKE ?)";
            $search = '%' . $filtres['recherche'] . '%';
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
        }

        $sql .= " ORDER BY 
                    CASE t.priorite 
                        WHEN 'urgente' THEN 1 
                        WHEN 'haute' THEN 2 
                        WHEN 'normale' THEN 3 
                        ELSE 4 
                    END,
                    CASE t.statut 
                        WHEN 'ouvert' THEN 1 
                        WHEN 'en_cours' THEN 2 
                        ELSE 3 
                    END,
                    t.dernier_message_le DESC 
                  LIMIT " . intval($filtres['limite'] ?? 100);

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Stats globales (admin)
     */
    public function statsAdmin()
    {
        $stats = [];

        $stmt = $this->db->query("SELECT COUNT(*) FROM support_tickets");
        $stats['total'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM support_tickets WHERE statut = 'ouvert'");
        $stats['ouverts'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM support_tickets WHERE statut = 'en_cours'");
        $stats['en_cours'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM support_tickets WHERE statut = 'resolu'");
        $stats['resolus'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM support_tickets WHERE statut = 'ferme'");
        $stats['fermes'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COUNT(*) FROM support_messages 
            WHERE auteur_type = 'client' AND lu_par_admin = 0
        ");
        $stats['messages_non_lus'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT AVG(note_satisfaction) FROM support_tickets 
            WHERE note_satisfaction IS NOT NULL
        ");
        $stats['note_moyenne'] = round(floatval($stmt->fetchColumn()), 1);

        return $stats;
    }

    /**
     * Changer le statut d'un ticket (admin)
     */
    public function changerStatut($ticketId, $statut)
    {
        $statutsValides = ['ouvert', 'en_cours', 'resolu', 'ferme'];
        if (!in_array($statut, $statutsValides)) {
            throw new Exception("Statut invalide");
        }

        $ticket = $this->trouverParId($ticketId);
        if (!$ticket) {
            throw new Exception("Ticket introuvable");
        }

        try {
            $this->db->beginTransaction();

            $fermeLe = $statut === 'ferme' ? date('Y-m-d H:i:s') : null;
            $stmt = $this->db->prepare("
                UPDATE support_tickets 
                SET statut = ?, ferme_le = ?
                WHERE id = ?
            ");
            $stmt->execute([$statut, $fermeLe, $ticketId]);

            // Message système
            $messages = [
                'en_cours' => 'Votre ticket est en cours de traitement.',
                'resolu' => 'Votre ticket a été marqué comme résolu. N\'hésitez pas à nous faire un retour !',
                'ferme' => 'Votre ticket a été fermé.',
            ];

            if (isset($messages[$statut])) {
                $stmt = $this->db->prepare("
                    INSERT INTO support_messages 
                    (ticket_id, auteur_type, auteur_id, message, lu_par_client, lu_par_admin) 
                    VALUES (?, 'systeme', 0, ?, 0, 1)
                ");
                $stmt->execute([$ticketId, $messages[$statut]]);

                // Notification
                $stmt = $this->db->prepare("
                    INSERT INTO clients_notifications (client_id, titre, message, type) 
                    VALUES (?, ?, ?, 'info')
                ");
                $stmt->execute([
                    $ticket['client_id'],
                    "🎫 Ticket {$ticket['reference']}",
                    $messages[$statut],
                ]);
            }

            $this->db->commit();
            return true;

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Changer la priorité (admin)
     */
    public function changerPriorite($ticketId, $priorite)
    {
        $prioritesValides = ['basse', 'normale', 'haute', 'urgente'];
        if (!in_array($priorite, $prioritesValides)) {
            throw new Exception("Priorité invalide");
        }

        $stmt = $this->db->prepare("
            UPDATE support_tickets SET priorite = ? WHERE id = ?
        ");
        return $stmt->execute([$priorite, $ticketId]);
    }

    /**
     * Supprimer un ticket
     */
    public function supprimer($ticketId)
    {
        $stmt = $this->db->prepare("DELETE FROM support_tickets WHERE id = ?");
        return $stmt->execute([$ticketId]);
    }

    // =====================================================
    // HELPERS
    // =====================================================

    public function trouverParId($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM support_tickets WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Compte les tickets non lus (pour badge)
     */
    public function compterNonLus($clientId = null)
    {
        if ($clientId) {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM support_messages m
                JOIN support_tickets t ON t.id = m.ticket_id
                WHERE t.client_id = ? AND m.auteur_type = 'admin' AND m.lu_par_client = 0
            ");
            $stmt->execute([$clientId]);
        } else {
            $stmt = $this->db->query("
                SELECT COUNT(*) FROM support_messages 
                WHERE auteur_type = 'client' AND lu_par_admin = 0
            ");
        }
        return intval($stmt->fetchColumn());
    }
}