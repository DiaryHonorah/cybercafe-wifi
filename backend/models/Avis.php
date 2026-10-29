<?php
/**
 * Modèle Avis
 * Gestion des avis clients
 */

class Avis
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
        $stmt = $this->db->query("SELECT * FROM avis_config LIMIT 1");
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Créer un avis
     */
    public function creer($data, $client = null)
    {
        $config = $this->getConfig();
        if (!$config || !$config['actif']) {
            throw new Exception("Le système d'avis est désactivé");
        }

        $note = intval($data['note'] ?? 0);
        if ($note < 1 || $note > 5) {
            throw new Exception("Note invalide (1-5)");
        }

        $commentaire = trim($data['commentaire'] ?? '');
        if (mb_strlen($commentaire) < intval($config['min_caracteres'])) {
            throw new Exception("Commentaire trop court (min " . $config['min_caracteres'] . " caractères)");
        }

        $nomAffiche = trim($data['nom_affiche'] ?? '');
        if (empty($nomAffiche)) {
            if ($client) {
                $nomAffiche = $client['nom'];
            } else {
                throw new Exception("Nom requis");
            }
        }

        // Vérifier le lien avec une réservation (avis vérifié)
        $reservationId = !empty($data['reservation_id']) ? intval($data['reservation_id']) : null;
        $verifie = 0;

        if ($reservationId) {
            $stmt = $this->db->prepare("
                SELECT id FROM reservations 
                WHERE id = ? AND statut = 'terminee'
            ");
            $stmt->execute([$reservationId]);
            if ($stmt->fetch()) {
                $verifie = 1;
            }
        }

        // Statut selon modération auto
        $statut = $config['moderation_auto'] ? 'valide' : 'en_attente';
        $dateValidation = $config['moderation_auto'] ? date('Y-m-d H:i:s') : null;

        $stmt = $this->db->prepare("
            INSERT INTO avis 
            (client_id, reservation_id, nom_affiche, email, telephone, note, titre, 
             commentaire, service_note, statut, verifie, date_validation) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $client ? $client['id'] : null,
            $reservationId,
            $nomAffiche,
            $data['email'] ?? ($client['email'] ?? null),
            $data['telephone'] ?? ($client['telephone'] ?? null),
            $note,
            $data['titre'] ?? null,
            $commentaire,
            $data['service_note'] ?? 'reservation',
            $statut,
            $verifie,
            $dateValidation,
        ]);

        $avisId = $this->db->lastInsertId();

        // Notification au client si connecté
        if ($client) {
            $message = $config['moderation_auto'] 
                ? "Votre avis a été publié. Merci !" 
                : "Votre avis a été reçu et sera publié après validation. Merci !";

            $stmt = $this->db->prepare("
                INSERT INTO clients_notifications (client_id, titre, message, type) 
                VALUES (?, ?, ?, 'success')
            ");
            $stmt->execute([
                $client['id'],
                "⭐ Merci pour votre avis !",
                $message,
            ]);
        }

        return $this->trouverParId($avisId);
    }

    /**
     * Liste des avis publics (validés)
     */
    public function listePublique($filtres = [])
    {
        $sql = "SELECT a.*, c.nom AS client_nom 
                FROM avis a
                LEFT JOIN clients c ON c.id = a.client_id
                WHERE a.statut = 'valide'";
        $params = [];

        if (!empty($filtres['note']) && $filtres['note'] !== 'toutes') {
            $sql .= " AND a.note = ?";
            $params[] = intval($filtres['note']);
        }

        if (!empty($filtres['service']) && $filtres['service'] !== 'tous') {
            $sql .= " AND a.service_note = ?";
            $params[] = $filtres['service'];
        }

        if (!empty($filtres['verifie_seulement'])) {
            $sql .= " AND a.verifie = 1";
        }

        $sql .= " ORDER BY a.verifie DESC, a.created_at DESC LIMIT " . intval($filtres['limite'] ?? 50);

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Statistiques publiques
     */
    public function statsPubliques()
    {
        $stats = [];

        // Total et moyenne
        $stmt = $this->db->query("
            SELECT COUNT(*) AS total, AVG(note) AS moyenne
            FROM avis WHERE statut = 'valide'
        ");
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['total'] = intval($row['total']);
        $stats['moyenne'] = round(floatval($row['moyenne']), 1);

        // Répartition par étoiles
        $stats['repartition'] = [];
        for ($i = 5; $i >= 1; $i--) {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM avis 
                WHERE statut = 'valide' AND note = ?
            ");
            $stmt->execute([$i]);
            $count = intval($stmt->fetchColumn());
            $stats['repartition'][$i] = [
                'count' => $count,
                'pourcentage' => $stats['total'] > 0 
                    ? round(($count / $stats['total']) * 100, 1) 
                    : 0,
            ];
        }

        // Avis vérifiés
        $stmt = $this->db->query("
            SELECT COUNT(*) FROM avis WHERE statut = 'valide' AND verifie = 1
        ");
        $stats['verifies'] = intval($stmt->fetchColumn());

        return $stats;
    }

    /**
     * Mes avis (client)
     */
    public function mesAvis($clientId)
    {
        $stmt = $this->db->prepare("
            SELECT * FROM avis 
            WHERE client_id = ? 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$clientId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Trouver un avis par ID
     */
    public function trouverParId($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM avis WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Marquer comme utile (1 fois par IP)
     */
    public function marquerUtile($avisId, $ip)
    {
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                INSERT INTO avis_utiles (avis_id, ip) VALUES (?, ?)
            ");
            $stmt->execute([$avisId, $ip]);

            $stmt = $this->db->prepare("
                UPDATE avis SET utile = utile + 1 WHERE id = ?
            ");
            $stmt->execute([$avisId]);

            $stmt = $this->db->prepare("SELECT utile FROM avis WHERE id = ?");
            $stmt->execute([$avisId]);
            $utile = intval($stmt->fetchColumn());

            $this->db->commit();
            return $utilite;

        } catch (PDOException $e) {
            $this->db->rollBack();
            if ($e->getCode() === '23000') {
                throw new Exception("Vous avez déjà marqué cet avis comme utile");
            }
            throw $e;
        }
    }

    // =====================================================
    // ADMIN
    // =====================================================

    /**
     * Liste tous les avis (admin)
     */
    public function listeAdmin($filtres = [])
    {
        $sql = "SELECT a.*, c.nom AS client_nom, c.email AS client_email
                FROM avis a
                LEFT JOIN clients c ON c.id = a.client_id
                WHERE 1=1";
        $params = [];

        if (!empty($filtres['statut']) && $filtres['statut'] !== 'tous') {
            $sql .= " AND a.statut = ?";
            $params[] = $filtres['statut'];
        }

        if (!empty($filtres['note']) && $filtres['note'] !== 'toutes') {
            $sql .= " AND a.note = ?";
            $params[] = intval($filtres['note']);
        }

        if (!empty($filtres['recherche'])) {
            $sql .= " AND (a.nom_affiche LIKE ? OR a.commentaire LIKE ? OR a.titre LIKE ?)";
            $search = '%' . $filtres['recherche'] . '%';
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
        }

        $sql .= " ORDER BY 
                    CASE a.statut 
                        WHEN 'en_attente' THEN 1 
                        WHEN 'valide' THEN 2 
                        ELSE 3 
                    END,
                    a.created_at DESC 
                  LIMIT " . intval($filtres['limite'] ?? 100);

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Statistiques admin
     */
    public function statsAdmin()
    {
        $stats = [];

        $stmt = $this->db->query("SELECT COUNT(*) FROM avis");
        $stats['total'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM avis WHERE statut = 'en_attente'");
        $stats['en_attente'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM avis WHERE statut = 'valide'");
        $stats['valides'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM avis WHERE statut = 'rejete'");
        $stats['rejetes'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT AVG(note) FROM avis WHERE statut = 'valide'");
        $stats['moyenne'] = round(floatval($stmt->fetchColumn()), 1);

        return $stats;
    }

    /**
     * Valider un avis
     */
    public function valider($id, $adminId, $reponse = null)
    {
        $stmt = $this->db->prepare("
            UPDATE avis 
            SET statut = 'valide', admin_id = ?, date_validation = NOW(),
                reponse_admin = COALESCE(?, reponse_admin)
            WHERE id = ?
        ");
        $stmt->execute([$adminId, $reponse, $id]);

        // Notifier le client
        $avis = $this->trouverParId($id);
        if ($avis && $avis['client_id']) {
            $stmt = $this->db->prepare("
                INSERT INTO clients_notifications (client_id, titre, message, type) 
                VALUES (?, ?, ?, 'success')
            ");
            $stmt->execute([
                $avis['client_id'],
                "⭐ Votre avis est publié !",
                "Merci pour votre contribution. Votre avis est maintenant visible sur notre site.",
            ]);
        }

        return true;
    }

    /**
     * Rejeter un avis
     */
    public function rejeter($id, $adminId, $raison = null)
    {
        $stmt = $this->db->prepare("
            UPDATE avis 
            SET statut = 'rejete', admin_id = ?, reponse_admin = ?
            WHERE id = ?
        ");
        $stmt->execute([$adminId, $raison, $id]);

        // Notifier le client
        $avis = $this->trouverParId($id);
        if ($avis && $avis['client_id']) {
            $stmt = $this->db->prepare("
                INSERT INTO clients_notifications (client_id, titre, message, type) 
                VALUES (?, ?, ?, 'warning')
            ");
            $stmt->execute([
                $avis['client_id'],
                "⚠️ Avis non publié",
                "Votre avis n'a pas été publié." . ($raison ? " Raison : $raison" : ""),
            ]);
        }

        return true;
    }

    /**
     * Supprimer un avis
     */
    public function supprimer($id)
    {
        $stmt = $this->db->prepare("DELETE FROM avis WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Répondre à un avis (admin)
     */
    public function repondre($id, $reponse)
    {
        $stmt = $this->db->prepare("UPDATE avis SET reponse_admin = ? WHERE id = ?");
        return $stmt->execute([$reponse, $id]);
    }
}