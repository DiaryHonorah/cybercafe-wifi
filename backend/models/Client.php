<?php
/**
 * Modèle Client
 * Gestion des comptes clients
 */

class Client
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
    // INSCRIPTION
    // =====================================================

    public function inscrire($data)
    {
        $email = strtolower(trim($data['email'] ?? ''));
        $nom = trim($data['nom'] ?? '');
        $telephone = trim($data['telephone'] ?? '');
        $motDePasse = $data['mot_de_passe'] ?? '';

        // Validations
        if (empty($nom) || mb_strlen($nom) < 2) {
            throw new Exception("Nom requis (2 caractères min)");
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Email invalide");
        }
        if (empty($telephone) || mb_strlen($telephone) < 8) {
            throw new Exception("Téléphone invalide");
        }
        if (strlen($motDePasse) < 8) {
            throw new Exception("Mot de passe requis (8 caractères min)");
        }

        // Vérifier email unique
        $stmt = $this->db->prepare("SELECT id FROM clients WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            throw new Exception("Cet email est déjà utilisé");
        }

        // Vérifier téléphone unique
        $stmt = $this->db->prepare("SELECT id FROM clients WHERE telephone = ?");
        $stmt->execute([$telephone]);
        if ($stmt->fetch()) {
            throw new Exception("Ce numéro de téléphone est déjà utilisé");
        }

        // Hash
        $hash = password_hash($motDePasse, PASSWORD_DEFAULT);
        $tokenVerif = bin2hex(random_bytes(32));

        // Insert
        $stmt = $this->db->prepare("
            INSERT INTO clients 
            (nom, email, telephone, mot_de_passe, token_verification, date_naissance, adresse) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $nom,
            $email,
            $telephone,
            $hash,
            $tokenVerif,
            !empty($data['date_naissance']) ? $data['date_naissance'] : null,
            $data['adresse'] ?? null,
        ]);

        $id = $this->db->lastInsertId();
        return $this->trouverParId($id);
    }

    // =====================================================
    // AUTHENTIFICATION
    // =====================================================

    public function connexion($email, $motDePasse)
    {
        $email = strtolower(trim($email));

        $stmt = $this->db->prepare("SELECT * FROM clients WHERE email = ?");
        $stmt->execute([$email]);
        $client = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$client) {
            throw new Exception("Email ou mot de passe incorrect");
        }

        if (!$client['actif']) {
            throw new Exception("Compte désactivé. Contactez l'administrateur.");
        }

        if (!password_verify($motDePasse, $client['mot_de_passe'])) {
            throw new Exception("Email ou mot de passe incorrect");
        }

        // Créer un token
        $token = bin2hex(random_bytes(32));
        $expire = date('Y-m-d H:i:s', strtotime('+30 days'));

        $stmt = $this->db->prepare("
            INSERT INTO clients_sessions (client_id, token, ip, user_agent, expire_le) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $client['id'],
            $token,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
            $expire,
        ]);

        // Mettre à jour la dernière connexion
        $this->db->prepare("
            UPDATE clients SET derniere_connexion = NOW() WHERE id = ?
        ")->execute([$client['id']]);

        unset($client['mot_de_passe']);
        unset($client['token_verification']);
        unset($client['token_reset']);

        return [
            'client' => $client,
            'token' => $token,
        ];
    }

    public function verifierToken($token)
    {
        $stmt = $this->db->prepare("
            SELECT c.* 
            FROM clients_sessions cs
            JOIN clients c ON c.id = cs.client_id
            WHERE cs.token = ? AND cs.expire_le > NOW() AND c.actif = 1
        ");
        $stmt->execute([$token]);
        $client = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$client) {
            throw new Exception("Session invalide ou expirée");
        }

        unset($client['mot_de_passe']);
        unset($client['token_verification']);
        unset($client['token_reset']);

        return $client;
    }

    public function deconnexion($token)
    {
        $stmt = $this->db->prepare("DELETE FROM clients_sessions WHERE token = ?");
        return $stmt->execute([$token]);
    }

    // =====================================================
    // CRUD
    // =====================================================

    public function trouverParId($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM clients WHERE id = ?");
        $stmt->execute([$id]);
        $client = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($client) {
            unset($client['mot_de_passe']);
            unset($client['token_verification']);
            unset($client['token_reset']);
        }
        return $client;
    }

    public function trouverParEmail($email)
    {
        $stmt = $this->db->prepare("SELECT * FROM clients WHERE email = ?");
        $stmt->execute([strtolower($email)]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function modifier($id, $data)
    {
        $client = $this->trouverParId($id);
        if (!$client) {
            throw new Exception("Client introuvable");
        }

        $champs = [];
        $params = [':id' => $id];

        if (isset($data['nom']) && mb_strlen(trim($data['nom'])) >= 2) {
            $champs[] = "nom = :nom";
            $params[':nom'] = trim($data['nom']);
        }
        if (isset($data['telephone']) && mb_strlen(trim($data['telephone'])) >= 8) {
            // Vérifier que le téléphone n'est pas utilisé par un autre client
            $stmt = $this->db->prepare("SELECT id FROM clients WHERE telephone = ? AND id != ?");
            $stmt->execute([trim($data['telephone']), $id]);
            if ($stmt->fetch()) {
                throw new Exception("Ce numéro de téléphone est déjà utilisé");
            }
            $champs[] = "telephone = :telephone";
            $params[':telephone'] = trim($data['telephone']);
        }
        if (isset($data['date_naissance'])) {
            $champs[] = "date_naissance = :date_naissance";
            $params[':date_naissance'] = !empty($data['date_naissance']) ? $data['date_naissance'] : null;
        }
        if (isset($data['adresse'])) {
            $champs[] = "adresse = :adresse";
            $params[':adresse'] = $data['adresse'] ?: null;
        }

        if (empty($champs)) {
            return $client;
        }

        $sql = "UPDATE clients SET " . implode(', ', $champs) . " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->trouverParId($id);
    }

    public function changerMotDePasse($id, $ancienMdp, $nouveauMdp)
    {
        $stmt = $this->db->prepare("SELECT mot_de_passe FROM clients WHERE id = ?");
        $stmt->execute([$id]);
        $hash = $stmt->fetchColumn();

        if (!$hash || !password_verify($ancienMdp, $hash)) {
            throw new Exception("Ancien mot de passe incorrect");
        }

        if (strlen($nouveauMdp) < 8) {
            throw new Exception("Nouveau mot de passe trop court (8 caractères min)");
        }

        $nouveauHash = password_hash($nouveauMdp, PASSWORD_DEFAULT);
        $stmt = $this->db->prepare("UPDATE clients SET mot_de_passe = ? WHERE id = ?");
        $stmt->execute([$nouveauHash, $id]);

        return true;
    }

    // =====================================================
    // LISTE (ADMIN)
    // =====================================================

    public function liste($filtres = [])
    {
        $sql = "SELECT * FROM clients WHERE 1=1";
        $params = [];

        if (!empty($filtres['recherche'])) {
            $sql .= " AND (nom LIKE ? OR email LIKE ? OR telephone LIKE ?)";
            $search = '%' . $filtres['recherche'] . '%';
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
        }

        if (isset($filtres['actif'])) {
            $sql .= " AND actif = ?";
            $params[] = intval($filtres['actif']);
        }

        $sql .= " ORDER BY date_inscription DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // =====================================================
    // NOTIFICATIONS
    // =====================================================

    public function ajouterNotification($clientId, $titre, $message, $type = 'info', $lien = null)
    {
        $stmt = $this->db->prepare("
            INSERT INTO clients_notifications (client_id, titre, message, type, lien) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$clientId, $titre, $message, $type, $lien]);
        return $this->db->lastInsertId();
    }

    public function getNotifications($clientId, $limite = 20)
    {
        $stmt = $this->db->prepare("
            SELECT * FROM clients_notifications 
            WHERE client_id = ? 
            ORDER BY created_at DESC 
            LIMIT " . intval($limite)
        );
        $stmt->execute([$clientId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function marquerNotificationLue($notifId, $clientId)
    {
        $stmt = $this->db->prepare("
            UPDATE clients_notifications SET lu = 1 
            WHERE id = ? AND client_id = ?
        ");
        return $stmt->execute([$notifId, $clientId]);
    }

    public function compterNotificationsNonLues($clientId)
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM clients_notifications 
            WHERE client_id = ? AND lu = 0
        ");
        $stmt->execute([$clientId]);
        return intval($stmt->fetchColumn());
    }
}