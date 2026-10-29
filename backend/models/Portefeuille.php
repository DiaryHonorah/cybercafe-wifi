<?php
/**
 * Modèle Portefeuille
 * Gestion du portefeuille électronique (argent réel rechargé)
 */

class Portefeuille
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
     * Récupère la config
     */
    public function getConfig()
    {
        $stmt = $this->db->query("SELECT * FROM portefeuille_config LIMIT 1");
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Assure qu'un client a un portefeuille (le crée si besoin)
     */
    public function assurerPortefeuille($clientId)
    {
        $stmt = $this->db->prepare("SELECT * FROM portefeuilles WHERE client_id = ?");
        $stmt->execute([$clientId]);
        $portefeuille = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$portefeuille) {
            $stmt = $this->db->prepare("
                INSERT INTO portefeuilles (client_id, solde, total_recharge) 
                VALUES (?, 0, 0)
            ");
            $stmt->execute([$clientId]);

            $stmt = $this->db->prepare("SELECT * FROM portefeuilles WHERE client_id = ?");
            $stmt->execute([$clientId]);
            $portefeuille = $stmt->fetch(PDO::FETCH_ASSOC);
        }

        return $portefeuille;
    }

    // =====================================================
    // DEMANDES DE RECHARGEMENT
    // =====================================================

    /**
     * Créer une demande de rechargement
     */
    public function creerDemande($clientId, $data)
    {
        $config = $this->getConfig();
        if (!$config || !$config['actif']) {
            throw new Exception("Le portefeuille est désactivé");
        }

        $montant = floatval($data['montant'] ?? 0);

        if ($montant < floatval($config['rechargement_min'])) {
            throw new Exception(
                "Montant minimum : " . number_format($config['rechargement_min'], 0, ',', ' ') . " Ar"
            );
        }

        if ($montant > floatval($config['rechargement_max'])) {
            throw new Exception(
                "Montant maximum : " . number_format($config['rechargement_max'], 0, ',', ' ') . " Ar"
            );
        }

        $methodesValides = ['mvola', 'orange_money', 'airtel_money', 'virement', 'especes', 'autre'];
        $methode = $data['methode'] ?? 'especes';
        if (!in_array($methode, $methodesValides)) {
            throw new Exception("Méthode de paiement invalide");
        }

        // Vérifier s'il y a déjà une demande en attente
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM portefeuille_demandes 
            WHERE client_id = ? AND statut = 'en_attente'
        ");
        $stmt->execute([$clientId]);
        if (intval($stmt->fetchColumn()) >= 3) {
            throw new Exception("Vous avez déjà 3 demandes en attente. Patientez.");
        }

        $stmt = $this->db->prepare("
            INSERT INTO portefeuille_demandes 
            (client_id, montant, methode, reference_paiement) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $clientId,
            $montant,
            $methode,
            $data['reference_paiement'] ?? null,
        ]);

        $demandeId = $this->db->lastInsertId();

        // Notification au client
        $stmt = $this->db->prepare("
            INSERT INTO clients_notifications (client_id, titre, message, type) 
            VALUES (?, ?, ?, 'info')
        ");
        $stmt->execute([
            $clientId,
            "💳 Demande de rechargement envoyée",
            "Votre demande de " . number_format($montant, 0, ',', ' ') . 
            " Ar est en attente de validation par l'administrateur.",
        ]);

        return $this->trouverDemande($demandeId);
    }

    /**
     * Valider une demande (admin)
     */
    public function validerDemande($demandeId, $adminId, $note = null)
    {
        $demande = $this->trouverDemande($demandeId);
        if (!$demande) {
            throw new Exception("Demande introuvable");
        }

        if ($demande['statut'] !== 'en_attente') {
            throw new Exception("Cette demande a déjà été traitée");
        }

        $config = $this->getConfig();
        $montant = floatval($demande['montant']);

        // Calculer le bonus
        $bonus = 0;
        if ($montant >= floatval($config['bonus_seuil']) && intval($config['bonus_pct']) > 0) {
            $bonus = round($montant * (intval($config['bonus_pct']) / 100), 2);
        }

        try {
            $this->db->beginTransaction();

            // Assurer portefeuille
            $portefeuille = $this->assurerPortefeuille($demande['client_id']);

            // Créditer le portefeuille
            $nouveauSolde = floatval($portefeuille['solde']) + $montant;
            $stmt = $this->db->prepare("
                UPDATE portefeuilles 
                SET solde = ?,
                    total_recharge = total_recharge + ?,
                    total_bonus_rechargement = total_bonus_rechargement + ?
                WHERE client_id = ?
            ");
            $stmt->execute([$nouveauSolde, $montant, $bonus, $demande['client_id']]);

            // Créditer le bonus au solde_bonus (séparé)
            if ($bonus > 0) {
                $stmt = $this->db->prepare("
                    UPDATE clients SET solde_bonus = solde_bonus + ? WHERE id = ?
                ");
                $stmt->execute([$bonus, $demande['client_id']]);
            }

            // Transaction portefeuille
            $stmt = $this->db->prepare("
                INSERT INTO portefeuille_transactions 
                (client_id, type, sens, montant, solde_avant, solde_apres, description, demande_id) 
                VALUES (?, 'rechargement', 'credit', ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $demande['client_id'],
                $montant,
                $portefeuille['solde'],
                $nouveauSolde,
                "Rechargement validé (" . $demande['methode'] . ")",
                $demandeId,
            ]);

            // Transaction bonus séparée
            if ($bonus > 0) {
                $stmt = $this->db->prepare("
                    INSERT INTO bonus_transactions 
                    (client_id, type, sens, montant, solde_avant, solde_apres, description) 
                    SELECT ?, 'bonus_manuel', 'credit', ?, 
                           COALESCE((SELECT solde_bonus FROM clients WHERE id = ?), 0) - ?,
                           COALESCE((SELECT solde_bonus FROM clients WHERE id = ?), 0),
                           ?
                ");
                $stmt->execute([
                    $demande['client_id'],
                    $bonus,
                    $demande['client_id'],
                    $bonus,
                    $demande['client_id'],
                    "Bonus " . intval($config['bonus_pct']) . "% sur rechargement de " . 
                        number_format($montant, 0, ',', ' '),
                ]);
            }

            // Marquer la demande
            $stmt = $this->db->prepare("
                UPDATE portefeuille_demandes 
                SET statut = 'validee', bonus_applique = ?, admin_id = ?, 
                    note_admin = ?, date_traitement = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$bonus, $adminId, $note, $demandeId]);

            // Notification
            $message = "Votre rechargement de " . number_format($montant, 0, ',', ' ') . " Ar a été validé !";
            if ($bonus > 0) {
                $message .= " + " . number_format($bonus, 0, ',', ' ') . " Ar de bonus offerts 🎁";
            }

            $stmt = $this->db->prepare("
                INSERT INTO clients_notifications (client_id, titre, message, type) 
                VALUES (?, ?, ?, 'success')
            ");
            $stmt->execute([
                $demande['client_id'],
                "💰 Rechargement validé !",
                $message,
            ]);

            $this->db->commit();

            return [
                'success' => true,
                'montant' => $montant,
                'bonus' => $bonus,
                'nouveau_solde' => $nouveauSolde,
            ];

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Rejeter une demande (admin)
     */
    public function rejeterDemande($demandeId, $adminId, $raison = null)
    {
        $demande = $this->trouverDemande($demandeId);
        if (!$demande) {
            throw new Exception("Demande introuvable");
        }

        if ($demande['statut'] !== 'en_attente') {
            throw new Exception("Cette demande a déjà été traitée");
        }

        $stmt = $this->db->prepare("
            UPDATE portefeuille_demandes 
            SET statut = 'rejetee', admin_id = ?, note_admin = ?, date_traitement = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$adminId, $raison, $demandeId]);

        // Notification
        $stmt = $this->db->prepare("
            INSERT INTO clients_notifications (client_id, titre, message, type) 
            VALUES (?, ?, ?, 'warning')
        ");
        $stmt->execute([
            $demande['client_id'],
            "❌ Demande de rechargement rejetée",
            "Votre demande de " . number_format($demande['montant'], 0, ',', ' ') . 
            " Ar a été rejetée." . ($raison ? " Raison : $raison" : ""),
        ]);

        return true;
    }

    /**
     * Trouver une demande
     */
    public function trouverDemande($demandeId)
    {
        $stmt = $this->db->prepare("
            SELECT d.*, c.nom AS client_nom, c.email AS client_email, c.telephone AS client_telephone
            FROM portefeuille_demandes d
            JOIN clients c ON c.id = d.client_id
            WHERE d.id = ?
        ");
        $stmt->execute([$demandeId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Mes demandes (client)
     */
    public function mesDemandes($clientId, $limite = 20)
    {
        $stmt = $this->db->prepare("
            SELECT * FROM portefeuille_demandes 
            WHERE client_id = ? 
            ORDER BY created_at DESC 
            LIMIT " . intval($limite)
        );
        $stmt->execute([$clientId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Toutes les demandes (admin)
     */
    public function toutesLesDemandes($filtres = [])
    {
        $sql = "SELECT d.*, c.nom AS client_nom, c.email AS client_email, c.telephone AS client_telephone
                FROM portefeuille_demandes d
                JOIN clients c ON c.id = d.client_id
                WHERE 1=1";
        $params = [];

        if (!empty($filtres['statut']) && $filtres['statut'] !== 'tous') {
            $sql .= " AND d.statut = ?";
            $params[] = $filtres['statut'];
        }

        if (!empty($filtres['recherche'])) {
            $sql .= " AND (c.nom LIKE ? OR c.email LIKE ? OR c.telephone LIKE ?)";
            $search = '%' . $filtres['recherche'] . '%';
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
        }

        $sql .= " ORDER BY 
                    CASE d.statut 
                        WHEN 'en_attente' THEN 1 
                        WHEN 'validee' THEN 2 
                        ELSE 3 
                    END,
                    d.created_at DESC 
                  LIMIT " . intval($filtres['limite'] ?? 100);

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // =====================================================
    // TRANSACTIONS & STATS
    // =====================================================

    /**
     * Historique des transactions portefeuille d'un client
     */
    public function mesTransactions($clientId, $limite = 100)
    {
        $stmt = $this->db->prepare("
            SELECT * FROM portefeuille_transactions 
            WHERE client_id = ? 
            ORDER BY created_at DESC 
            LIMIT " . intval($limite)
        );
        $stmt->execute([$clientId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Statistiques d'un client
     */
    public function mesStats($clientId)
    {
        $portefeuille = $this->assurerPortefeuille($clientId);

        // Demandes en attente
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM portefeuille_demandes 
            WHERE client_id = ? AND statut = 'en_attente'
        ");
        $stmt->execute([$clientId]);
        $demandesEnAttente = intval($stmt->fetchColumn());

        return [
            'solde' => floatval($portefeuille['solde']),
            'total_recharge' => floatval($portefeuille['total_recharge']),
            'total_depense' => floatval($portefeuille['total_depense']),
            'total_bonus_rechargement' => floatval($portefeuille['total_bonus_rechargement']),
            'demandes_en_attente' => $demandesEnAttente,
        ];
    }

    /**
     * Débiter le portefeuille (paiement)
     */
    public function debiter($clientId, $montant, $type, $description, $options = [])
    {
        $montant = floatval($montant);
        if ($montant <= 0) throw new Exception("Montant invalide");

        $portefeuille = $this->assurerPortefeuille($clientId);

        if (floatval($portefeuille['solde']) < $montant) {
            throw new Exception(
                "Solde portefeuille insuffisant : " . 
                number_format($portefeuille['solde'], 0, ',', ' ') . " Ar disponible"
            );
        }

        try {
            $this->db->beginTransaction();

            $nouveauSolde = floatval($portefeuille['solde']) - $montant;

            $stmt = $this->db->prepare("
                UPDATE portefeuilles 
                SET solde = ?, total_depense = total_depense + ?
                WHERE client_id = ?
            ");
            $stmt->execute([$nouveauSolde, $montant, $clientId]);

            $stmt = $this->db->prepare("
                INSERT INTO portefeuille_transactions 
                (client_id, type, sens, montant, solde_avant, solde_apres, 
                 description, reference_type, reference_id) 
                VALUES (?, ?, 'debit', ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $clientId,
                $type,
                $montant,
                $portefeuille['solde'],
                $nouveauSolde,
                $description,
                $options['reference_type'] ?? null,
                $options['reference_id'] ?? null,
            ]);

            $this->db->commit();

            return ['nouveau_solde' => $nouveauSolde];

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Stats globales (admin)
     */
    public function statsGlobales()
    {
        $stats = [];

        $stmt = $this->db->query("SELECT COUNT(*) FROM portefeuilles");
        $stats['total_portefeuilles'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COALESCE(SUM(solde), 0) FROM portefeuilles");
        $stats['solde_total'] = floatval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COALESCE(SUM(total_recharge), 0) FROM portefeuilles");
        $stats['total_recharge'] = floatval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COALESCE(SUM(total_depense), 0) FROM portefeuilles");
        $stats['total_depense'] = floatval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COUNT(*) FROM portefeuille_demandes WHERE statut = 'en_attente'
        ");
        $stats['demandes_en_attente'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COALESCE(SUM(montant), 0) FROM portefeuille_demandes 
            WHERE statut = 'validee'
        ");
        $stats['total_valide'] = floatval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COALESCE(SUM(bonus_applique), 0) FROM portefeuille_demandes 
            WHERE statut = 'validee'
        ");
        $stats['total_bonus_verse'] = floatval($stmt->fetchColumn());

        return $stats;
    }

    /**
     * Liste des portefeuilles (admin)
     */
    public function listePortefeuilles($filtres = [])
    {
        $sql = "SELECT p.*, c.nom AS client_nom, c.email AS client_email, c.telephone AS client_telephone
                FROM portefeuilles p
                JOIN clients c ON c.id = p.client_id
                WHERE 1=1";
        $params = [];

        if (!empty($filtres['recherche'])) {
            $sql .= " AND (c.nom LIKE ? OR c.email LIKE ? OR c.telephone LIKE ?)";
            $search = '%' . $filtres['recherche'] . '%';
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
        }

        if (!empty($filtres['min_solde'])) {
            $sql .= " AND p.solde >= ?";
            $params[] = floatval($filtres['min_solde']);
        }

        $sql .= " ORDER BY p.solde DESC LIMIT " . intval($filtres['limite'] ?? 100);

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}