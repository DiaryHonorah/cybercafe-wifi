<?php
/**
 * Modèle Reservation
 * Gère les opérations CRUD sur la table reservations
 * 
 * Connexion : utilise la classe Database existante (config/database.php)
 */

class Reservation
{
    private $db;

    /**
     * Constructeur
     * @param PDO|null $db Connexion PDO (optionnelle)
     */
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

    /**
     * Connexion à la base via la classe Database existante
     */
    private function connecter()
    {
        $configPath = __DIR__ . '/../config/database.php';

        if (!file_exists($configPath)) {
            throw new Exception("Fichier config/database.php introuvable");
        }

        require_once $configPath;

        // ✅ Utilise la classe Database existante
        if (class_exists('Database')) {
            $database = new Database();
            return $database->getConnection();
        }

        throw new Exception("Classe Database introuvable dans config/database.php");
    }

    /**
     * Génère un code de réservation unique (ex: RES-A3F8K2)
     */
    public static function genererCode()
    {
        $caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $code = 'RES-';
        for ($i = 0; $i < 6; $i++) {
            $code .= $caracteres[random_int(0, strlen($caracteres) - 1)];
        }
        return $code;
    }

    /**
     * Crée une nouvelle réservation
     */
    public function creer($data)
    {
        $code = self::genererCode();

        $tentatives = 0;
        while ($this->codeExiste($code) && $tentatives < 10) {
            $code = self::genererCode();
            $tentatives++;
        }

        $sql = "INSERT INTO reservations 
                (code_reservation, nom, email, telephone, date_reservation, 
                 heure_reservation, duree, nombre_postes, message, ip_client) 
                VALUES 
                (:code, :nom, :email, :telephone, :date, 
                 :heure, :duree, :postes, :message, :ip)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':code'      => $code,
            ':nom'       => $data['nom'],
            ':email'     => $data['email'],
            ':telephone' => $data['telephone'],
            ':date'      => $data['date_reservation'],
            ':heure'     => $data['heure_reservation'],
            ':duree'     => $data['duree'],
            ':postes'    => $data['nombre_postes'],
            ':message'   => $data['message'] ?? null,
            ':ip'        => $_SERVER['REMOTE_ADDR'] ?? null,
        ]);

        $id = $this->db->lastInsertId();
        return $this->trouverParId($id);
    }

    public function trouverParId($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM reservations WHERE id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function trouverParCode($code)
    {
        $stmt = $this->db->prepare("SELECT * FROM reservations WHERE code_reservation = :code");
        $stmt->execute([':code' => $code]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    private function codeExiste($code)
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM reservations WHERE code_reservation = :code");
        $stmt->execute([':code' => $code]);
        return $stmt->fetchColumn() > 0;
    }

    public function liste($filtres = [])
    {
        $sql = "SELECT * FROM reservations WHERE 1=1";
        $params = [];

        if (!empty($filtres['statut'])) {
            $sql .= " AND statut = :statut";
            $params[':statut'] = $filtres['statut'];
        }

        if (!empty($filtres['date_debut'])) {
            $sql .= " AND date_reservation >= :date_debut";
            $params[':date_debut'] = $filtres['date_debut'];
        }

        if (!empty($filtres['date_fin'])) {
            $sql .= " AND date_reservation <= :date_fin";
            $params[':date_fin'] = $filtres['date_fin'];
        }

        if (!empty($filtres['recherche'])) {
            $sql .= " AND (nom LIKE :recherche OR email LIKE :recherche OR telephone LIKE :recherche OR code_reservation LIKE :recherche)";
            $params[':recherche'] = '%' . $filtres['recherche'] . '%';
        }

        $sql .= " ORDER BY date_reservation DESC, heure_reservation DESC";

        if (!empty($filtres['limit'])) {
            $sql .= " LIMIT " . intval($filtres['limit']);
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function changerStatut($id, $statut, $raison = null, $noteAdmin = null)
    {
        $sql = "UPDATE reservations SET statut = :statut";
        $params = [':statut' => $statut, ':id' => $id];

        if ($raison !== null) {
            $sql .= ", raison_annulation = :raison";
            $params[':raison'] = $raison;
        }

        if ($noteAdmin !== null) {
            $sql .= ", note_admin = :note";
            $params[':note'] = $noteAdmin;
        }

        $sql .= " WHERE id = :id";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    public function marquerEmailEnvoye($id)
    {
        $stmt = $this->db->prepare("UPDATE reservations SET email_envoye = 1 WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    public function supprimer($id)
    {
        $stmt = $this->db->prepare("DELETE FROM reservations WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    public function stats()
    {
        $sql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
                    SUM(CASE WHEN statut = 'confirmee' THEN 1 ELSE 0 END) as confirmee,
                    SUM(CASE WHEN statut = 'annulee' THEN 1 ELSE 0 END) as annulee,
                    SUM(CASE WHEN statut = 'terminee' THEN 1 ELSE 0 END) as terminee,
                    SUM(CASE WHEN date_reservation = CURDATE() THEN 1 ELSE 0 END) as aujourd_hui
                FROM reservations";
        $stmt = $this->db->query($sql);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}