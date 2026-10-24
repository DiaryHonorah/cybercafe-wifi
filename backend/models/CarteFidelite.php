<?php
/**
 * Modèle CarteFidelite
 * Gère les cartes de fidélité, les points et l'historique
 * 
 * Niveaux :
 * - Bronze : 0 - 999 points
 * - Argent : 1 000 - 4 999 points
 * - Or : 5 000 - 19 999 points
 * - Platine : 20 000+ points
 */

class CarteFidelite
{
    private $db;

    // Seuils des niveaux
    const SEUIL_ARGENT = 1000;
    const SEUIL_OR = 5000;
    const SEUIL_PLATINE = 20000;

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
     * Connexion via la classe Database
     */
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
    // GÉNÉRATION DE CODE
    // =====================================================

    /**
     * Génère un code de carte unique (ex: FID-A3F8K2)
     */
    public static function genererCode()
    {
        $caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $code = 'FID-';
        for ($i = 0; $i < 6; $i++) {
            $code .= $caracteres[random_int(0, strlen($caracteres) - 1)];
        }
        return $code;
    }

    private function codeExiste($code)
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM cartes_fidelite WHERE code_carte = :code");
        $stmt->execute([':code' => $code]);
        return $stmt->fetchColumn() > 0;
    }

    // =====================================================
    // CALCUL DU NIVEAU
    // =====================================================

    /**
     * Calcule le niveau selon les points totaux
     */
    public static function calculerNiveau($points)
    {
        if ($points >= self::SEUIL_PLATINE) return 'platine';
        if ($points >= self::SEUIL_OR) return 'or';
        if ($points >= self::SEUIL_ARGENT) return 'argent';
        return 'bronze';
    }

    /**
     * Retourne les infos d'un niveau (couleur, icône, avantage)
     */
    public static function getInfoNiveau($niveau)
    {
        $infos = [
            'bronze' => [
                'label' => 'Bronze',
                'couleur' => 'from-[#CD7F32] to-[#A0522D]',
                'avantage' => 'Aucun avantage',
                'icone' => '🥉',
            ],
            'argent' => [
                'label' => 'Argent',
                'couleur' => 'from-[#C0C0C0] to-[#A9A9A9]',
                'avantage' => '-5% sur impressions',
                'icone' => '🥈',
            ],
            'or' => [
                'label' => 'Or',
                'couleur' => 'from-[#FFD700] to-[#FFA500]',
                'avantage' => '-10% sur impressions',
                'icone' => '🥇',
            ],
            'platine' => [
                'label' => 'Platine',
                'couleur' => 'from-[#E5E4E2] to-[#B0C4DE]',
                'avantage' => '-15% + 1h gratuite/mois',
                'icone' => '💎',
            ],
        ];
        return $infos[$niveau] ?? $infos['bronze'];
    }

    // =====================================================
    // CRÉATION
    // =====================================================

    /**
     * Crée une nouvelle carte de fidélité
     */
    public function creer($data)
    {
        // Vérifier téléphone unique
        $stmt = $this->db->prepare("SELECT id FROM cartes_fidelite WHERE client_telephone = :tel");
        $stmt->execute([':tel' => $data['client_telephone']]);
        if ($stmt->fetch()) {
            throw new Exception("Une carte existe déjà pour ce numéro de téléphone");
        }

        // Générer code unique
        $code = self::genererCode();
        $tentatives = 0;
        while ($this->codeExiste($code) && $tentatives < 10) {
            $code = self::genererCode();
            $tentatives++;
        }

        $sql = "INSERT INTO cartes_fidelite 
                (code_carte, client_nom, client_telephone, client_email, note_admin) 
                VALUES 
                (:code, :nom, :tel, :email, :note)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':code'  => $code,
            ':nom'   => trim($data['client_nom']),
            ':tel'   => trim($data['client_telephone']),
            ':email' => !empty($data['client_email']) ? trim($data['client_email']) : null,
            ':note'  => $data['note_admin'] ?? null,
        ]);

        $id = $this->db->lastInsertId();
        return $this->trouverParId($id);
    }

    // =====================================================
    // RECHERCHE
    // =====================================================

    /**
     * Trouve une carte par ID
     */
    public function trouverParId($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM cartes_fidelite WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $carte = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($carte) {
            $carte = $this->enrichir($carte);
        }
        return $carte;
    }

    /**
     * Trouve une carte par code
     */
    public function trouverParCode($code)
    {
        $stmt = $this->db->prepare("SELECT * FROM cartes_fidelite WHERE code_carte = :code");
        $stmt->execute([':code' => $code]);
        $carte = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($carte) {
            $carte = $this->enrichir($carte);
        }
        return $carte;
    }

    /**
     * Trouve une carte par téléphone
     */
    public function trouverParTelephone($tel)
    {
        $stmt = $this->db->prepare("SELECT * FROM cartes_fidelite WHERE client_telephone = :tel");
        $stmt->execute([':tel' => $tel]);
        $carte = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($carte) {
            $carte = $this->enrichir($carte);
        }
        return $carte;
    }

    /**
     * Enrichit une carte avec des données calculées
     */
    private function enrichir($carte)
    {
        $carte['points_disponibles'] = intval($carte['points_total']) - intval($carte['points_utilises']);
        $carte['niveau_auto'] = self::calculerNiveau(intval($carte['points_total']));
        $carte['niveau_info'] = self::getInfoNiveau($carte['niveau_auto']);
        
        // Progression vers le prochain niveau
        $points = intval($carte['points_total']);
        $nextLevel = null;
        $nextSeuil = 0;
        if ($points < self::SEUIL_ARGENT) {
            $nextLevel = 'argent';
            $nextSeuil = self::SEUIL_ARGENT;
        } elseif ($points < self::SEUIL_OR) {
            $nextLevel = 'or';
            $nextSeuil = self::SEUIL_OR;
        } elseif ($points < self::SEUIL_PLATINE) {
            $nextLevel = 'platine';
            $nextSeuil = self::SEUIL_PLATINE;
        }
        
        if ($nextLevel) {
            $carte['prochain_niveau'] = $nextLevel;
            $carte['prochain_seuil'] = $nextSeuil;
            $carte['points_manquants'] = $nextSeuil - $points;
            $carte['progression'] = round(($points / $nextSeuil) * 100, 1);
        } else {
            $carte['prochain_niveau'] = null;
            $carte['prochain_seuil'] = null;
            $carte['points_manquants'] = 0;
            $carte['progression'] = 100;
        }
        
        return $carte;
    }

    // =====================================================
    // LISTE
    // =====================================================

    /**
     * Liste toutes les cartes avec filtres
     */
    public function liste($filtres = [])
    {
        $sql = "SELECT * FROM cartes_fidelite WHERE 1=1";
        $params = [];

        if (isset($filtres['actif'])) {
            $sql .= " AND actif = :actif";
            $params[':actif'] = $filtres['actif'];
        }

        if (!empty($filtres['niveau'])) {
            $sql .= " AND niveau = :niveau";
            $params[':niveau'] = $filtres['niveau'];
        }

        if (!empty($filtres['recherche'])) {
            $sql .= " AND (client_nom LIKE :recherche OR client_telephone LIKE :recherche OR code_carte LIKE :recherche)";
            $params[':recherche'] = '%' . $filtres['recherche'] . '%';
        }

        $sql .= " ORDER BY points_total DESC, date_creation DESC";

        if (!empty($filtres['limit'])) {
            $sql .= " LIMIT " . intval($filtres['limit']);
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $cartes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map([$this, 'enrichir'], $cartes);
    }

    // =====================================================
    // POINTS — AJOUTER / DÉPENSER
    // =====================================================

    /**
     * Ajoute des points à une carte
     */
    public function ajouterPoints($carteId, $points, $raison = '', $reference = null)
    {
        if ($points <= 0) {
            throw new Exception("Les points doivent être positifs");
        }

        $carte = $this->trouverParId($carteId);
        if (!$carte) {
            throw new Exception("Carte introuvable");
        }

        if (!$carte['actif']) {
            throw new Exception("Cette carte est désactivée");
        }

        try {
            $this->db->beginTransaction();

            // Mise à jour des points
            $nouveauxPoints = intval($carte['points_total']) + $points;
            $nouveauNiveau = self::calculerNiveau($nouveauxPoints);

            $stmt = $this->db->prepare("
                UPDATE cartes_fidelite 
                SET points_total = :points, 
                    niveau = :niveau,
                    date_derniere_utilisation = NOW()
                WHERE id = :id
            ");
            $stmt->execute([
                ':points' => $nouveauxPoints,
                ':niveau' => $nouveauNiveau,
                ':id'     => $carteId,
            ]);

            // Ajouter à l'historique
            $stmt = $this->db->prepare("
                INSERT INTO historique_points (carte_id, type, points, raison, reference)
                VALUES (:carte_id, 'gain', :points, :raison, :reference)
            ");
            $stmt->execute([
                ':carte_id'  => $carteId,
                ':points'    => $points,
                ':raison'    => $raison,
                ':reference' => $reference,
            ]);

            $this->db->commit();

            return $this->trouverParId($carteId);

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Dépense des points (pour utiliser une récompense)
     */
    public function depenserPoints($carteId, $points, $raison = '', $reference = null)
    {
        if ($points <= 0) {
            throw new Exception("Les points doivent être positifs");
        }

        $carte = $this->trouverParId($carteId);
        if (!$carte) {
            throw new Exception("Carte introuvable");
        }

        $disponibles = intval($carte['points_total']) - intval($carte['points_utilises']);
        if ($disponibles < $points) {
            throw new Exception("Points insuffisants. Disponibles : $disponibles, demandés : $points");
        }

        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                UPDATE cartes_fidelite 
                SET points_utilises = points_utilises + :points,
                    date_derniere_utilisation = NOW()
                WHERE id = :id
            ");
            $stmt->execute([
                ':points' => $points,
                ':id'     => $carteId,
            ]);

            $stmt = $this->db->prepare("
                INSERT INTO historique_points (carte_id, type, points, raison, reference)
                VALUES (:carte_id, 'depense', :points, :raison, :reference)
            ");
            $stmt->execute([
                ':carte_id'  => $carteId,
                ':points'    => -$points,
                ':raison'    => $raison,
                ':reference' => $reference,
            ]);

            $this->db->commit();

            return $this->trouverParId($carteId);

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // =====================================================
    // HISTORIQUE
    // =====================================================

    /**
     * Récupère l'historique des points d'une carte
     */
    public function getHistorique($carteId, $limit = 50)
    {
        $stmt = $this->db->prepare("
            SELECT * FROM historique_points 
            WHERE carte_id = :id 
            ORDER BY created_at DESC 
            LIMIT " . intval($limit)
        );
        $stmt->execute([':id' => $carteId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // =====================================================
    // RÉCOMPENSES
    // =====================================================

    /**
     * Liste les récompenses disponibles
     */
    public function getRecompenses($actifSeulement = true)
    {
        $sql = "SELECT * FROM recompenses_fidelite";
        if ($actifSeulement) {
            $sql .= " WHERE actif = 1";
        }
        $sql .= " ORDER BY ordre ASC, points_requis ASC";
        return $this->db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupère les récompenses débloquées par une carte
     */
    public function getRecompensesDebloquees($carteId)
    {
        $carte = $this->trouverParId($carteId);
        if (!$carte) return [];

        $pointsDispos = $carte['points_disponibles'];
        $recompenses = $this->getRecompenses();

        return array_map(function($r) use ($pointsDispos) {
            $r['debloquee'] = $pointsDispos >= intval($r['points_requis']);
            $r['points_manquants'] = max(0, intval($r['points_requis']) - $pointsDispos);
            return $r;
        }, $recompenses);
    }

    // =====================================================
    // ACTIONS DIVERSES
    // =====================================================

    /**
     * Met à jour les infos d'une carte
     */
    public function modifier($id, $data)
    {
        $champs = [];
        $params = [':id' => $id];

        if (isset($data['client_nom'])) {
            $champs[] = "client_nom = :nom";
            $params[':nom'] = trim($data['client_nom']);
        }
        if (isset($data['client_email'])) {
            $champs[] = "client_email = :email";
            $params[':email'] = !empty($data['client_email']) ? trim($data['client_email']) : null;
        }
        if (isset($data['note_admin'])) {
            $champs[] = "note_admin = :note";
            $params[':note'] = $data['note_admin'];
        }
        if (isset($data['actif'])) {
            $champs[] = "actif = :actif";
            $params[':actif'] = $data['actif'] ? 1 : 0;
        }

        if (empty($champs)) {
            throw new Exception("Aucun champ à modifier");
        }

        $sql = "UPDATE cartes_fidelite SET " . implode(', ', $champs) . " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->trouverParId($id);
    }

    /**
     * Active ou désactive une carte
     */
    public function toggleActif($id)
    {
        $carte = $this->trouverParId($id);
        if (!$carte) {
            throw new Exception("Carte introuvable");
        }
        $nouveauStatut = $carte['actif'] ? 0 : 1;
        $stmt = $this->db->prepare("UPDATE cartes_fidelite SET actif = :actif WHERE id = :id");
        $stmt->execute([':actif' => $nouveauStatut, ':id' => $id]);
        return $this->trouverParId($id);
    }

    /**
     * Supprime une carte
     */
    public function supprimer($id)
    {
        $stmt = $this->db->prepare("DELETE FROM cartes_fidelite WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    // =====================================================
    // STATISTIQUES
    // =====================================================

    /**
     * Statistiques globales
     */
    public function stats()
    {
        $sql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN actif = 1 THEN 1 ELSE 0 END) as actifs,
                    SUM(CASE WHEN niveau = 'bronze' THEN 1 ELSE 0 END) as bronze,
                    SUM(CASE WHEN niveau = 'argent' THEN 1 ELSE 0 END) as argent,
                    SUM(CASE WHEN niveau = 'or' THEN 1 ELSE 0 END) as or_niveau,
                    SUM(CASE WHEN niveau = 'platine' THEN 1 ELSE 0 END) as platine,
                    SUM(points_total) as total_points_distribues,
                    SUM(points_utilises) as total_points_utilises,
                    SUM(points_total - points_utilises) as total_points_disponibles
                FROM cartes_fidelite";
        $stmt = $this->db->query($sql);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}