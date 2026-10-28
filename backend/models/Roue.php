<?php
/**
 * Modèle Roue
 * Gestion de la roue de la fortune
 */

class Roue
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
     * Récupère la configuration
     */
    public function getConfig()
    {
        $stmt = $this->db->query("SELECT * FROM roue_config LIMIT 1");
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Liste tous les lots actifs
     */
    public function listeLots()
    {
        $stmt = $this->db->query("
            SELECT * FROM roue_lots 
            WHERE actif = 1 
            ORDER BY ordre ASC
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Vérifie si le client peut jouer
     */
    public function peutJouer($clientId)
    {
        $config = $this->getConfig();
        if (!$config || !$config['actif']) {
            return [
                'peut_jouer' => false,
                'raison' => 'La roue est temporairement désactivée',
            ];
        }

        // Compter les tours ce mois
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM roue_tours 
            WHERE client_id = ? 
            AND MONTH(created_at) = MONTH(CURRENT_DATE())
            AND YEAR(created_at) = YEAR(CURRENT_DATE())
        ");
        $stmt->execute([$clientId]);
        $toursMois = intval($stmt->fetchColumn());
        $limite = intval($config['limite_par_mois']);

        if ($toursMois >= $limite) {
            return [
                'peut_jouer' => false,
                'raison' => "Vous avez déjà joué {$toursMois} fois ce mois-ci. Limite : {$limite} par mois.",
                'tours_mois' => $toursMois,
                'limite' => $limite,
            ];
        }

        return [
            'peut_jouer' => true,
            'tours_mois' => $toursMois,
            'limite' => $limite,
            'tours_restants' => $limite - $toursMois,
        ];
    }

    /**
     * Tire un lot au hasard selon les probabilités
     */
    public function tirerLot()
    {
        $lots = $this->listeLots();
        
        if (empty($lots)) {
            throw new Exception("Aucun lot configuré");
        }

        // Calculer le total des probabilités
        $totalProbas = 0;
        foreach ($lots as $lot) {
            $totalProbas += intval($lot['probabilite']);
        }

        // Tirer un nombre entre 1 et totalProbas
        $tirage = random_int(1, $totalProbas);

        // Trouver le lot
        $cumul = 0;
        foreach ($lots as $lot) {
            $cumul += intval($lot['probabilite']);
            if ($tirage <= $cumul) {
                return $lot;
            }
        }

        // Fallback (ne devrait pas arriver)
        return $lots[0];
    }

    /**
     * Joue un tour pour un client
     */
    public function jouer($clientId)
    {
        // Vérifier si peut jouer
        $peutJouer = $this->peutJouer($clientId);
        if (!$peutJouer['peut_jouer']) {
            throw new Exception($peutJouer['raison']);
        }

        // Tirer un lot
        $lot = $this->tirerLot();

        // Calculer la récompense
        $recompense = 0;
        if ($lot['type'] === 'bonus_ar') {
            $recompense = floatval($lot['valeur']);
        } elseif ($lot['type'] === 'heure_gratuite') {
            // 1h gratuite = 500 Ar
            $recompense = floatval($lot['valeur']) * 500;
        }
        // Reduction, perdu, cadeau → pas de bonus direct

        try {
            $this->db->beginTransaction();

            // Enregistrer le tour
            $stmt = $this->db->prepare("
                INSERT INTO roue_tours 
                (client_id, lot_id, lot_nom, lot_type, lot_valeur, recompense_versee) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $clientId,
                $lot['id'],
                $lot['nom'],
                $lot['type'],
                $lot['valeur'],
                $recompense,
            ]);

            $tourId = $this->db->lastInsertId();

            // Verser la récompense
            if ($recompense > 0) {
                $stmt = $this->db->prepare("
                    UPDATE clients 
                    SET solde_bonus = solde_bonus + ? 
                    WHERE id = ?
                ");
                $stmt->execute([$recompense, $clientId]);

                // Notification
                $stmt = $this->db->prepare("
                    INSERT INTO clients_notifications (client_id, titre, message, type) 
                    VALUES (?, ?, ?, 'success')
                ");
                $stmt->execute([
                    $clientId,
                    "🎡 Roue de la fortune !",
                    "Vous avez gagné « {$lot['icone']} {$lot['nom']} » ! +{$recompense} Ar ajoutés à votre solde.",
                ]);
            } else {
                // Notification même si perdu
                $stmt = $this->db->prepare("
                    INSERT INTO clients_notifications (client_id, titre, message, type) 
                    VALUES (?, ?, ?, 'info')
                ");
                $stmt->execute([
                    $clientId,
                    "🎡 Roue de la fortune",
                    "Résultat : {$lot['icone']} {$lot['nom']}",
                ]);
            }

            $this->db->commit();

            return [
                'success' => true,
                'lot' => $lot,
                'recompense' => $recompense,
                'tour_id' => $tourId,
                'peut_rejouer' => $this->peutJouer($clientId),
            ];

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Historique des tours d'un client
     */
    public function monHistorique($clientId, $limite = 20)
    {
        $stmt = $this->db->prepare("
            SELECT * FROM roue_tours 
            WHERE client_id = ? 
            ORDER BY created_at DESC 
            LIMIT " . intval($limite)
        );
        $stmt->execute([$clientId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Statistiques globales (ADMIN)
     */
    public function stats()
    {
        $stats = [];

        $stmt = $this->db->query("SELECT COUNT(*) FROM roue_tours");
        $stats['total_tours'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COUNT(DISTINCT client_id) FROM roue_tours
        ");
        $stats['clients_participants'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COALESCE(SUM(recompense_versee), 0) FROM roue_tours
        ");
        $stats['total_distribue'] = floatval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COUNT(*) FROM roue_tours 
            WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
            AND YEAR(created_at) = YEAR(CURRENT_DATE())
        ");
        $stats['tours_mois'] = intval($stmt->fetchColumn());

        return $stats;
    }
}