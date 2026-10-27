<?php
/**
 * Modèle Galerie
 * Gère les photos du cybercafé
 */

class Galerie
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

    /**
     * Crée une photo (upload)
     */
    public function creer($data, $adminId = null)
    {
        $stmt = $this->db->prepare("
            INSERT INTO galerie_photos 
            (titre, titre_mg, description, description_mg, image_path, categorie, ordre, actif, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            trim($data['titre']),
            !empty($data['titre_mg']) ? trim($data['titre_mg']) : null,
            $data['description'] ?? null,
            $data['description_mg'] ?? null,
            $data['image_path'],
            $data['categorie'] ?? 'espace',
            intval($data['ordre'] ?? 0),
            !empty($data['actif']) ? 1 : 0,
            $adminId,
        ]);

        return $this->trouverParId($this->db->lastInsertId());
    }

    /**
     * Modifie une photo
     */
    public function modifier($id, $data)
    {
        $photo = $this->trouverParId($id);
        if (!$photo) {
            throw new Exception("Photo introuvable");
        }

        $stmt = $this->db->prepare("
            UPDATE galerie_photos SET 
                titre = ?, titre_mg = ?, description = ?, description_mg = ?,
                categorie = ?, ordre = ?, actif = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $data['titre'] ?? $photo['titre'],
            $data['titre_mg'] ?? $photo['titre_mg'],
            $data['description'] ?? $photo['description'],
            $data['description_mg'] ?? $photo['description_mg'],
            $data['categorie'] ?? $photo['categorie'],
            intval($data['ordre'] ?? $photo['ordre']),
            isset($data['actif']) ? ($data['actif'] ? 1 : 0) : $photo['actif'],
            $id,
        ]);

        return $this->trouverParId($id);
    }

    /**
     * Supprime une photo (et son fichier)
     */
    public function supprimer($id)
    {
        $photo = $this->trouverParId($id);
        if (!$photo) {
            throw new Exception("Photo introuvable");
        }

        // Supprimer le fichier
        $cheminComplet = __DIR__ . '/../' . $photo['image_path'];
        if (file_exists($cheminComplet)) {
            @unlink($cheminComplet);
        }

        $stmt = $this->db->prepare("DELETE FROM galerie_photos WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Toggle actif
     */
    public function toggleActif($id)
    {
        $photo = $this->trouverParId($id);
        if (!$photo) {
            throw new Exception("Photo introuvable");
        }

        $stmt = $this->db->prepare("UPDATE galerie_photos SET actif = ? WHERE id = ?");
        $stmt->execute([$photo['actif'] ? 0 : 1, $id]);

        return $this->trouverParId($id);
    }

    /**
     * Trouve par ID
     */
    public function trouverParId($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM galerie_photos WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Liste les photos
     */
    public function liste($filtres = [])
    {
        $sql = "SELECT * FROM galerie_photos WHERE 1=1";
        $params = [];

        if (isset($filtres['actif'])) {
            $sql .= " AND actif = ?";
            $params[] = $filtres['actif'];
        }

        if (!empty($filtres['categorie'])) {
            $sql .= " AND categorie = ?";
            $params[] = $filtres['categorie'];
        }

        $sql .= " ORDER BY ordre ASC, created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Statistiques
     */
    public function stats()
    {
        $stats = [];

        $stmt = $this->db->query("SELECT COUNT(*) FROM galerie_photos");
        $stats['total'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM galerie_photos WHERE actif = 1");
        $stats['actives'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM galerie_photos WHERE categorie = 'espace'");
        $stats['espace'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM galerie_photos WHERE categorie = 'equipement'");
        $stats['equipement'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM galerie_photos WHERE categorie = 'services'");
        $stats['services'] = intval($stmt->fetchColumn());

        return $stats;
    }
}