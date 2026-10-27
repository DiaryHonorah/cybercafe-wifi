<?php
/**
 * Contrôleur Badge (CORRIGÉ)
 */

require_once __DIR__ . '/../models/Badge.php';

class BadgeController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Badge($this->db);
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
     * GET /api/client/badges
     */
    public function mesBadges()
    {
        try {
            $client = $this->verifierClient();

            // Vérifier et débloquer les nouveaux badges
            $nouveaux = [];
            try {
                $nouveaux = $this->model->verifierEtDebloquer($client['id']);
            } catch (Exception $e) {
                error_log("Erreur vérification badges: " . $e->getMessage());
                $nouveaux = [];
            }

            $mesBadges = $this->model->mesBadges($client['id']);
            $tousBadges = $this->model->listeTous();

            // Récupérer les stats du client
            try {
                $stats = $this->model->getStatsClient($client['id']);
            } catch (Exception $e) {
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
            }

            // Marquer les badges obtenus
            $badgesObtenusIds = array_column($mesBadges, 'id');

            $catalogue = [];
            foreach ($tousBadges as $badge) {
                $obtenu = in_array($badge['id'], $badgesObtenusIds);

                // Calculer progression
                $actuel = 0;
                $valeur = intval($badge['condition_valeur']);

                switch ($badge['condition_type']) {
                    case 'nb_reservations':
                        $actuel = $stats['nb_reservations'];
                        break;
                    case 'nb_visites':
                        $actuel = $stats['nb_visites'];
                        break;
                    case 'nb_parrainages':
                        $actuel = $stats['nb_parrainages'];
                        break;
                    case 'points_fidelite':
                        $actuel = $stats['points_fidelite'];
                        break;
                    case 'nb_achats':
                        $actuel = $stats['nb_achats'];
                        break;
                    case 'montant_total':
                        $actuel = $stats['montant_total'];
                        break;
                    case 'inscription_anciennete':
                        $actuel = $stats['jours_anciennete'];
                        break;
                }

                $progression = $obtenu
                    ? 100
                    : ($valeur > 0 ? min(100, round(($actuel / $valeur) * 100)) : 0);

                $badge['obtenu'] = $obtenu;
                $badge['progression'] = $progression;
                $badge['valeur_actuelle'] = $actuel;

                // Date de déblocage
                if ($obtenu) {
                    foreach ($mesBadges as $mb) {
                        if ($mb['id'] === $badge['id']) {
                            $badge['debloque_le'] = $mb['debloque_le'];
                            break;
                        }
                    }
                }

                $catalogue[] = $badge;
            }

            echo json_encode([
                'success' => true,
                'badges_obtenus' => $mesBadges,
                'catalogue' => $catalogue,
                'nouveaux_debloques' => $nouveaux,
                'stats' => $stats,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
                'catalogue' => [],
                'badges_obtenus' => [],
            ]);
        }
    }

    // =====================================================
    // ADMIN
    // =====================================================

    public function listeAdmin()
    {
        try {
            $this->verifierAdmin();

            $badges = $this->model->listeTous();
            $stats = $this->model->stats();

            foreach ($badges as &$badge) {
                $clients = $this->model->clientsAvecBadge($badge['id']);
                $badge['nb_clients'] = count($clients);
            }

            echo json_encode([
                'success' => true,
                'badges' => $badges,
                'stats' => $stats,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function creer()
    {
        try {
            $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);
            $badge = $this->model->creer($data);
            echo json_encode([
                'success' => true,
                'message' => 'Badge créé',
                'badge' => $badge,
            ]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function modifier()
    {
        try {
            $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);
            $id = intval($data['id'] ?? 0);

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $badge = $this->model->modifier($id, $data);
            echo json_encode([
                'success' => true,
                'message' => 'Badge modifié',
                'badge' => $badge,
            ]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function supprimer()
    {
        try {
            $this->verifierAdmin();
            $data = json_decode(file_get_contents('php://input'), true);
            $id = intval($data['id'] ?? 0);

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $this->model->supprimer($id);
            echo json_encode(['success' => true, 'message' => 'Badge supprimé']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // AUTH
    // =====================================================

    private function verifierClient()
    {
        $headers = $this->recupererHeaders();
        $authHeader = $headers['authorization'] ?? $headers['Authorization'] ?? '';

        $token = '';
        if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
            $token = trim($matches[1]);
        }

        if (empty($token)) {
            throw new Exception('Token client manquant');
        }

        $stmt = $this->db->prepare("
            SELECT c.*
            FROM clients_sessions cs
            JOIN clients c ON c.id = cs.client_id
            WHERE cs.token = ? AND cs.expire_le > NOW() AND c.actif = 1
        ");
        $stmt->execute([$token]);
        $client = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$client) {
            throw new Exception('Session invalide ou expirée');
        }

        return $client;
    }

    private function verifierAdmin()
    {
        $headers = $this->recupererHeaders();
        $authHeader = $headers['authorization'] ?? $headers['Authorization'] ?? '';

        $token = '';
        if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
            $token = trim($matches[1]);
        }

        if (empty($token)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Token manquant']);
            exit;
        }

        $stmt = $this->db->prepare("
            SELECT a.id, a.nom, a.email, a.role
            FROM sessions_admin s
            JOIN admins a ON a.id = s.admin_id
            WHERE s.token = ? AND s.expire_le > NOW()
        ");
        $stmt->execute([$token]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$admin) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Token invalide']);
            exit;
        }

        return $admin;
    }

    private function recupererHeaders()
    {
        if (function_exists('getallheaders')) {
            return getallheaders();
        }
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) === 'HTTP_') {
                $headerName = str_replace(' ', '-', ucwords(
                    strtolower(str_replace('_', ' ', substr($name, 5)))
                ));
                $headers[$headerName] = $value;
            }
        }
        return $headers;
    }
}