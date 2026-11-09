<?php
/**
 * Modèle Leaderboard
 * Calcul et gestion du classement
 */

class Leaderboard
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
        $stmt = $this->db->query("SELECT * FROM leaderboard_config LIMIT 1");
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Calcule le score d'un client pour un mois donné
     */
    private function calculerScoreClient($clientId, $mois, $config)
    {
        $debut = $mois . '-01 00:00:00';
        $fin = date('Y-m-t 23:59:59', strtotime($debut));

        // Réservations terminées du mois
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM reservations 
            WHERE (email = (SELECT email FROM clients WHERE id = ?) 
                OR telephone = (SELECT telephone FROM clients WHERE id = ?))
            AND statut = 'terminee'
            AND date_reservation BETWEEN ? AND ?
        ");
        $stmt->execute([$clientId, $clientId, $mois . '-01', $fin]);
        $reservations = intval($stmt->fetchColumn());

        // Parrainages validés du mois
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM parrainages 
            WHERE parrain_id = ? 
            AND statut = 'valide'
            AND date_validation BETWEEN ? AND ?
        ");
        $stmt->execute([$clientId, $debut, $fin]);
        $parrainages = intval($stmt->fetchColumn());

        // Points fidélité gagnés ce mois
        $stmt = $this->db->prepare("
            SELECT COALESCE(SUM(points), 0) FROM historique_points 
            WHERE carte_id IN (
                SELECT id FROM cartes_fidelite 
                WHERE client_telephone = (SELECT telephone FROM clients WHERE id = ?)
            )
            AND points > 0
            AND created_at BETWEEN ? AND ?
        ");
        $stmt->execute([$clientId, $debut, $fin]);
        $pointsFidelite = intval($stmt->fetchColumn());

        // Bonus gagnés ce mois
        $stmt = $this->db->prepare("
            SELECT COALESCE(SUM(montant), 0) FROM bonus_transactions 
            WHERE client_id = ?
            AND sens = 'credit'
            AND created_at BETWEEN ? AND ?
        ");
        $stmt->execute([$clientId, $debut, $fin]);
        $bonusGagnes = floatval($stmt->fetchColumn());

        // Score composite
        $score = 
            ($reservations * intval($config['poids_reservations'])) +
            ($parrainages * intval($config['poids_parrainages'])) +
            ($pointsFidelite * intval($config['poids_points_fidelite'])) +
            (intval($bonusGagnes / 100) * intval($config['poids_bonus_gagnes']));

        return [
            'client_id' => $clientId,
            'reservations' => $reservations,
            'parrainages' => $parrainages,
            'points_fidelite' => $pointsFidelite,
            'bonus_gagnes' => $bonusGagnes,
            'score' => $score,
        ];
    }

    /**
     * Classement pour un mois donné
     */
    public function classement($mois = null, $limite = 10)
    {
        if (!$mois) $mois = date('Y-m');

        $config = $this->getConfig();
        if (!$config || !$config['actif']) {
            return [];
        }

        // Récupérer tous les clients actifs
        $stmt = $this->db->query("
            SELECT id, nom, email, telephone 
            FROM clients 
            WHERE actif = 1
        ");
        $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $scores = [];
        foreach ($clients as $client) {
            $resultat = $this->calculerScoreClient($client['id'], $mois, $config);
            if ($resultat['score'] > 0) {
                $resultat['nom'] = $client['nom'];
                // Masquer une partie du nom pour la vie privée
                $resultat['nom_affiche'] = $this->masquerNom($client['nom']);
                $scores[] = $resultat;
            }
        }

        // Trier par score décroissant
        usort($scores, function($a, $b) {
            return $b['score'] - $a['score'];
        });

        // Ajouter la position
        $classement = [];
        foreach (array_slice($scores, 0, $limite) as $i => $score) {
            $score['position'] = $i + 1;
            $classement[] = $score;
        }

        return $classement;
    }

    /**
     * Masque le nom pour la vie privée (ex: "Rakoto Jean" -> "Rakoto J.")
     */
    private function masquerNom($nom)
    {
        $parts = explode(' ', trim($nom));
        if (count($parts) === 1) {
            return $parts[0];
        }
        $prenom = $parts[0];
        $initiale = mb_substr($parts[1], 0, 1);
        return $prenom . ' ' . $initiale . '.';
    }

    /**
     * Ma position dans le classement
     */
    public function maPosition($clientId, $mois = null)
    {
        if (!$mois) $mois = date('Y-m');
        
        $classement = $this->classement($mois, 1000); // Tous les actifs
        foreach ($classement as $c) {
            if (intval($c['client_id']) === intval($clientId)) {
                return $c;
            }
        }

        // Pas dans le classement (score 0)
        $config = $this->getConfig();
        $resultat = $this->calculerScoreClient($clientId, $mois, $config);
        $resultat['position'] = null;
        return $resultat;
    }

    /**
     * Historique des gagnants (mois précédents)
     */
    public function historiqueGagnants($limiteMois = 6)
    {
        $stmt = $this->db->prepare("
            SELECT g.*, c.nom AS client_nom
            FROM leaderboard_gagnants g
            JOIN clients c ON c.id = g.client_id
            WHERE g.position <= 3
            ORDER BY g.mois_annee DESC, g.position ASC
            LIMIT ?
        ");
        $stmt->bindValue(1, $limiteMois * 3, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Archivage des gagnants du mois (à appeler en fin de mois)
     */
    public function archiverGagnants($mois = null)
    {
        if (!$mois) $mois = date('Y-m', strtotime('-1 month'));

        $config = $this->getConfig();
        $classement = $this->classement($mois, 10);

        if (empty($classement)) return 0;

        $recompenses = [
            1 => floatval($config['recompense_1er']),
            2 => floatval($config['recompense_2eme']),
            3 => floatval($config['recompense_3eme']),
        ];

        $count = 0;
        foreach ($classement as $c) {
            try {
                $recompense = $recompenses[$c['position']] ?? 0;

                $stmt = $this->db->prepare("
                    INSERT INTO leaderboard_gagnants 
                    (client_id, mois_annee, position, score, reservations, 
                     parrainages, points_fidelite, bonus_gagnes, recompense_versee, recompense_verse_le) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        score = VALUES(score),
                        position = VALUES(position)
                ");
                $stmt->execute([
                    $c['client_id'],
                    $mois,
                    $c['position'],
                    $c['score'],
                    $c['reservations'],
                    $c['parrainages'],
                    $c['points_fidelite'],
                    $c['bonus_gagnes'],
                    $recompense,
                    $recompense > 0 ? date('Y-m-d H:i:s') : null,
                ]);

                // Verser la récompense
                if ($recompense > 0 && $config['verser_recompenses_auto']) {
                    $stmt = $this->db->prepare("
                        UPDATE clients SET solde_bonus = solde_bonus + ? WHERE id = ?
                    ");
                    $stmt->execute([$recompense, $c['client_id']]);

                    // Ajouter une transaction
                    $stmt = $this->db->prepare("
                        INSERT INTO bonus_transactions 
                        (client_id, type, sens, montant, solde_avant, solde_apres, description) 
                        SELECT ?, 'bonus_manuel', 'credit', ?, 
                               COALESCE((SELECT solde_bonus FROM clients WHERE id = ?), 0) - ?,
                               COALESCE((SELECT solde_bonus FROM clients WHERE id = ?), 0),
                               ?
                    ");
                    $stmt->execute([
                        $c['client_id'],
                        $recompense,
                        $c['client_id'],
                        $recompense,
                        $c['client_id'],
                        "🏆 Récompense classement ($mois) - Position #{$c['position']}",
                    ]);

                    // Notification
                    $stmt = $this->db->prepare("
                        INSERT INTO clients_notifications (client_id, titre, message, type) 
                        VALUES (?, ?, ?, 'success')
                    ");
                    $stmt->execute([
                        $c['client_id'],
                        "🏆 Félicitations !",
                        "Vous avez terminé #{$c['position']} du classement $mois ! +" . number_format($recompense, 0, ',', ' ') . " Ar ajoutés à votre solde bonus.",
                    ]);
                }

                $count++;
            } catch (Exception $e) {
                error_log("Erreur archivage gagnant: " . $e->getMessage());
            }
        }

        return $count;
    }

    /**
     * Mettre à jour la config
     */
    public function updateConfig($data)
    {
        $stmt = $this->db->prepare("
            UPDATE leaderboard_config SET
                actif = ?,
                afficher_public = ?,
                afficher_accueil = ?,
                titre = ?,
                description = ?,
                poids_reservations = ?,
                poids_parrainages = ?,
                poids_points_fidelite = ?,
                poids_bonus_gagnes = ?,
                recompense_1er = ?,
                recompense_2eme = ?,
                recompense_3eme = ?,
                verser_recompenses_auto = ?
            WHERE id = 1
        ");
        return $stmt->execute([
            !empty($data['actif']) ? 1 : 0,
            !empty($data['afficher_public']) ? 1 : 0,
            !empty($data['afficher_accueil']) ? 1 : 0,
            $data['titre'] ?? 'Classement du mois',
            $data['description'] ?? '',
            intval($data['poids_reservations'] ?? 10),
            intval($data['poids_parrainages'] ?? 50),
            intval($data['poids_points_fidelite'] ?? 1),
            intval($data['poids_bonus_gagnes'] ?? 1),
            floatval($data['recompense_1er'] ?? 5000),
            floatval($data['recompense_2eme'] ?? 3000),
            floatval($data['recompense_3eme'] ?? 1000),
            !empty($data['verser_recompenses_auto']) ? 1 : 0,
        ]);
    }

    /**
     * Statistiques globales
     */
    public function stats()
    {
        $stats = [];

        $stmt = $this->db->query("SELECT COUNT(*) FROM leaderboard_gagnants");
        $stats['total_gagnants'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COUNT(DISTINCT mois_annee) FROM leaderboard_gagnants
        ");
        $stats['nb_mois_archives'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COALESCE(SUM(recompense_versee), 0) FROM leaderboard_gagnants
        ");
        $stats['total_recompenses'] = floatval($stmt->fetchColumn());

        return $stats;
    }
}