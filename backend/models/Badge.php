<?php
/**
 * Modèle Badge (CORRIGÉ)
 */

class Badge
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

    public function listeTous($categorie = null)
    {
        $sql = "SELECT * FROM badges WHERE actif = 1";
        $params = [];

        if ($categorie) {
            $sql .= " AND categorie = ?";
            $params[] = $categorie;
        }

        $sql .= " ORDER BY ordre ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function mesBadges($clientId)
    {
        $stmt = $this->db->prepare("
            SELECT b.*, cb.debloque_le
            FROM clients_badges cb
            JOIN badges b ON b.id = cb.badge_id
            WHERE cb.client_id = ?
            ORDER BY cb.debloque_le DESC
        ");
        $stmt->execute([$clientId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function aBadge($clientId, $badgeId)
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM clients_badges
            WHERE client_id = ? AND badge_id = ?
        ");
        $stmt->execute([$clientId, $badgeId]);
        return intval($stmt->fetchColumn()) > 0;
    }

    public function verifierEtDebloquer($clientId)
    {
        $nouveauxBadges = [];
        $badges = $this->listeTous();
        $stats = $this->getStatsClient($clientId);

        foreach ($badges as $badge) {
            if ($this->aBadge($clientId, $badge['id'])) continue;

            if ($this->verifierCondition($badge, $stats)) {
                $this->debloquer($clientId, $badge);
                $nouveauxBadges[] = $badge;
            }
        }

        return $nouveauxBadges;
    }

    private function verifierCondition($badge, $stats)
    {
        $valeur = intval($badge['condition_valeur']);

        switch ($badge['condition_type']) {
            case 'nb_reservations':
                return $stats['nb_reservations'] >= $valeur;
            case 'nb_visites':
                return $stats['nb_visites'] >= $valeur;
            case 'nb_parrainages':
                return $stats['nb_parrainages'] >= $valeur;
            case 'points_fidelite':
                return $stats['points_fidelite'] >= $valeur;
            case 'nb_achats':
                return $stats['nb_achats'] >= $valeur;
            case 'montant_total':
                return $stats['montant_total'] >= $valeur;
            case 'inscription_anciennete':
                return $stats['jours_anciennete'] >= $valeur;
            case 'manuel':
                return false;
            default:
                return false;
        }
    }

    public function debloquer($clientId, $badge)
    {
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                INSERT INTO clients_badges (client_id, badge_id)
                VALUES (?, ?)
            ");
            $stmt->execute([$clientId, $badge['id']]);

            $bonusVerse = 0;
            if (floatval($badge['recompense_bonus']) > 0) {
                $stmt = $this->db->prepare("
                    UPDATE clients
                    SET solde_bonus = solde_bonus + ?
                    WHERE id = ?
                ");
                $stmt->execute([$badge['recompense_bonus'], $clientId]);
                $bonusVerse = floatval($badge['recompense_bonus']);

                $stmt = $this->db->prepare("
                    UPDATE clients_badges
                    SET bonus_verse = 1
                    WHERE client_id = ? AND badge_id = ?
                ");
                $stmt->execute([$clientId, $badge['id']]);
            }

            $message = "Vous avez débloqué le badge « {$badge['icone']} {$badge['nom']} » !";
            if ($bonusVerse > 0) {
                $message .= " Bonus : +" . number_format($bonusVerse, 0, ',', ' ') . " Ar";
            }

            $stmt = $this->db->prepare("
                INSERT INTO clients_notifications (client_id, titre, message, type)
                VALUES (?, ?, ?, 'success')
            ");
            $stmt->execute([
                $clientId,
                "🏆 Nouveau badge débloqué !",
                $message,
            ]);

            $this->db->commit();
            return true;

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getStatsClient($clientId)
    {
        $stats = [
            'nb_reservations' => 0,
            'nb_visites' => 0,
            'nb_parrainages' => 0,
            'points_fidelite' => 0,
            'nb_achats' => 0,
            'montant_total' => 0,
            'jours_anciennete' => 0,
            'solde_bonus' => 0,
        ];

        // Récupérer les infos client
        $stmt = $this->db->prepare("
            SELECT email, telephone, date_inscription, solde_bonus
            FROM clients WHERE id = ?
        ");
        $stmt->execute([$clientId]);
        $client = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$client) {
            return $stats;
        }

        $stats['solde_bonus'] = floatval($client['solde_bonus'] ?? 0);

        // Nombre de réservations terminées
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM reservations
                WHERE (email = ? OR telephone = ?) AND statut = 'terminee'
            ");
            $stmt->execute([$client['email'], $client['telephone']]);
            $stats['nb_reservations'] = intval($stmt->fetchColumn());
        } catch (Exception $e) {}

        // Nombre total de réservations
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM reservations
                WHERE email = ? OR telephone = ?
            ");
            $stmt->execute([$client['email'], $client['telephone']]);
            $stats['nb_visites'] = intval($stmt->fetchColumn());
        } catch (Exception $e) {}

        // Nombre de parrainages validés
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM parrainages
                WHERE parrain_id = ? AND statut = 'valide'
            ");
            $stmt->execute([$clientId]);
            $stats['nb_parrainages'] = intval($stmt->fetchColumn());
        } catch (Exception $e) {}

        // Points fidélité
        try {
            $stmt = $this->db->prepare("
                SELECT points_total FROM cartes_fidelite
                WHERE client_telephone = ?
                LIMIT 1
            ");
            $stmt->execute([$client['telephone']]);
            $result = $stmt->fetchColumn();
            $stats['points_fidelite'] = intval($result ?: 0);
        } catch (Exception $e) {}

        // Nombre d'achats (tickets)
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM tickets
                WHERE client_telephone = ?
            ");
            $stmt->execute([$client['telephone']]);
            $stats['nb_achats'] = intval($stmt->fetchColumn());
        } catch (Exception $e) {}

        // Montant total (approximatif)
        $stats['montant_total'] = 0;

        // Jours d'ancienneté
        try {
            $dateInscription = new DateTime($client['date_inscription']);
            $maintenant = new DateTime();
            $diff = $dateInscription->diff($maintenant);
            $stats['jours_anciennete'] = $diff->days;
        } catch (Exception $e) {
            $stats['jours_anciennete'] = 0;
        }

        return $stats;
    }

    public function creer($data)
    {
        $code = strtoupper(trim($data['code'] ?? ''));

        if (empty($code)) {
            throw new Exception("Code requis");
        }

        if (!preg_match('/^[A-Z0-9_]{3,50}$/', $code)) {
            throw new Exception("Code invalide (A-Z, 0-9, _ uniquement)");
        }

        $stmt = $this->db->prepare("SELECT id FROM badges WHERE code = ?");
        $stmt->execute([$code]);
        if ($stmt->fetch()) {
            throw new Exception("Ce code existe déjà");
        }

        $stmt = $this->db->prepare("
            INSERT INTO badges
            (code, nom, nom_mg, description, description_mg, icone, couleur,
             categorie, condition_type, condition_valeur, recompense_bonus,
             recompense_description, actif, ordre)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $code,
            $data['nom'],
            $data['nom_mg'] ?? null,
            $data['description'],
            $data['description_mg'] ?? null,
            $data['icone'] ?? '🏆',
            $data['couleur'] ?? 'cyan',
            $data['categorie'] ?? 'debut',
            $data['condition_type'],
            intval($data['condition_valeur'] ?? 0),
            floatval($data['recompense_bonus'] ?? 0),
            $data['recompense_description'] ?? null,
            !empty($data['actif']) ? 1 : 0,
            intval($data['ordre'] ?? 0),
        ]);

        return $this->trouverParId($this->db->lastInsertId());
    }

    public function trouverParId($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM badges WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function modifier($id, $data)
    {
        $badge = $this->trouverParId($id);
        if (!$badge) {
            throw new Exception("Badge introuvable");
        }

        $stmt = $this->db->prepare("
            UPDATE badges SET
                nom = ?, nom_mg = ?, description = ?, description_mg = ?,
                icone = ?, couleur = ?, categorie = ?, condition_type = ?,
                condition_valeur = ?, recompense_bonus = ?, recompense_description = ?,
                actif = ?, ordre = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $data['nom'] ?? $badge['nom'],
            $data['nom_mg'] ?? $badge['nom_mg'],
            $data['description'] ?? $badge['description'],
            $data['description_mg'] ?? $badge['description_mg'],
            $data['icone'] ?? $badge['icone'],
            $data['couleur'] ?? $badge['couleur'],
            $data['categorie'] ?? $badge['categorie'],
            $data['condition_type'] ?? $badge['condition_type'],
            intval($data['condition_valeur'] ?? $badge['condition_valeur']),
            floatval($data['recompense_bonus'] ?? $badge['recompense_bonus']),
            $data['recompense_description'] ?? $badge['recompense_description'],
            isset($data['actif']) ? ($data['actif'] ? 1 : 0) : $badge['actif'],
            intval($data['ordre'] ?? $badge['ordre']),
            $id,
        ]);

        return $this->trouverParId($id);
    }

    public function supprimer($id)
    {
        $stmt = $this->db->prepare("DELETE FROM badges WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function stats()
    {
        $stats = [];

        $stmt = $this->db->query("SELECT COUNT(*) FROM badges WHERE actif = 1");
        $stats['total_badges'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM clients_badges");
        $stats['total_debloques'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(DISTINCT client_id) FROM clients_badges");
        $stats['clients_avec_badges'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT SUM(recompense_bonus) FROM badges WHERE actif = 1
        ");
        $stats['total_bonus_potentiel'] = floatval($stmt->fetchColumn() ?: 0);

        return $stats;
    }

    public function clientsAvecBadge($badgeId)
    {
        $stmt = $this->db->prepare("
            SELECT c.id, c.nom, c.email, cb.debloque_le
            FROM clients_badges cb
            JOIN clients c ON c.id = cb.client_id
            WHERE cb.badge_id = ?
            ORDER BY cb.debloque_le DESC
        ");
        $stmt->execute([$badgeId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}