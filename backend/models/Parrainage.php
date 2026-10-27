<?php
/**
 * Modèle Parrainage
 * Gestion du système de parrainage
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

    /**
     * Récupère la configuration
     */
    public function getConfig()
    {
        $stmt = $this->db->query("SELECT * FROM parrainage_config LIMIT 1");
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Génère un code de parrainage unique
     */
    public function genererCode()
    {
        $caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $code = 'PAR-';
        for ($i = 0; $i < 6; $i++) {
            $code .= $caracteres[random_int(0, strlen($caracteres) - 1)];
        }

        // Vérifier unicité
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM clients WHERE code_parrainage = ?");
        $stmt->execute([$code]);
        if ($stmt->fetchColumn() > 0) {
            return $this->genererCode();
        }

        return $code;
    }

    /**
     * Assigne un code de parrainage à un client (si pas déjà)
     */
    public function assurerCodeParrainage($clientId)
    {
        $stmt = $this->db->prepare("SELECT code_parrainage FROM clients WHERE id = ?");
        $stmt->execute([$clientId]);
        $code = $stmt->fetchColumn();

        if (empty($code)) {
            $code = $this->genererCode();
            $stmt = $this->db->prepare("UPDATE clients SET code_parrainage = ? WHERE id = ?");
            $stmt->execute([$code, $clientId]);
        }

        return $code;
    }

    /**
     * Traite un parrainage lors de l'inscription
     * 
     * @param int $filleulId ID du nouveau client
     * @param string $codeUtilise Code de parrainage utilisé
     * @return array|null Info du parrainage
     */
    public function traiterParrainage($filleulId, $codeUtilise)
    {
        if (empty($codeUtilise)) return null;

        $config = $this->getConfig();
        if (!$config || !$config['actif']) return null;

        // Trouver le parrain par son code
        $codeUtilise = strtoupper(trim($codeUtilise));
        $stmt = $this->db->prepare("SELECT * FROM clients WHERE code_parrainage = ?");
        $stmt->execute([$codeUtilise]);
        $parrain = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$parrain) {
            throw new Exception("Code de parrainage invalide");
        }

        if (intval($parrain['id']) === intval($filleulId)) {
            throw new Exception("Vous ne pouvez pas vous parrainer vous-même");
        }

        // Vérifier limite du parrain
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM parrainages 
            WHERE parrain_id = ? AND statut IN ('en_attente', 'valide')
        ");
        $stmt->execute([$parrain['id']]);
        if (intval($stmt->fetchColumn()) >= intval($config['max_parrainages'])) {
            throw new Exception("Ce parrain a atteint sa limite de parrainages");
        }

        // Vérifier que le filleul n'a pas déjà un parrainage
        $stmt = $this->db->prepare("SELECT id FROM parrainages WHERE filleul_id = ?");
        $stmt->execute([$filleulId]);
        if ($stmt->fetch()) {
            throw new Exception("Ce client a déjà été parrainé");
        }

        // Créer le parrainage
        $statut = $config['validation_auto'] ? 'valide' : 'en_attente';
        $dateValidation = $config['validation_auto'] ? date('Y-m-d H:i:s') : null;

        $stmt = $this->db->prepare("
            INSERT INTO parrainages 
            (parrain_id, filleul_id, code_utilise, recompense_parrain, recompense_filleul, statut, date_validation) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $parrain['id'],
            $filleulId,
            $codeUtilise,
            $config['bonus_parrain'],
            $config['bonus_filleul'],
            $statut,
            $dateValidation,
        ]);

        $parrainageId = $this->db->lastInsertId();

        // Si validation auto, créditer les bonus
        if ($statut === 'valide') {
            $this->crediterBonus($parrain['id'], $config['bonus_parrain']);
            $this->crediterBonus($filleulId, $config['bonus_filleul']);

            // Notifications
            $this->envoyerNotification(
                $parrain['id'],
                "🎁 Nouveau parrainage validé !",
                "Félicitations ! Vous avez gagné " . number_format($config['bonus_parrain'], 0, ',', ' ') . " Ar car un filleul a rejoint avec votre code.",
                'success'
            );

            $this->envoyerNotification(
                $filleulId,
                "🎁 Bienvenue + bonus de parrainage !",
                "Vous avez reçu " . number_format($config['bonus_filleul'], 0, ',', ' ') . " Ar grâce au parrainage. Bon shopping !",
                'success'
            );
        }

        return $this->trouverParId($parrainageId);
    }

    /**
     * Crédite un bonus au solde du client
     */
    private function crediterBonus($clientId, $montant)
    {
        $stmt = $this->db->prepare("
            UPDATE clients 
            SET solde_bonus = solde_bonus + ? 
            WHERE id = ?
        ");
        return $stmt->execute([$montant, $clientId]);
    }

    /**
     * Envoie une notification au client
     */
    private function envoyerNotification($clientId, $titre, $message, $type = 'info')
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO clients_notifications (client_id, titre, message, type) 
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$clientId, $titre, $message, $type]);
        } catch (Exception $e) {
            // Silencieux
        }
    }

    /**
     * Trouve un parrainage par ID
     */
    public function trouverParId($id)
    {
        $stmt = $this->db->prepare("
            SELECT p.*, 
                cp.nom AS parrain_nom, cp.email AS parrain_email,
                cf.nom AS filleul_nom, cf.email AS filleul_email
            FROM parrainages p
            JOIN clients cp ON cp.id = p.parrain_id
            JOIN clients cf ON cf.id = p.filleul_id
            WHERE p.id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Liste les parrainages d'un client (comme parrain)
     */
    public function mesParrainages($clientId)
    {
        $stmt = $this->db->prepare("
            SELECT p.*, 
                c.nom AS filleul_nom, c.email AS filleul_email
            FROM parrainages p
            JOIN clients c ON c.id = p.filleul_id
            WHERE p.parrain_id = ?
            ORDER BY p.created_at DESC
        ");
        $stmt->execute([$clientId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Statistiques pour un client
     */
    public function mesStats($clientId)
    {
        $stats = [];

        $stmt = $this->db->prepare("
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) AS valides,
                SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) AS en_attente,
                SUM(CASE WHEN statut = 'valide' THEN recompense_parrain ELSE 0 END) AS total_gagne
            FROM parrainages 
            WHERE parrain_id = ?
        ");
        $stmt->execute([$clientId]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        // Solde bonus actuel
        $stmt = $this->db->prepare("SELECT solde_bonus, code_parrainage FROM clients WHERE id = ?");
        $stmt->execute([$clientId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['solde_bonus'] = floatval($row['solde_bonus'] ?? 0);
        $stats['code_parrainage'] = $row['code_parrainage'] ?? null;

        return $stats;
    }

    /**
     * Valider manuellement un parrainage (ADMIN)
     */
    public function valider($id)
    {
        $parrainage = $this->trouverParId($id);
        if (!$parrainage) {
            throw new Exception("Parrainage introuvable");
        }

        if ($parrainage['statut'] !== 'en_attente') {
            throw new Exception("Ce parrainage est déjà traité");
        }

        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                UPDATE parrainages 
                SET statut = 'valide', date_validation = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$id]);

            $this->crediterBonus($parrainage['parrain_id'], $parrainage['recompense_parrain']);
            $this->crediterBonus($parrainage['filleul_id'], $parrainage['recompense_filleul']);

            $this->envoyerNotification(
                $parrainage['parrain_id'],
                "🎁 Parrainage validé !",
                "Vous avez gagné " . number_format($parrainage['recompense_parrain'], 0, ',', ' ') . " Ar",
                'success'
            );

            $this->envoyerNotification(
                $parrainage['filleul_id'],
                "🎁 Bonus de parrainage !",
                "Vous avez reçu " . number_format($parrainage['recompense_filleul'], 0, ',', ' ') . " Ar",
                'success'
            );

            $this->db->commit();
            return true;

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Annuler un parrainage (ADMIN)
     */
    public function annuler($id)
    {
        $stmt = $this->db->prepare("UPDATE parrainages SET statut = 'annule' WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Liste tous les parrainages (ADMIN)
     */
    public function liste($filtres = [])
    {
        $sql = "SELECT p.*, 
                    cp.nom AS parrain_nom, cp.email AS parrain_email,
                    cf.nom AS filleul_nom, cf.email AS filleul_email
                FROM parrainages p
                JOIN clients cp ON cp.id = p.parrain_id
                JOIN clients cf ON cf.id = p.filleul_id
                WHERE 1=1";
        $params = [];

        if (!empty($filtres['statut'])) {
            $sql .= " AND p.statut = ?";
            $params[] = $filtres['statut'];
        }

        if (!empty($filtres['recherche'])) {
            $sql .= " AND (cp.nom LIKE ? OR cf.nom LIKE ? OR p.code_utilise LIKE ?)";
            $search = '%' . $filtres['recherche'] . '%';
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
        }

        $sql .= " ORDER BY p.created_at DESC LIMIT 100";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Statistiques globales (ADMIN)
     */
    public function statsGlobales()
    {
        $stats = [];

        $stmt = $this->db->query("SELECT COUNT(*) FROM parrainages");
        $stats['total'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM parrainages WHERE statut = 'valide'");
        $stats['valides'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM parrainages WHERE statut = 'en_attente'");
        $stats['en_attente'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT SUM(recompense_parrain + recompense_filleul) 
            FROM parrainages WHERE statut = 'valide'
        ");
        $stats['total_distribue'] = floatval($stmt->fetchColumn() ?: 0);

        return $stats;
    }
}