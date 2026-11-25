<?php
/**
 * Modèle Recommandation
 * Moteur de recommandation intelligent pour les forfaits Wi-Fi
 * Table cible : `forfaits` (id, nom, duree_minutes, prix, actif, vues)
 */

class Recommandation
{
    // Table des forfaits recommandables
    const TABLE_SERVICES = 'forfaits';

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
    // CONFIGURATION
    // =====================================================

    public function getConfig()
    {
        $stmt = $this->db->query("SELECT * FROM reco_config LIMIT 1");
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateConfig($data)
    {
        $stmt = $this->db->prepare("
            UPDATE reco_config SET
                actif = ?, nb_recommandations = ?,
                poids_vues = ?, poids_reservations = ?, poids_rdv = ?,
                poids_favoris = ?, poids_popularite = ?, poids_nouveaute = ?,
                jours_historique = ?, cache_minutes = ?
            WHERE id = 1
        ");
        return $stmt->execute([
            !empty($data['actif']) ? 1 : 0,
            intval($data['nb_recommandations'] ?? 6),
            floatval($data['poids_vues'] ?? 1.00),
            floatval($data['poids_reservations'] ?? 3.00),
            floatval($data['poids_rdv'] ?? 3.00),
            floatval($data['poids_favoris'] ?? 5.00),
            floatval($data['poids_popularite'] ?? 0.50),
            floatval($data['poids_nouveaute'] ?? 0.30),
            intval($data['jours_historique'] ?? 90),
            intval($data['cache_minutes'] ?? 30),
        ]);
    }

    // =====================================================
    // TRACKING
    // =====================================================

    public function enregistrerInteraction($clientId, $serviceId, $type = 'vue', $dureeSecondes = null, $source = 'direct', $metadata = null)
    {
        if (!$clientId || !$serviceId) return false;

        $config = $this->getConfig();
        if (!$config || !$config['actif']) return false;

        $typesValides = ['vue', 'reservation', 'rdv', 'favori', 'partage', 'recherche'];
        if (!in_array($type, $typesValides)) $type = 'vue';

        $poids = 1.00;
        switch ($type) {
            case 'reservation':
            case 'rdv':       $poids = floatval($config['poids_reservations']); break;
            case 'favori':    $poids = floatval($config['poids_favoris']); break;
            case 'partage':   $poids = 2.00; break;
            case 'recherche': $poids = 1.50; break;
            default:          $poids = floatval($config['poids_vues']);
        }
        if ($type === 'vue' && $dureeSecondes !== null && $dureeSecondes > 30) {
            $poids *= 1.0 + min(2.0, $dureeSecondes / 120.0);
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO reco_interactions 
                (client_id, service_id, type_interaction, poids, duree_secondes, source, metadata) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $clientId, $serviceId, $type, $poids, $dureeSecondes, $source,
                $metadata ? json_encode($metadata) : null,
            ]);

            // Incrémenter la colonne `vues` de forfaits si c'est une vue
            if ($type === 'vue') {
                try {
                    $stmt2 = $this->db->prepare("
                        UPDATE " . self::TABLE_SERVICES . " 
                        SET vues = vues + 1 
                        WHERE id = ?
                    ");
                    $stmt2->execute([$serviceId]);
                } catch (Exception $e) { /* ignorer */ }
            }

            $this->invaliderCache($clientId);
            $this->mettreAJourProfil($clientId);
            return true;
        } catch (Exception $e) {
            error_log("Erreur enregistrerInteraction: " . $e->getMessage());
            return false;
        }
    }

    // =====================================================
    // MOTEUR DE RECOMMANDATION
    // =====================================================

    public function recommanderPourClient($clientId, $limite = null, $contexte = 'general')
    {
        $config = $this->getConfig();
        if (!$config || !$config['actif']) {
            return $this->recommanderPopulaires($limite ?? 6);
        }

        $limite = $limite ?? intval($config['nb_recommandations']);

        $cache = $this->lireCache($clientId, $contexte);
        if ($cache !== null) return array_slice($cache, 0, $limite);

        $recos = $this->calculerScores($clientId, $config);
        $this->ecrireCache($clientId, $recos, $contexte);
        return array_slice($recos, 0, $limite);
    }

    private function calculerScores($clientId, $config)
    {
        $joursHistorique = intval($config['jours_historique']);
        $tableServices = self::TABLE_SERVICES;

        // Forfaits déjà consommés
        $stmt = $this->db->prepare("
            SELECT DISTINCT service_id 
            FROM reco_interactions 
            WHERE client_id = ? 
              AND type_interaction IN ('reservation', 'rdv')
              AND created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
        ");
        $stmt->execute([$clientId, $joursHistorique]);
        $dejaConsommes = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // Historique personnel
        $stmt = $this->db->prepare("
            SELECT service_id, SUM(poids) AS score_historique
            FROM reco_interactions
            WHERE client_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY service_id
        ");
        $stmt->execute([$clientId, $joursHistorique]);
        $historique = [];
        while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) $historique[$r['service_id']] = $r;

        // Profil
        $stmt = $this->db->prepare("SELECT * FROM reco_profils WHERE client_id = ?");
        $stmt->execute([$clientId]);
        $profil = $stmt->fetch(PDO::FETCH_ASSOC);

        // Popularité globale
        $stmt = $this->db->prepare("
            SELECT service_id, SUM(poids) AS score_populaire
            FROM reco_interactions
            WHERE created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY service_id
        ");
        $stmt->execute([$joursHistorique]);
        $popularite = [];
        while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) $popularite[$r['service_id']] = $r;

        // Liste des forfaits avec leurs vraies colonnes + métadonnées reco_services
        $stmt = $this->db->query("
            SELECT 
                s.id, s.nom, s.duree_minutes, s.prix, s.actif, s.vues,
                '📶' AS icone,
                COALESCE(s.prix, 0) AS tarif,
                COALESCE(rs.categorie, 'wifi') AS categorie,
                rs.tags, COALESCE(rs.niveau_prix, 'standard') AS niveau_prix,
                COALESCE(rs.duree_typique, s.duree_minutes) AS duree_typique
            FROM {$tableServices} s
            LEFT JOIN reco_services rs ON rs.service_id = s.id
            WHERE s.actif = 1
        ");
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $scores = [];
        foreach ($services as $service) {
            $sid = $service['id'];
            $score = 0.0;

            // a) Historique personnel
            if (isset($historique[$sid])) {
                $score += floatval($historique[$sid]['score_historique']);
            }

            // b) Pénalité si déjà consommé
            if (in_array($sid, $dejaConsommes)) {
                $score *= 0.3;
            }

            // c) Popularité globale (reco_interactions + vues natives de forfaits)
            if (isset($popularite[$sid])) {
                $score += floatval($popularite[$sid]['score_populaire']) * floatval($config['poids_popularite']) / 10.0;
            }
            // Bonus vues natives (de la colonne `vues`)
            $score += min(5.0, intval($service['vues']) / 50.0) * floatval($config['poids_popularite']);

            // d) Affinité profil
            if ($profil) {
                if (!empty($profil['categorie_preferee']) && $service['categorie'] === $profil['categorie_preferee']) $score += 5.0;
                if (!empty($profil['niveau_prix_prefere']) && $service['niveau_prix'] === $profil['niveau_prix_prefere']) $score += 3.0;
            }

            // e) Nouveauté
            $score += floatval($config['poids_nouveaute']);

            // f) Aléatoire léger
            $score += mt_rand(0, 100) / 100.0;

            $scores[] = ['service' => $service, 'score' => round($score, 4)];
        }

        usort($scores, fn($a, $b) => $b['score'] <=> $a['score']);
        return $scores;
    }

    public function recommanderPopulaires($limite = 6)
    {
        $config = $this->getConfig();
        $joursHistorique = $config ? intval($config['jours_historique']) : 90;
        $tableServices = self::TABLE_SERVICES;

        $stmt = $this->db->prepare("
            SELECT 
                s.id, s.nom, s.duree_minutes, s.prix, s.vues,
                '📶' AS icone,
                COALESCE(s.prix, 0) AS tarif,
                COALESCE(rs.categorie, 'wifi') AS categorie,
                rs.tags, COALESCE(rs.niveau_prix, 'standard') AS niveau_prix,
                COALESCE(rs.duree_typique, s.duree_minutes) AS duree_typique,
                (COALESCE(SUM(i.poids), 0) + s.vues) AS score_populaire
            FROM {$tableServices} s
            LEFT JOIN reco_services rs ON rs.service_id = s.id
            LEFT JOIN reco_interactions i 
                ON i.service_id = s.id 
                AND i.created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
            WHERE s.actif = 1
            GROUP BY s.id
            ORDER BY score_populaire DESC, s.id DESC
            LIMIT ?
        ");
        $stmt->bindValue(1, $joursHistorique, PDO::PARAM_INT);
        $stmt->bindValue(2, $limite, PDO::PARAM_INT);
        $stmt->execute();

        $result = [];
        while ($s = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $result[] = ['service' => $s, 'score' => floatval($s['score_populaire'])];
        }
        return $result;
    }

    // =====================================================
    // PROFIL CLIENT
    // =====================================================

    public function mettreAJourProfil($clientId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT rs.categorie, SUM(i.poids) AS total
                FROM reco_interactions i
                JOIN reco_services rs ON rs.service_id = i.service_id
                WHERE i.client_id = ?
                GROUP BY rs.categorie
                ORDER BY total DESC LIMIT 1
            ");
            $stmt->execute([$clientId]);
            $categoriePref = $stmt->fetch(PDO::FETCH_ASSOC)['categorie'] ?? null;

            $stmt = $this->db->prepare("
                SELECT COUNT(*) AS nb, MAX(created_at) AS derniere
                FROM reco_interactions WHERE client_id = ?
            ");
            $stmt->execute([$clientId]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);

            $stmt = $this->db->prepare("
                INSERT INTO reco_profils 
                (client_id, categorie_preferee, nb_interactions, derniere_interaction)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    categorie_preferee = VALUES(categorie_preferee),
                    nb_interactions = VALUES(nb_interactions),
                    derniere_interaction = VALUES(derniere_interaction)
            ");
            $stmt->execute([
                $clientId, $categoriePref,
                intval($stats['nb'] ?? 0), $stats['derniere'] ?? null,
            ]);
            return true;
        } catch (Exception $e) {
            error_log("Erreur mettreAJourProfil: " . $e->getMessage());
            return false;
        }
    }

    public function getProfil($clientId)
    {
        $stmt = $this->db->prepare("SELECT * FROM reco_profils WHERE client_id = ?");
        $stmt->execute([$clientId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // =====================================================
    // CACHE
    // =====================================================

    private function lireCache($clientId, $contexte)
    {
        $stmt = $this->db->prepare("
            SELECT recommandations FROM reco_cache
            WHERE client_id = ? AND contexte = ? AND expire_le > NOW()
        ");
        $stmt->execute([$clientId, $contexte]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) return null;
        $data = json_decode($row['recommandations'], true);
        return is_array($data) ? $data : null;
    }

    private function ecrireCache($clientId, $recos, $contexte)
    {
        $config = $this->getConfig();
        $minutes = $config ? intval($config['cache_minutes']) : 30;
        try {
            $stmt = $this->db->prepare("
                INSERT INTO reco_cache (client_id, recommandations, contexte, expire_le)
                VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))
                ON DUPLICATE KEY UPDATE
                    recommandations = VALUES(recommandations),
                    expire_le = VALUES(expire_le)
            ");
            $stmt->execute([$clientId, json_encode($recos), $contexte, $minutes]);
        } catch (Exception $e) {
            error_log("Erreur ecrireCache: " . $e->getMessage());
        }
    }

    private function invaliderCache($clientId)
    {
        $stmt = $this->db->prepare("DELETE FROM reco_cache WHERE client_id = ?");
        $stmt->execute([$clientId]);
    }

    public function viderCache()
    {
        $this->db->exec("DELETE FROM reco_cache");
        return true;
    }

    // =====================================================
    // STATS ADMIN
    // =====================================================

    public function getStats()
    {
        $stats = [];
        $stmt = $this->db->query("SELECT COUNT(*) FROM reco_interactions");
        $stats['total_interactions'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(DISTINCT client_id) FROM reco_interactions");
        $stats['clients_actifs'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM reco_interactions WHERE DATE(created_at) = CURDATE()");
        $stats['interactions_jour'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM reco_cache WHERE expire_le > NOW()");
        $stats['cache_actif'] = intval($stmt->fetchColumn());

        $tableServices = self::TABLE_SERVICES;
        $stmt = $this->db->query("
            SELECT s.nom, (COALESCE(SUM(i.poids), 0) + s.vues) AS score
            FROM {$tableServices} s
            LEFT JOIN reco_interactions i ON i.service_id = s.id
            WHERE s.actif = 1
            GROUP BY s.id
            ORDER BY score DESC
            LIMIT 5
        ");
        $stats['top_services'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $stats;
    }

    public function getInteractionsRecentes($limite = 50)
    {
        $tableServices = self::TABLE_SERVICES;
        $stmt = $this->db->prepare("
            SELECT i.*, c.nom AS client_nom, s.nom AS service_nom
            FROM reco_interactions i
            LEFT JOIN clients c ON c.id = i.client_id
            LEFT JOIN {$tableServices} s ON s.id = i.service_id
            ORDER BY i.created_at DESC
            LIMIT ?
        ");
        $stmt->bindValue(1, $limite, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // =====================================================
    // ADMIN : MÉTADONNÉES SERVICES
    // =====================================================

    public function getServicesMeta()
    {
        $tableServices = self::TABLE_SERVICES;
        $stmt = $this->db->query("
            SELECT 
                s.id, s.nom, s.duree_minutes, s.prix, s.vues, s.actif,
                rs.id AS meta_id, rs.categorie, rs.tags, 
                rs.niveau_prix, rs.pour_debutant, rs.duree_typique
            FROM {$tableServices} s
            LEFT JOIN reco_services rs ON rs.service_id = s.id
            ORDER BY s.id ASC
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function saveServiceMeta($serviceId, $data)
    {
        $stmt = $this->db->prepare("
            INSERT INTO reco_services 
            (service_id, categorie, tags, niveau_prix, pour_debutant, duree_typique, actif)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                categorie = VALUES(categorie), tags = VALUES(tags),
                niveau_prix = VALUES(niveau_prix),
                pour_debutant = VALUES(pour_debutant),
                duree_typique = VALUES(duree_typique), actif = VALUES(actif)
        ");
        return $stmt->execute([
            $serviceId,
            $data['categorie'] ?? 'wifi',
            $data['tags'] ?? null,
            $data['niveau_prix'] ?? 'standard',
            !empty($data['pour_debutant']) ? 1 : 0,
            intval($data['duree_typique'] ?? 60),
            !empty($data['actif']) ? 1 : 0,
        ]);
    }
}