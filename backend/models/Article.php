<?php
/**
 * Modèle Article
 * Gère les articles du blog (création, modification, lecture)
 */

class Article
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
    // GÉNÉRATION DE SLUG
    // =====================================================

    /**
     * Génère un slug unique à partir d'un titre
     */
    public static function genererSlug($titre, $idExclu = null)
    {
        $slug = strtolower($titre);
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');
        $slug = substr($slug, 0, 100);

        if (empty($slug)) {
            $slug = 'article-' . time();
        }

        return $slug;
    }

    /**
     * S'assure que le slug est unique
     */
    private function slugUnique($slug, $idExclu = null)
    {
        $sql = "SELECT COUNT(*) FROM blog_articles WHERE slug = :slug";
        $params = [':slug' => $slug];

        if ($idExclu) {
            $sql .= " AND id != :id";
            $params[':id'] = $idExclu;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        if ($stmt->fetchColumn() > 0) {
            // Ajouter un suffixe
            $slug .= '-' . time();
        }
        return $slug;
    }

    // =====================================================
    // CRUD
    // =====================================================

    /**
     * Crée un article
     */
    public function creer($data, $auteurId = null)
    {
        $slug = self::genererSlug($data['titre']);
        $slug = $this->slugUnique($slug);

        $sql = "INSERT INTO blog_articles 
                (slug, titre, titre_mg, extrait, extrait_mg, contenu, contenu_mg, 
                 image_couverture, categorie_id, auteur_id, statut, a_la_une, publie_le) 
                VALUES 
                (:slug, :titre, :titre_mg, :extrait, :extrait_mg, :contenu, :contenu_mg,
                 :image, :categorie, :auteur, :statut, :a_la_une, :publie_le)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':slug'        => $slug,
            ':titre'       => $data['titre'],
            ':titre_mg'    => !empty($data['titre_mg']) ? $data['titre_mg'] : null,
            ':extrait'     => $data['extrait'] ?? null,
            ':extrait_mg'  => $data['extrait_mg'] ?? null,
            ':contenu'     => $data['contenu'],
            ':contenu_mg'  => $data['contenu_mg'] ?? null,
            ':image'       => $data['image_couverture'] ?? null,
            ':categorie'   => !empty($data['categorie_id']) ? intval($data['categorie_id']) : null,
            ':auteur'      => $auteurId,
            ':statut'      => $data['statut'] ?? 'brouillon',
            ':a_la_une'    => !empty($data['a_la_une']) ? 1 : 0,
            ':publie_le'   => ($data['statut'] ?? 'brouillon') === 'publie' ? date('Y-m-d H:i:s') : null,
        ]);

        return $this->trouverParId($this->db->lastInsertId());
    }

    /**
     * Met à jour un article
     */
    public function modifier($id, $data)
    {
        $article = $this->trouverParId($id);
        if (!$article) {
            throw new Exception("Article introuvable");
        }

        $champs = [];
        $params = [':id' => $id];

        if (isset($data['titre'])) {
            $champs[] = "titre = :titre";
            $params[':titre'] = $data['titre'];

            // Régénérer le slug si le titre a changé
            if ($data['titre'] !== $article['titre']) {
                $slug = self::genererSlug($data['titre']);
                $slug = $this->slugUnique($slug, $id);
                $champs[] = "slug = :slug";
                $params[':slug'] = $slug;
            }
        }
        if (isset($data['titre_mg'])) {
            $champs[] = "titre_mg = :titre_mg";
            $params[':titre_mg'] = $data['titre_mg'] ?: null;
        }
        if (isset($data['extrait'])) {
            $champs[] = "extrait = :extrait";
            $params[':extrait'] = $data['extrait'];
        }
        if (isset($data['extrait_mg'])) {
            $champs[] = "extrait_mg = :extrait_mg";
            $params[':extrait_mg'] = $data['extrait_mg'] ?: null;
        }
        if (isset($data['contenu'])) {
            $champs[] = "contenu = :contenu";
            $params[':contenu'] = $data['contenu'];
        }
        if (isset($data['contenu_mg'])) {
            $champs[] = "contenu_mg = :contenu_mg";
            $params[':contenu_mg'] = $data['contenu_mg'] ?: null;
        }
        if (isset($data['image_couverture'])) {
            $champs[] = "image_couverture = :image";
            $params[':image'] = $data['image_couverture'] ?: null;
        }
        if (isset($data['categorie_id'])) {
            $champs[] = "categorie_id = :categorie";
            $params[':categorie'] = $data['categorie_id'] ? intval($data['categorie_id']) : null;
        }
        if (isset($data['statut'])) {
            $champs[] = "statut = :statut";
            $params[':statut'] = $data['statut'];

            // Si publié pour la première fois, enregistrer la date
            if ($data['statut'] === 'publie' && !$article['publie_le']) {
                $champs[] = "publie_le = :publie_le";
                $params[':publie_le'] = date('Y-m-d H:i:s');
            }
        }
        if (isset($data['a_la_une'])) {
            $champs[] = "a_la_une = :a_la_une";
            $params[':a_la_une'] = $data['a_la_une'] ? 1 : 0;
        }

        if (empty($champs)) {
            throw new Exception("Aucun champ à modifier");
        }

        $sql = "UPDATE blog_articles SET " . implode(', ', $champs) . " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->trouverParId($id);
    }

    /**
     * Supprime un article
     */
    public function supprimer($id)
    {
        $stmt = $this->db->prepare("DELETE FROM blog_articles WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    // =====================================================
    // LECTURE
    // =====================================================

    /**
     * Trouve un article par ID
     */
    public function trouverParId($id)
    {
        $stmt = $this->db->prepare("
            SELECT a.*, c.nom AS categorie_nom, c.slug AS categorie_slug, c.couleur AS categorie_couleur,
                   ad.nom AS auteur_nom
            FROM blog_articles a
            LEFT JOIN blog_categories c ON c.id = a.categorie_id
            LEFT JOIN admins ad ON ad.id = a.auteur_id
            WHERE a.id = :id
        ");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Trouve un article par slug
     */
    public function trouverParSlug($slug)
    {
        $stmt = $this->db->prepare("
            SELECT a.*, c.nom AS categorie_nom, c.slug AS categorie_slug, c.couleur AS categorie_couleur,
                   ad.nom AS auteur_nom
            FROM blog_articles a
            LEFT JOIN blog_categories c ON c.id = a.categorie_id
            LEFT JOIN admins ad ON ad.id = a.auteur_id
            WHERE a.slug = :slug AND a.statut = 'publie'
        ");
        $stmt->execute([':slug' => $slug]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Incrémente le compteur de vues
     */
    public function incrementerVues($id)
    {
        $stmt = $this->db->prepare("UPDATE blog_articles SET vues = vues + 1 WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    // =====================================================
    // LISTE
    // =====================================================

    /**
     * Liste les articles avec filtres
     * 
     * @param array $filtres : statut, categorie_id, recherche, a_la_une, limit
     * @param bool $publiesSeulement : si true, uniquement les articles publiés (public)
     */
    public function liste($filtres = [], $publiesSeulement = false)
    {
        $sql = "SELECT a.id, a.slug, a.titre, a.titre_mg, a.extrait, a.extrait_mg,
                       a.image_couverture, a.statut, a.a_la_une, a.vues, a.publie_le, a.created_at,
                       c.nom AS categorie_nom, c.slug AS categorie_slug, c.couleur AS categorie_couleur,
                       ad.nom AS auteur_nom
                FROM blog_articles a
                LEFT JOIN blog_categories c ON c.id = a.categorie_id
                LEFT JOIN admins ad ON ad.id = a.auteur_id
                WHERE 1=1";
        $params = [];

        if ($publiesSeulement) {
            $sql .= " AND a.statut = 'publie'";
        } elseif (!empty($filtres['statut'])) {
            $sql .= " AND a.statut = :statut";
            $params[':statut'] = $filtres['statut'];
        }

        if (!empty($filtres['categorie_id'])) {
            $sql .= " AND a.categorie_id = :categorie";
            $params[':categorie'] = intval($filtres['categorie_id']);
        }

        if (!empty($filtres['categorie_slug'])) {
            $sql .= " AND c.slug = :cat_slug";
            $params[':cat_slug'] = $filtres['categorie_slug'];
        }

        if (!empty($filtres['a_la_une'])) {
            $sql .= " AND a.a_la_une = 1";
        }

        if (!empty($filtres['recherche'])) {
            $sql .= " AND (a.titre LIKE :recherche OR a.extrait LIKE :recherche)";
            $params[':recherche'] = '%' . $filtres['recherche'] . '%';
        }

        // Tri
        $sql .= " ORDER BY a.a_la_une DESC, a.publie_le DESC, a.created_at DESC";

        if (!empty($filtres['limit'])) {
            $sql .= " LIMIT " . intval($filtres['limit']);
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Liste les catégories
     */
    public function getCategories()
    {
        $stmt = $this->db->query("SELECT * FROM blog_categories ORDER BY ordre ASC, nom ASC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Statistiques blog
     */
    public function stats()
    {
        $sql = "SELECT 
                    COUNT(*) AS total,
                    SUM(CASE WHEN statut = 'publie' THEN 1 ELSE 0 END) AS publies,
                    SUM(CASE WHEN statut = 'brouillon' THEN 1 ELSE 0 END) AS brouillons,
                    SUM(CASE WHEN statut = 'archive' THEN 1 ELSE 0 END) AS archives,
                    SUM(vues) AS total_vues
                FROM blog_articles";
        $stmt = $this->db->query($sql);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}