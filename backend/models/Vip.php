<?php
/**
 * Modèle Vip
 * Gestion du programme VIP
 */

class Vip
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
     * Récupère la configuration VIP
     */
    public function getConfig()
    {
        $stmt = $this->db->query("SELECT * FROM vip_config LIMIT 1");
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Récupère l'abonnement actif d'un client
     */
    public function getAbonnementActif($clientId)
    {
        $stmt = $this->db->prepare("
            SELECT * FROM vip_abonnements 
            WHERE client_id = ? 
            AND statut = 'actif' 
            AND date_fin >= CURDATE()
            ORDER BY date_fin DESC
            LIMIT 1
        ");
        $stmt->execute([$clientId]);
        $abonnement = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($abonnement) {
            // Vérifier si expiré
            if (strtotime($abonnement['date_fin']) < time()) {
                $this->expirer($abonnement['id']);
                return null;
            }

            // Calculer jours restants
            $fin = new DateTime($abonnement['date_fin']);
            $maintenant = new DateTime();
            $diff = $maintenant->diff($fin);
            $abonnement['jours_restants'] = $diff->days;
            $abonnement['impressions_restantes'] = 
                intval($abonnement['impressions_limite']) - intval($abonnement['impressions_utilisees']);
        }

        return $abonnement;
    }

    /**
     * Souscrire un abonnement VIP
     */
    public function souscrire($clientId, $autoRenouvellement = false)
    {
        $config = $this->getConfig();
        if (!$config || !$config['actif']) {
            throw new Exception("Le programme VIP n'est pas disponible");
        }

        // Vérifier s'il y a déjà un abonnement actif
        $existant = $this->getAbonnementActif($clientId);
        if ($existant) {
            throw new Exception("Vous avez déjà un abonnement VIP actif jusqu'au " . 
                date('d/m/Y', strtotime($existant['date_fin'])));
        }

        // Vérifier le solde bonus
        $stmt = $this->db->prepare("SELECT solde_bonus FROM clients WHERE id = ?");
        $stmt->execute([$clientId]);
        $soldeBonus = floatval($stmt->fetchColumn());

        if ($soldeBonus < floatval($config['prix_mensuel'])) {
            throw new Exception(
                "Solde bonus insuffisant. Il vous faut " . 
                number_format($config['prix_mensuel'], 0, ',', ' ') . 
                " Ar (vous avez " . number_format($soldeBonus, 0, ',', ' ') . " Ar)"
            );
        }

        $dateDebut = date('Y-m-d');
        $dateFin = date('Y-m-d', strtotime('+30 days'));

        try {
            $this->db->beginTransaction();

            // Créer l'abonnement
            $stmt = $this->db->prepare("
                INSERT INTO vip_abonnements 
                (client_id, date_debut, date_fin, montant_paye, auto_renouvellement, impressions_limite) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $clientId,
                $dateDebut,
                $dateFin,
                $config['prix_mensuel'],
                $autoRenouvellement ? 1 : 0,
                $config['impressions_limite'],
            ]);

            $abonnementId = $this->db->lastInsertId();

            // Débiter le solde bonus
            $stmt = $this->db->prepare("
                UPDATE clients 
                SET solde_bonus = solde_bonus - ? 
                WHERE id = ?
            ");
            $stmt->execute([$config['prix_mensuel'], $clientId]);

            // Notification
            $stmt = $this->db->prepare("
                INSERT INTO clients_notifications (client_id, titre, message, type) 
                VALUES (?, ?, ?, 'success')
            ");
            $stmt->execute([
                $clientId,
                "💎 Bienvenue au Club VIP !",
                "Votre abonnement VIP est actif jusqu'au " . date('d/m/Y', strtotime($dateFin)) . 
                ". Profitez de Wi-Fi illimité et 50 impressions gratuites !",
            ]);

            $this->db->commit();

            return $this->getAbonnementActif($clientId);

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Renouveler un abonnement
     */
    public function renouveler($clientId)
    {
        $config = $this->getConfig();
        $abonnementActuel = $this->getAbonnementActif($clientId);

        if (!$abonnementActuel) {
            throw new Exception("Aucun abonnement actif à renouveler");
        }

        // Vérifier le solde
        $stmt = $this->db->prepare("SELECT solde_bonus FROM clients WHERE id = ?");
        $stmt->execute([$clientId]);
        $soldeBonus = floatval($stmt->fetchColumn());

        if ($soldeBonus < floatval($config['prix_mensuel'])) {
            throw new Exception(
                "Solde bonus insuffisant pour le renouvellement (" . 
                number_format($config['prix_mensuel'], 0, ',', ' ') . " Ar requis)"
            );
        }

        try {
            $this->db->beginTransaction();

            // Prolonger la date de fin de 30 jours
            $nouvelleFin = date('Y-m-d', strtotime($abonnementActuel['date_fin'] . ' +30 days'));

            $stmt = $this->db->prepare("
                UPDATE vip_abonnements 
                SET date_fin = ?,
                    impressions_limite = impressions_limite + ?,
                    montant_paye = montant_paye + ?
                WHERE id = ?
            ");
            $stmt->execute([
                $nouvelleFin,
                $config['impressions_limite'],
                $config['prix_mensuel'],
                $abonnementActuel['id'],
            ]);

            // Débiter
            $stmt = $this->db->prepare("
                UPDATE clients 
                SET solde_bonus = solde_bonus - ? 
                WHERE id = ?
            ");
            $stmt->execute([$config['prix_mensuel'], $clientId]);

            // Notification
            $stmt = $this->db->prepare("
                INSERT INTO clients_notifications (client_id, titre, message, type) 
                VALUES (?, ?, ?, 'success')
            ");
            $stmt->execute([
                $clientId,
                "💎 Abonnement VIP renouvelé !",
                "Votre abonnement est prolongé jusqu'au " . date('d/m/Y', strtotime($nouvelleFin)) . 
                ". +50 impressions ajoutées !",
            ]);

            $this->db->commit();

            return $this->getAbonnementActif($clientId);

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Utiliser une impression (débit du quota)
     */
    public function utiliserImpression($clientId, $nombre = 1, $description = 'Impression')
    {
        $abonnement = $this->getAbonnementActif($clientId);
        if (!$abonnement) {
            throw new Exception("Aucun abonnement VIP actif");
        }

        if ($abonnement['impressions_restantes'] < $nombre) {
            throw new Exception(
                "Impressions insuffisantes. Il vous reste " . 
                $abonnement['impressions_restantes'] . " impressions"
            );
        }

        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                UPDATE vip_abonnements 
                SET impressions_utilisees = impressions_utilisees + ?,
                    date_derniere_utilisation = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$nombre, $abonnement['id']]);

            $stmt = $this->db->prepare("
                INSERT INTO vip_utilisations (abonnement_id, type, details) 
                VALUES (?, 'impression', ?)
            ");
            $stmt->execute([$abonnement['id'], $description]);

            $this->db->commit();

            return true;

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Enregistrer utilisation Wi-Fi
     */
    public function utiliserWifi($clientId, $heures = 1)
    {
        $abonnement = $this->getAbonnementActif($clientId);
        if (!$abonnement) {
            return false;
        }

        $stmt = $this->db->prepare("
            UPDATE vip_abonnements 
            SET wifi_utilise_heures = wifi_utilise_heures + ?,
                date_derniere_utilisation = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$heures, $abonnement['id']]);

        return true;
    }

    /**
     * Expirer un abonnement
     */
    public function expirer($abonnementId)
    {
        $stmt = $this->db->prepare("
            UPDATE vip_abonnements 
            SET statut = 'expire' 
            WHERE id = ?
        ");
        return $stmt->execute([$abonnementId]);
    }

    /**
     * Annuler un abonnement
     */
    public function annuler($abonnementId)
    {
        $stmt = $this->db->prepare("
            UPDATE vip_abonnements 
            SET statut = 'annule' 
            WHERE id = ?
        ");
        return $stmt->execute([$abonnementId]);
    }

    /**
     * Historique des abonnements d'un client
     */
    public function monHistorique($clientId)
    {
        $stmt = $this->db->prepare("
            SELECT * FROM vip_abonnements 
            WHERE client_id = ? 
            ORDER BY date_creation DESC
        ");
        $stmt->execute([$clientId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Statistiques globales (ADMIN)
     */
    public function stats()
    {
        $stats = [];

        $stmt = $this->db->query("
            SELECT COUNT(*) FROM vip_abonnements WHERE statut = 'actif' AND date_fin >= CURDATE()
        ");
        $stats['abonnes_actifs'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COUNT(*) FROM vip_abonnements WHERE statut = 'expire' OR date_fin < CURDATE()
        ");
        $stats['abonnes_expires'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COALESCE(SUM(montant_paye), 0) FROM vip_abonnements WHERE statut = 'actif'
        ");
        $stats['revenus_mensuels'] = floatval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COALESCE(SUM(montant_paye), 0) FROM vip_abonnements
        ");
        $stats['revenus_total'] = floatval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COUNT(*) FROM vip_abonnements
        ");
        $stats['total_abonnements'] = intval($stmt->fetchColumn());

        return $stats;
    }

    /**
     * Liste tous les abonnements (ADMIN)
     */
    public function liste($filtres = [])
    {
        $sql = "SELECT a.*, c.nom AS client_nom, c.email AS client_email, c.telephone AS client_telephone
                FROM vip_abonnements a
                JOIN clients c ON c.id = a.client_id
                WHERE 1=1";
        $params = [];

        if (!empty($filtres['statut'])) {
            $sql .= " AND a.statut = ?";
            $params[] = $filtres['statut'];
        }

        if (!empty($filtres['recherche'])) {
            $sql .= " AND (c.nom LIKE ? OR c.email LIKE ? OR c.telephone LIKE ?)";
            $search = '%' . $filtres['recherche'] . '%';
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
        }

        $sql .= " ORDER BY a.date_creation DESC LIMIT 100";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}