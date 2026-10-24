<?php
/**
 * Modèle Newsletter
 * Gère les abonnés, le double opt-in et les envois
 */

class Newsletter
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
    // INSCRIPTION (DOUBLE OPT-IN)
    // =====================================================

    /**
     * Inscrit un email (en attente de confirmation)
     * Retourne l'abonné avec son token
     */
    public function inscrire($email, $nom = null, $source = 'site')
    {
        $email = strtolower(trim($email));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Email invalide");
        }

        // Vérifier si déjà inscrit
        $stmt = $this->db->prepare("SELECT * FROM newsletter_abonnes WHERE email = :email");
        $stmt->execute([':email' => $email]);
        $existant = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existant) {
            // Déjà confirmé et actif
            if ($existant['confirme'] && $existant['actif']) {
                throw new Exception("Cet email est déjà inscrit à la newsletter");
            }

            // Existant mais non confirmé → régénérer le token
            if (!$existant['confirme']) {
                $token = bin2hex(random_bytes(32));
                $stmt = $this->db->prepare("
                    UPDATE newsletter_abonnes 
                    SET token_confirmation = :token, 
                        date_inscription = NOW(),
                        nom = COALESCE(:nom, nom)
                    WHERE id = :id
                ");
                $stmt->execute([
                    ':token' => $token,
                    ':nom'   => $nom,
                    ':id'    => $existant['id'],
                ]);
                return $this->trouverParId($existant['id']);
            }

            // Désabonné → réactiver avec nouveau token
            $token = bin2hex(random_bytes(32));
            $stmt = $this->db->prepare("
                UPDATE newsletter_abonnes 
                SET token_confirmation = :token,
                    confirme = 0,
                    actif = 1,
                    date_inscription = NOW(),
                    date_desinscription = NULL,
                    nom = COALESCE(:nom, nom)
                WHERE id = :id
            ");
            $stmt->execute([
                ':token' => $token,
                ':nom'   => $nom,
                ':id'    => $existant['id'],
            ]);
            return $this->trouverParId($existant['id']);
        }

        // Nouvel inscrit
        $token = bin2hex(random_bytes(32));

        $stmt = $this->db->prepare("
            INSERT INTO newsletter_abonnes 
            (email, nom, token_confirmation, ip_inscription, source) 
            VALUES 
            (:email, :nom, :token, :ip, :source)
        ");
        $stmt->execute([
            ':email'  => $email,
            ':nom'    => $nom,
            ':token'  => $token,
            ':ip'     => $_SERVER['REMOTE_ADDR'] ?? null,
            ':source' => $source,
        ]);

        return $this->trouverParId($this->db->lastInsertId());
    }

    /**
     * Confirme un abonné par token
     */
    public function confirmer($token)
    {
        $stmt = $this->db->prepare("
            SELECT * FROM newsletter_abonnes 
            WHERE token_confirmation = :token AND confirme = 0
        ");
        $stmt->execute([':token' => $token]);
        $abonne = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$abonne) {
            throw new Exception("Lien de confirmation invalide ou déjà utilisé");
        }

        $stmt = $this->db->prepare("
            UPDATE newsletter_abonnes 
            SET confirme = 1, 
                token_confirmation = NULL,
                date_confirmation = NOW()
            WHERE id = :id
        ");
        $stmt->execute([':id' => $abonne['id']]);

        return $this->trouverParId($abonne['id']);
    }

    /**
     * Désabonne un email
     */
    public function desinscrire($emailOuToken)
    {
        // Détecter si c'est un token ou un email
        if (strlen($emailOuToken) === 64 && !str_contains($emailOuToken, '@')) {
            // Token
            $stmt = $this->db->prepare("
                UPDATE newsletter_abonnes 
                SET actif = 0, date_desinscription = NOW()
                WHERE token_confirmation = :token OR (email = (
                    SELECT email FROM (SELECT * FROM newsletter_abonnes) AS t 
                    WHERE token_confirmation = :token2
                )) LIMIT 1
            ");
            // Simplifié : chercher par email confirmé
            $stmt = $this->db->prepare("
                UPDATE newsletter_abonnes 
                SET actif = 0, date_desinscription = NOW()
                WHERE token_confirmation = :token
            ");
            return $stmt->execute([':token' => $emailOuToken]);
        }

        // Email
        $stmt = $this->db->prepare("
            UPDATE newsletter_abonnes 
            SET actif = 0, date_desinscription = NOW()
            WHERE email = :email
        ");
        return $stmt->execute([':email' => strtolower(trim($emailOuToken))]);
    }

    // =====================================================
    // LECTURE
    // =====================================================

    public function trouverParId($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM newsletter_abonnes WHERE id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function trouverParEmail($email)
    {
        $stmt = $this->db->prepare("SELECT * FROM newsletter_abonnes WHERE email = :email");
        $stmt->execute([':email' => strtolower(trim($email))]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Liste tous les abonnés avec filtres
     */
    public function liste($filtres = [])
    {
        $sql = "SELECT * FROM newsletter_abonnes WHERE 1=1";
        $params = [];

        if (isset($filtres['confirme'])) {
            $sql .= " AND confirme = :confirme";
            $params[':confirme'] = intval($filtres['confirme']);
        }

        if (isset($filtres['actif'])) {
            $sql .= " AND actif = :actif";
            $params[':actif'] = intval($filtres['actif']);
        }

        if (!empty($filtres['recherche'])) {
            $sql .= " AND (email LIKE :recherche OR nom LIKE :recherche)";
            $params[':recherche'] = '%' . $filtres['recherche'] . '%';
        }

        $sql .= " ORDER BY date_inscription DESC";

        if (!empty($filtres['limit'])) {
            $sql .= " LIMIT " . intval($filtres['limit']);
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Liste tous les abonnés confirmés et actifs (pour envoi)
     */
    public function getActifs()
    {
        $stmt = $this->db->query("
            SELECT * FROM newsletter_abonnes 
            WHERE confirme = 1 AND actif = 1
            ORDER BY date_confirmation ASC
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // =====================================================
    // ENVOI NEWSLETTER
    // =====================================================

    /**
     * Crée un enregistrement d'envoi (avant envoi effectif)
     */
    public function creerEnvoi($sujet, $contenu, $auteurId = null)
    {
        $stmt = $this->db->prepare("
            INSERT INTO newsletter_envois 
            (sujet, contenu, nb_destinataires, auteur_id) 
            VALUES (:sujet, :contenu, 0, :auteur)
        ");
        $stmt->execute([
            ':sujet'  => $sujet,
            ':contenu'=> $contenu,
            ':auteur' => $auteurId,
        ]);
        return $this->db->lastInsertId();
    }

    /**
     * Met à jour les compteurs d'envoi
     */
    public function majStatsEnvoi($envoiId, $nbEnvoyes, $nbEchecs)
    {
        $stmt = $this->db->prepare("
            UPDATE newsletter_envois 
            SET nb_destinataires = :total,
                nb_envoyes = :envoyes,
                nb_echecs = :echecs
            WHERE id = :id
        ");
        return $stmt->execute([
            ':total'   => $nbEnvoyes + $nbEchecs,
            ':envoyes' => $nbEnvoyes,
            ':echecs'  => $nbEchecs,
            ':id'      => $envoiId,
        ]);
    }

    /**
     * Liste des envois
     */
    public function listeEnvois($limit = 50)
    {
        $stmt = $this->db->prepare("
            SELECT e.*, a.nom AS auteur_nom
            FROM newsletter_envois e
            LEFT JOIN admins a ON a.id = e.auteur_id
            ORDER BY e.date_envoi DESC
            LIMIT " . intval($limit)
        );
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // =====================================================
    // STATISTIQUES
    // =====================================================

    public function stats()
    {
        $sql = "SELECT 
                    COUNT(*) AS total,
                    SUM(CASE WHEN confirme = 1 AND actif = 1 THEN 1 ELSE 0 END) AS actifs,
                    SUM(CASE WHEN confirme = 0 AND actif = 1 THEN 1 ELSE 0 END) AS en_attente,
                    SUM(CASE WHEN actif = 0 THEN 1 ELSE 0 END) AS desabonnes,
                    SUM(CASE WHEN date_inscription >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS cette_semaine,
                    SUM(CASE WHEN date_inscription >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS ce_mois
                FROM newsletter_abonnes";
        $stmt = $this->db->query($sql);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}