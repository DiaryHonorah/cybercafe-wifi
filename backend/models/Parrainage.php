<?php
/**
 * Modèle Parrainage (V2)
 * Gestion du parrainage à plusieurs niveaux
 */

class Parrainage
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
        $stmt = $this->db->query("SELECT * FROM parrainage_config LIMIT 1");
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Trouve un client par son code de parrainage
     */
    public function trouverParCode($code)
    {
        $stmt = $this->db->prepare("SELECT * FROM clients WHERE code_parrainage = ?");
        $stmt->execute([$code]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Vérifie si un code de parrainage est valide
     */
    public function verifierCode($code)
    {
        $client = $this->trouverParCode($code);
        if (!$client) {
            throw new Exception("Code de parrainage introuvable");
        }
        return $client;
    }

    /**
     * Enregistre un nouveau parrainage (appelé lors de l'inscription)
     */
    public function enregistrerParrainage($filleulId, $codeParrain)
    {
        $config = $this->getConfig();
        if (!$config || !$config['actif']) {
            return false; // Système désactivé
        }

        $parrain = $this->trouverParCode($codeParrain);
        if (!$parrain) {
            throw new Exception("Code de parrainage invalide");
        }

        if (intval($parrain['id']) === intval($filleulId)) {
            throw new Exception("Vous ne pouvez pas vous parrainer vous-même");
        }

        try {
            $this->db->beginTransaction();

            // 1. Mettre à jour le filleul avec son parrain
            $stmt = $this->db->prepare("
                UPDATE clients 
                SET parrain_id = ?, niveau_parrainage = 1 
                WHERE id = ?
            ");
            $stmt->execute([$parrain['id'], $filleulId]);

            // 2. Créer l'entrée dans la table parrainages
            $stmt = $this->db->prepare("
                INSERT INTO parrainages 
                (parrain_id, filleul_id, code_utilise, statut) 
                VALUES (?, ?, ?, 'en_attente')
            ");
            $stmt->execute([$parrain['id'], $filleulId, $codeParrain]);
            $parrainageId = $this->db->lastInsertId();

            // 3. Incrémenter le compteur du parrain
            $stmt = $this->db->prepare("
                UPDATE clients SET total_parrainages = total_parrainages + 1 WHERE id = ?
            ");
            $stmt->execute([$parrain['id']]);

            // 4. Notifier le parrain
            $stmt = $this->db->prepare("
                INSERT INTO clients_notifications (client_id, titre, message, type) 
                VALUES (?, ?, ?, 'info')
            ");
            $stmt->execute([
                $parrain['id'],
                "🤝 Nouveau filleul !",
                "Un nouveau client s'est inscrit avec votre code de parrainage. " .
                "La récompense sera versée après validation de son premier achat.",
            ]);

            $this->db->commit();
            return $parrainageId;

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Valide un parrainage et verse les récompenses (3 niveaux)
     */
    public function valider($parrainageId, $adminId = null)
    {
        $config = $this->getConfig();

        $stmt = $this->db->prepare("
            SELECT p.*, 
                   par.id AS parrain_id, par.nom AS parrain_nom,
                   par.parrain_id AS parrain_du_parrain,
                   fill.id AS filleul_id, fill.nom AS filleul_nom
            FROM parrainages p
            JOIN clients par ON par.id = p.parrain_id
            JOIN clients fill ON fill.id = p.filleul_id
            WHERE p.id = ? AND p.statut = 'en_attente'
        ");
        $stmt->execute([$parrainageId]);
        $p = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$p) {
            throw new Exception("Parrainage introuvable ou déjà validé");
        }

        try {
            $this->db->beginTransaction();

            // 1. Marquer le parrainage comme validé
            $stmt = $this->db->prepare("
                UPDATE parrainages 
                SET statut = 'valide', date_validation = NOW(), admin_id = ? 
                WHERE id = ?
            ");
            $stmt->execute([$adminId, $parrainageId]);

            // 2. Verser la récompense au parrain (niveau 1)
            $this->verserBonus(
                $p['parrain_id'],
                floatval($config['recompense_parrain']),
                'parrainage_parrain',
                "Récompense parrainage - {$p['filleul_nom']}",
                $parrainageId
            );

            // 3. Verser la récompense au filleul (niveau 1)
            $this->verserBonus(
                $p['filleul_id'],
                floatval($config['recompense_filleul']),
                'parrainage_filleul',
                "Bonus de bienvenue (code parrain)",
                $parrainageId
            );

            // 4. Verser la récompense au parrain du parrain (niveau 2)
            if ($p['parrain_du_parrain'] && floatval($config['recompense_niveau_2']) > 0) {
                $this->verserBonus(
                    $p['parrain_du_parrain'],
                    floatval($config['recompense_niveau_2']),
                    'parrainage_niveau_2',
                    "Commission niveau 2 - {$p['filleul_nom']}",
                    $parrainageId
                );
            }

            // 5. Verser la récompense au niveau 3 (si applicable)
            if ($p['parrain_du_parrain'] && floatval($config['recompense_niveau_3']) > 0) {
                $stmt = $this->db->prepare("SELECT parrain_id FROM clients WHERE id = ?");
                $stmt->execute([$p['parrain_du_parrain']]);
                $niveau3Id = $stmt->fetchColumn();

                if ($niveau3Id) {
                    $this->verserBonus(
                        $niveau3Id,
                        floatval($config['recompense_niveau_3']),
                        'parrainage_niveau_3',
                        "Commission niveau 3 - {$p['filleul_nom']}",
                        $parrainageId
                    );
                }
            }

            $this->db->commit();
            return true;

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Annule un parrainage
     */
    public function annuler($parrainageId, $raison = null)
    {
        $stmt = $this->db->prepare("
            UPDATE parrainages 
            SET statut = 'annule', raison_annulation = ? 
            WHERE id = ? AND statut = 'en_attente'
        ");
        $stmt->execute([$raison, $parrainageId]);

        // Décrémenter le compteur du parrain
        $stmt = $this->db->prepare("SELECT parrain_id FROM parrainages WHERE id = ?");
        $stmt->execute([$parrainageId]);
        $parrainId = $stmt->fetchColumn();

        if ($parrainId) {
            $stmt = $this->db->prepare("
                UPDATE clients SET total_parrainages = GREATEST(0, total_parrainages - 1) WHERE id = ?
            ");
            $stmt->execute([$parrainId]);
        }

        return true;
    }

    /**
     * Verse un bonus au solde d'un client
     */
    private function verserBonus($clientId, $montant, $type, $description, $referenceId = null)
    {
        if ($montant <= 0) return;

        // Mettre à jour le solde
        $stmt = $this->db->prepare("
            UPDATE clients SET solde_bonus = COALESCE(solde_bonus, 0) + ? WHERE id = ?
        ");
        $stmt->execute([$montant, $clientId]);

        // Ajouter la transaction dans l'historique
        $stmt = $this->db->prepare("
            INSERT INTO bonus_transactions 
            (client_id, type, sens, montant, solde_avant, solde_apres, description, reference_id) 
            SELECT ?, ?, 'credit', ?, 
                   COALESCE((SELECT solde_bonus FROM clients WHERE id = ?), 0) - ?,
                   COALESCE((SELECT solde_bonus FROM clients WHERE id = ?), 0),
                   ?, ?
        ");
        $stmt->execute([
            $clientId, $type, $montant,
            $clientId, $montant,
            $clientId, $description, $referenceId
        ]);

        // Notification
        $stmt = $this->db->prepare("
            INSERT INTO clients_notifications (client_id, titre, message, type) 
            VALUES (?, ?, ?, 'success')
        ");
        $stmt->execute([
            $clientId,
            "💰 Bonus parrainage",
            "Vous avez reçu " . number_format($montant, 0, ',', ' ') . " Ar : " . $description,
        ]);
    }

    /**
     * Récupère les stats complètes du parrainage pour un client
     */
    public function mesStats($clientId)
    {
        $config = $this->getConfig();

        // Info client (code parrainage)
        $stmt = $this->db->prepare("
            SELECT code_parrainage, total_parrainages, solde_bonus 
            FROM clients WHERE id = ?
        ");
        $stmt->execute([$clientId]);
        $client = $stmt->fetch(PDO::FETCH_ASSOC);

        // Parrainages directs
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM parrainages WHERE parrain_id = ?
        ");
        $stmt->execute([$clientId]);
        $total = intval($stmt->fetchColumn());

        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM parrainages WHERE parrain_id = ? AND statut = 'valide'
        ");
        $stmt->execute([$clientId]);
        $valides = intval($stmt->fetchColumn());

        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM parrainages WHERE parrain_id = ? AND statut = 'en_attente'
        ");
        $stmt->execute([$clientId]);
        $enAttente = intval($stmt->fetchColumn());

        // Total gagné
        $stmt = $this->db->prepare("
            SELECT COALESCE(SUM(montant), 0) FROM bonus_transactions 
            WHERE client_id = ? AND (type LIKE 'parrainage%' OR type LIKE 'parrainage_niveau%')
        ");
        $stmt->execute([$clientId]);
        $totalGagne = floatval($stmt->fetchColumn());

        // Liste des filleuls (niveau 1)
        $stmt = $this->db->prepare("
            SELECT p.*, c.nom AS filleul_nom, c.email AS filleul_email
            FROM parrainages p
            JOIN clients c ON c.id = p.filleul_id
            WHERE p.parrain_id = ?
            ORDER BY p.created_at DESC
        ");
        $stmt->execute([$clientId]);
        $parrainages = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Filleuls de niveau 2
        $stmt = $this->db->prepare("
            SELECT c.nom AS filleul_nom, c.created_at, c.id
            FROM clients c
            JOIN clients fill ON fill.parrain_id = c.id
            WHERE c.parrain_id = ?
        ");
        $stmt->execute([$clientId]);
        $niveau2 = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Filleuls de niveau 3
        $stmt = $this->db->prepare("
            SELECT c.nom AS filleul_nom, c.created_at, c.id
            FROM clients c
            JOIN clients n2 ON n2.parrain_id = c.id
            JOIN clients n1 ON n1.parrain_id = n2.id
            WHERE n1.parrain_id = ?
        ");
        $stmt->execute([$clientId]);
        $niveau3 = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'stats' => [
                'code_parrainage' => $client['code_parrainage'] ?? null,
                'solde_bonus' => floatval($client['solde_bonus'] ?? 0),
                'total' => $total,
                'valides' => $valides,
                'en_attente' => $enAttente,
                'total_gagne' => $totalGagne,
            ],
            'parrainages' => $parrainages,
            'niveau_2' => $niveau2,
            'niveau_3' => $niveau3,
            'config' => [
                'recompense_parrain' => floatval($config['recompense_parrain']),
                'recompense_filleul' => floatval($config['recompense_filleul']),
                'recompense_niveau_2' => floatval($config['recompense_niveau_2']),
                'recompense_niveau_3' => floatval($config['recompense_niveau_3']),
            ],
        ];
    }

    /**
     * Liste admin des parrainages
     */
    public function listeAdmin($filtres = [])
    {
        $sql = "SELECT p.*,
                       par.nom AS parrain_nom, par.email AS parrain_email,
                       fill.nom AS filleul_nom, fill.email AS filleul_email
                FROM parrainages p
                JOIN clients par ON par.id = p.parrain_id
                JOIN clients fill ON fill.id = p.filleul_id
                WHERE 1=1";
        $params = [];

        if (!empty($filtres['statut']) && $filtres['statut'] !== 'tous') {
            $sql .= " AND p.statut = ?";
            $params[] = $filtres['statut'];
        }

        if (!empty($filtres['recherche'])) {
            $sql .= " AND (par.nom LIKE ? OR fill.nom LIKE ? OR par.email LIKE ? OR fill.email LIKE ?)";
            $search = '%' . $filtres['recherche'] . '%';
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
        }

        $sql .= " ORDER BY 
                    CASE p.statut 
                        WHEN 'en_attente' THEN 1 
                        WHEN 'valide' THEN 2 
                        ELSE 3 
                    END,
                    p.created_at DESC 
                  LIMIT " . intval($filtres['limite'] ?? 100);

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Stats globales admin
     */
    public function statsAdmin()
    {
        $stats = [];

        $stmt = $this->db->query("SELECT COUNT(*) FROM parrainages");
        $stats['total'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM parrainages WHERE statut = 'en_attente'");
        $stats['en_attente'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM parrainages WHERE statut = 'valide'");
        $stats['valides'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COALESCE(SUM(montant), 0) FROM bonus_transactions 
            WHERE type LIKE 'parrainage%'
        ");
        $stats['total_verse'] = floatval($stmt->fetchColumn());

        return $stats;
    }
}