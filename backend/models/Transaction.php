<?php
/**
 * Modèle Transaction
 * Gestion de l'historique des mouvements de bonus
 */

class Transaction
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
    // CRÉATION D'UNE TRANSACTION
    // =====================================================

    /**
     * Enregistre une transaction et met à jour le solde
     * 
     * @param int $clientId
     * @param string $type Type de transaction
     * @param string $sens 'credit' ou 'debit'
     * @param float $montant
     * @param string $description
     * @param array $options (reference_type, reference_id, metadata)
     * @return array Info de la transaction
     */
    public function enregistrer($clientId, $type, $sens, $montant, $description, $options = [])
    {
        $montant = floatval($montant);

        if ($montant <= 0) {
            throw new Exception("Le montant doit être positif");
        }

        if (!in_array($sens, ['credit', 'debit'])) {
            throw new Exception("Le sens doit être 'credit' ou 'debit'");
        }

        try {
            $this->db->beginTransaction();

            // Récupérer le solde actuel
            $stmt = $this->db->prepare("SELECT solde_bonus FROM clients WHERE id = ? FOR UPDATE");
            $stmt->execute([$clientId]);
            $soldeActuel = floatval($stmt->fetchColumn());

            // Calculer le nouveau solde
            if ($sens === 'debit' && $soldeActuel < $montant) {
                throw new Exception(
                    "Solde insuffisant : " . number_format($soldeActuel, 0, ',', ' ') . 
                    " Ar disponible, " . number_format($montant, 0, ',', ' ') . " Ar demandé"
                );
            }

            $nouveauSolde = $sens === 'credit'
                ? $soldeActuel + $montant
                : $soldeActuel - $montant;

            // Mettre à jour le solde du client
            $stmt = $this->db->prepare("
                UPDATE clients SET solde_bonus = ? WHERE id = ?
            ");
            $stmt->execute([$nouveauSolde, $clientId]);

            // Enregistrer la transaction
            $stmt = $this->db->prepare("
                INSERT INTO bonus_transactions 
                (client_id, type, sens, montant, solde_avant, solde_apres, 
                 description, reference_type, reference_id, metadata) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $clientId,
                $type,
                $sens,
                $montant,
                $soldeActuel,
                $nouveauSolde,
                $description,
                $options['reference_type'] ?? null,
                $options['reference_id'] ?? null,
                !empty($options['metadata']) ? json_encode($options['metadata'], JSON_UNESCAPED_UNICODE) : null,
            ]);

            $transactionId = $this->db->lastInsertId();

            $this->db->commit();

            return [
                'id' => $transactionId,
                'montant' => $montant,
                'solde_avant' => $soldeActuel,
                'solde_apres' => $nouveauSolde,
                'sens' => $sens,
            ];

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // =====================================================
    // LECTURE
    // =====================================================

    /**
     * Historique des transactions d'un client
     */
    public function mesTransactions($clientId, $filtres = [])
    {
        $sql = "SELECT * FROM bonus_transactions WHERE client_id = ?";
        $params = [$clientId];

        if (!empty($filtres['type']) && $filtres['type'] !== 'tous') {
            $sql .= " AND type = ?";
            $params[] = $filtres['type'];
        }

        if (!empty($filtres['sens']) && $filtres['sens'] !== 'tous') {
            $sql .= " AND sens = ?";
            $params[] = $filtres['sens'];
        }

        if (!empty($filtres['date_debut'])) {
            $sql .= " AND created_at >= ?";
            $params[] = $filtres['date_debut'] . ' 00:00:00';
        }

        if (!empty($filtres['date_fin'])) {
            $sql .= " AND created_at <= ?";
            $params[] = $filtres['date_fin'] . ' 23:59:59';
        }

        $sql .= " ORDER BY created_at DESC LIMIT " . intval($filtres['limite'] ?? 100);

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Statistiques d'un client
     */
    public function mesStats($clientId)
    {
        $stats = [];

        // Solde actuel
        $stmt = $this->db->prepare("SELECT solde_bonus FROM clients WHERE id = ?");
        $stmt->execute([$clientId]);
        $stats['solde_actuel'] = floatval($stmt->fetchColumn());

        // Total crédité
        $stmt = $this->db->prepare("
            SELECT COALESCE(SUM(montant), 0) FROM bonus_transactions 
            WHERE client_id = ? AND sens = 'credit'
        ");
        $stmt->execute([$clientId]);
        $stats['total_credite'] = floatval($stmt->fetchColumn());

        // Total débité
        $stmt = $this->db->prepare("
            SELECT COALESCE(SUM(montant), 0) FROM bonus_transactions 
            WHERE client_id = ? AND sens = 'debit'
        ");
        $stmt->execute([$clientId]);
        $stats['total_debite'] = floatval($stmt->fetchColumn());

        // Nombre de transactions
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM bonus_transactions WHERE client_id = ?");
        $stmt->execute([$clientId]);
        $stats['nb_transactions'] = intval($stmt->fetchColumn());

        // Répartition par type
        $stmt = $this->db->prepare("
            SELECT type, sens, SUM(montant) AS total, COUNT(*) AS nb
            FROM bonus_transactions 
            WHERE client_id = ?
            GROUP BY type, sens
            ORDER BY total DESC
        ");
        $stmt->execute([$clientId]);
        $stats['par_type'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $stats;
    }

    /**
     * Détail d'une transaction
     */
    public function trouverParId($id, $clientId = null)
    {
        $sql = "SELECT * FROM bonus_transactions WHERE id = ?";
        $params = [$id];

        if ($clientId !== null) {
            $sql .= " AND client_id = ?";
            $params[] = $clientId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // =====================================================
    // ADMIN
    // =====================================================

    /**
     * Liste toutes les transactions (admin)
     */
    public function listeAdmin($filtres = [])
    {
        $sql = "SELECT t.*, c.nom AS client_nom, c.email AS client_email 
                FROM bonus_transactions t
                JOIN clients c ON c.id = t.client_id
                WHERE 1=1";
        $params = [];

        if (!empty($filtres['client_id'])) {
            $sql .= " AND t.client_id = ?";
            $params[] = $filtres['client_id'];
        }

        if (!empty($filtres['type']) && $filtres['type'] !== 'tous') {
            $sql .= " AND t.type = ?";
            $params[] = $filtres['type'];
        }

        if (!empty($filtres['sens']) && $filtres['sens'] !== 'tous') {
            $sql .= " AND t.sens = ?";
            $params[] = $filtres['sens'];
        }

        if (!empty($filtres['recherche'])) {
            $sql .= " AND (c.nom LIKE ? OR c.email LIKE ?)";
            $search = '%' . $filtres['recherche'] . '%';
            $params[] = $search;
            $params[] = $search;
        }

        $sql .= " ORDER BY t.created_at DESC LIMIT " . intval($filtres['limite'] ?? 200);

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Statistiques globales (admin)
     */
    public function statsGlobales()
    {
        $stats = [];

        $stmt = $this->db->query("SELECT COUNT(*) FROM bonus_transactions");
        $stats['total_transactions'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COALESCE(SUM(montant), 0) FROM bonus_transactions WHERE sens = 'credit'
        ");
        $stats['total_credite'] = floatval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COALESCE(SUM(montant), 0) FROM bonus_transactions WHERE sens = 'debit'
        ");
        $stats['total_debite'] = floatval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COALESCE(SUM(solde_bonus), 0) FROM clients
        ");
        $stats['solde_total_clients'] = floatval($stmt->fetchColumn());

        // Transactions aujourd'hui
        $stmt = $this->db->query("
            SELECT COUNT(*) FROM bonus_transactions 
            WHERE DATE(created_at) = CURDATE()
        ");
        $stats['transactions_jour'] = intval($stmt->fetchColumn());

        // Répartition par type (admin)
        $stmt = $this->db->query("
            SELECT type, sens, SUM(montant) AS total, COUNT(*) AS nb
            FROM bonus_transactions 
            GROUP BY type, sens
            ORDER BY total DESC
        ");
        $stats['par_type'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $stats;
    }

    /**
     * Export CSV des transactions d'un client
     */
    public function exportCSV($clientId)
    {
        $transactions = $this->mesTransactions($clientId, ['limite' => 10000]);

        $output = "Date;Type;Sens;Montant (Ar);Solde avant;Solde après;Description\n";

        foreach ($transactions as $t) {
            $output .= sprintf(
                "%s;%s;%s;%.2f;%.2f;%.2f;%s\n",
                $t['created_at'],
                $this->getTypeLabel($t['type']),
                $t['sens'] === 'credit' ? 'Crédit' : 'Débit',
                $t['montant'],
                $t['solde_avant'],
                $t['solde_apres'],
                str_replace(';', ',', $t['description'])
            );
        }

        return $output;
    }

    /**
     * Libellé d'un type de transaction
     */
    public function getTypeLabel($type)
    {
        $labels = [
            'parrainage_parrain' => 'Parrainage (parrain)',
            'parrainage_filleul' => 'Parrainage (filleul)',
            'badge' => 'Badge débloqué',
            'roue' => 'Roue de la fortune',
            'vip_souscription' => 'Souscription VIP',
            'vip_renouvellement' => 'Renouvellement VIP',
            'achat' => 'Achat',
            'remboursement' => 'Remboursement',
            'bonus_manuel' => 'Bonus manuel',
            'inscription' => 'Bonus d\'inscription',
            'autre' => 'Autre',
        ];
        return $labels[$type] ?? $type;
    }
}