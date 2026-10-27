<?php
/**
 * Modèle Promotion (codes promo)
 * Gère les codes promo et leurs utilisations
 * ⚠️ Tables : codes_promo, codes_promo_utilisations
 */

class Promotion
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
    // VALIDATION D'UN CODE PROMO
    // =====================================================

    public function valider($code, $montant, $service = 'tous', $clientTel = null)
    {
        $code = strtoupper(trim($code));
        
        if (empty($code)) {
            throw new Exception("Code promo vide");
        }

        $stmt = $this->db->prepare("SELECT * FROM codes_promo WHERE code = ?");
        $stmt->execute([$code]);
        $promo = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$promo) {
            throw new Exception("Code promo invalide");
        }

        if (!$promo['actif']) {
            throw new Exception("Ce code promo n'est plus actif");
        }

        $now = new DateTime();
        $debut = new DateTime($promo['date_debut']);
        $fin = new DateTime($promo['date_fin']);

        if ($now < $debut) {
            throw new Exception("Ce code promo n'est pas encore actif");
        }

        if ($now > $fin) {
            throw new Exception("Ce code promo a expiré");
        }

        if ($promo['max_utilisations'] !== null) {
            if (intval($promo['nb_utilisations']) >= intval($promo['max_utilisations'])) {
                throw new Exception("Ce code promo a atteint sa limite d'utilisation");
            }
        }

        if ($clientTel && intval($promo['max_par_client']) > 0) {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM codes_promo_utilisations 
                WHERE promotion_id = ? AND client_telephone = ?
            ");
            $stmt->execute([$promo['id'], $clientTel]);
            $dejaUtilise = intval($stmt->fetchColumn());

            if ($dejaUtilise >= intval($promo['max_par_client'])) {
                throw new Exception("Vous avez déjà utilisé ce code le nombre maximum de fois");
            }
        }

        if (floatval($promo['montant_min']) > 0 && $montant < floatval($promo['montant_min'])) {
            throw new Exception("Montant minimum requis : " . number_format($promo['montant_min'], 0, ',', ' ') . " Ar");
        }

        if ($promo['services_applicables'] !== 'tous') {
            $servicesAutorises = array_map('trim', explode(',', $promo['services_applicables']));
            if (!in_array($service, $servicesAutorises)) {
                throw new Exception("Ce code n'est pas valable pour ce service");
            }
        }

        $reduction = $this->calculerReduction($promo, $montant);
        $montantApres = max(0, $montant - $reduction);

        return [
            'success' => true,
            'promotion' => $promo,
            'montant_avant' => floatval($montant),
            'reduction' => $reduction,
            'montant_apres' => $montantApres,
            'message' => "Code appliqué ! Vous économisez " . number_format($reduction, 0, ',', ' ') . " Ar",
        ];
    }

    private function calculerReduction($promo, $montant)
    {
        if ($promo['type'] === 'pourcentage') {
            $reduction = $montant * (floatval($promo['valeur']) / 100);
        } else {
            $reduction = floatval($promo['valeur']);
        }
        return min($reduction, $montant);
    }

    // =====================================================
    // UTILISATION D'UN CODE
    // =====================================================

    public function utiliser($code, $montant, $service = 'tous', $clientTel = null, $clientEmail = null, $reference = null)
    {
        $validation = $this->valider($code, $montant, $service, $clientTel);

        try {
            $this->db->beginTransaction();

            $this->db->prepare("
                UPDATE codes_promo SET nb_utilisations = nb_utilisations + 1 WHERE id = ?
            ")->execute([$validation['promotion']['id']]);

            $stmt = $this->db->prepare("
                INSERT INTO codes_promo_utilisations 
                (promotion_id, code, client_telephone, client_email, 
                 montant_avant, reduction, montant_apres, service, reference, ip) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $validation['promotion']['id'],
                strtoupper($code),
                $clientTel,
                $clientEmail,
                $validation['montant_avant'],
                $validation['reduction'],
                $validation['montant_apres'],
                $service,
                $reference,
                $_SERVER['REMOTE_ADDR'] ?? null,
            ]);

            $this->db->commit();
            return $validation;

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // =====================================================
    // CRUD ADMIN
    // =====================================================

    public function creer($data, $adminId = null)
    {
        $code = strtoupper(trim($data['code'] ?? ''));
        
        if (empty($code)) {
            throw new Exception("Code requis");
        }

        if (!preg_match('/^[A-Z0-9_-]{3,50}$/', $code)) {
            throw new Exception("Code invalide (3-50 caractères, A-Z, 0-9, _, -)");
        }

        $stmt = $this->db->prepare("SELECT id FROM codes_promo WHERE code = ?");
        $stmt->execute([$code]);
        if ($stmt->fetch()) {
            throw new Exception("Ce code existe déjà");
        }

        $stmt = $this->db->prepare("
            INSERT INTO codes_promo 
            (code, description, type, valeur, montant_min, date_debut, date_fin, 
             max_utilisations, max_par_client, services_applicables, actif, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $code,
            $data['description'] ?? null,
            $data['type'] ?? 'pourcentage',
            floatval($data['valeur']),
            floatval($data['montant_min'] ?? 0),
            $data['date_debut'],
            $data['date_fin'],
            !empty($data['max_utilisations']) ? intval($data['max_utilisations']) : null,
            intval($data['max_par_client'] ?? 1),
            $data['services_applicables'] ?? 'tous',
            !empty($data['actif']) ? 1 : 0,
            $adminId,
        ]);

        return $this->trouverParId($this->db->lastInsertId());
    }

    public function modifier($id, $data)
    {
        $promo = $this->trouverParId($id);
        if (!$promo) {
            throw new Exception("Promotion introuvable");
        }

        $stmt = $this->db->prepare("
            UPDATE codes_promo SET 
                description = ?, type = ?, valeur = ?, montant_min = ?,
                date_debut = ?, date_fin = ?, max_utilisations = ?,
                max_par_client = ?, services_applicables = ?, actif = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $data['description'] ?? null,
            $data['type'] ?? $promo['type'],
            floatval($data['valeur'] ?? $promo['valeur']),
            floatval($data['montant_min'] ?? $promo['montant_min']),
            $data['date_debut'] ?? $promo['date_debut'],
            $data['date_fin'] ?? $promo['date_fin'],
            !empty($data['max_utilisations']) ? intval($data['max_utilisations']) : null,
            intval($data['max_par_client'] ?? $promo['max_par_client']),
            $data['services_applicables'] ?? $promo['services_applicables'],
            isset($data['actif']) ? ($data['actif'] ? 1 : 0) : $promo['actif'],
            $id,
        ]);

        return $this->trouverParId($id);
    }

    public function supprimer($id)
    {
        $stmt = $this->db->prepare("DELETE FROM codes_promo WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function toggleActif($id)
    {
        $promo = $this->trouverParId($id);
        if (!$promo) {
            throw new Exception("Promotion introuvable");
        }

        $stmt = $this->db->prepare("UPDATE codes_promo SET actif = ? WHERE id = ?");
        $stmt->execute([$promo['actif'] ? 0 : 1, $id]);

        return $this->trouverParId($id);
    }

    // =====================================================
    // LECTURE
    // =====================================================

    public function trouverParId($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM codes_promo WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function trouverParCode($code)
    {
        $stmt = $this->db->prepare("SELECT * FROM codes_promo WHERE code = ?");
        $stmt->execute([strtoupper(trim($code))]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function liste($filtres = [])
    {
        $sql = "SELECT p.*, 
                    (SELECT COUNT(*) FROM codes_promo_utilisations WHERE promotion_id = p.id) AS utilisations_reelles,
                    (SELECT SUM(reduction) FROM codes_promo_utilisations WHERE promotion_id = p.id) AS total_economise
                FROM codes_promo p
                WHERE 1=1";
        $params = [];

        if (!empty($filtres['actif'])) {
            $sql .= " AND p.actif = ?";
            $params[] = $filtres['actif'];
        }

        if (!empty($filtres['recherche'])) {
            $sql .= " AND (p.code LIKE ? OR p.description LIKE ?)";
            $search = '%' . $filtres['recherche'] . '%';
            $params[] = $search;
            $params[] = $search;
        }

        if (!empty($filtres['statut'])) {
            if ($filtres['statut'] === 'actives') {
                $sql .= " AND p.actif = 1 AND p.date_debut <= NOW() AND p.date_fin >= NOW()";
            } elseif ($filtres['statut'] === 'expirees') {
                $sql .= " AND p.date_fin < NOW()";
            } elseif ($filtres['statut'] === 'planifiees') {
                $sql .= " AND p.date_debut > NOW()";
            }
        }

        $sql .= " ORDER BY p.created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function listeUtilisations($promotionId = null, $limit = 100)
    {
        $sql = "SELECT u.*, p.code AS promo_code 
                FROM codes_promo_utilisations u
                JOIN codes_promo p ON p.id = u.promotion_id
                WHERE 1=1";
        $params = [];

        if ($promotionId) {
            $sql .= " AND u.promotion_id = ?";
            $params[] = $promotionId;
        }

        $sql .= " ORDER BY u.created_at DESC LIMIT " . intval($limit);

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function stats()
    {
        $stats = [];

        $stmt = $this->db->query("SELECT COUNT(*) FROM codes_promo");
        $stats['total'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("
            SELECT COUNT(*) FROM codes_promo 
            WHERE actif = 1 AND date_debut <= NOW() AND date_fin >= NOW()
        ");
        $stats['actives'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM codes_promo WHERE date_fin < NOW()");
        $stats['expirees'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM codes_promo_utilisations");
        $stats['total_utilisations'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COALESCE(SUM(reduction), 0) FROM codes_promo_utilisations");
        $stats['total_economise'] = floatval($stmt->fetchColumn());

        return $stats;
    }
}