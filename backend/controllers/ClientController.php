<?php
/**
 * Contrôleur Client
 * Données personnelles du client connecté
 */

require_once __DIR__ . '/../models/Client.php';

class ClientController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Client($this->db);
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
     * GET /api/client/mon-profil
     */
    public function monProfil()
    {
        try {
            $client = $this->verifierClient();

            echo json_encode(['success' => true, 'client' => $client]);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/client/modifier-profil
     */
    public function modifierProfil()
    {
        try {
            $client = $this->verifierClient();
            $data = json_decode(file_get_contents('php://input'), true);

            $client = $this->model->modifier($client['id'], $data);

            echo json_encode([
                'success' => true,
                'message' => 'Profil mis à jour',
                'client' => $client,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/client/changer-mot-de-passe
     */
    public function changerMotDePasse()
    {
        try {
            $client = $this->verifierClient();
            $data = json_decode(file_get_contents('php://input'), true);

            $this->model->changerMotDePasse(
                $client['id'],
                $data['ancien_mot_de_passe'] ?? '',
                $data['nouveau_mot_de_passe'] ?? ''
            );

            echo json_encode(['success' => true, 'message' => 'Mot de passe modifié']);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/client/mes-reservations
     */
    public function mesReservations()
    {
        try {
            $client = $this->verifierClient();

            // Chercher par email ou téléphone
            $stmt = $this->db->prepare("
                SELECT * FROM reservations 
                WHERE email = ? OR telephone = ?
                ORDER BY created_at DESC 
                LIMIT 50
            ");
            $stmt->execute([$client['email'], $client['telephone']]);
            $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'reservations' => $reservations,
            ]);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/client/ma-carte-fidelite
     */
    public function maCarteFidelite()
    {
        try {
            $client = $this->verifierClient();

            // Chercher la carte par téléphone
            $stmt = $this->db->prepare("
                SELECT * FROM cartes_fidelite 
                WHERE client_telephone = ?
                LIMIT 1
            ");
            $stmt->execute([$client['telephone']]);
            $carte = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($carte) {
                $carte['points_disponibles'] = intval($carte['points_total']) - intval($carte['points_utilises']);
                $carte['niveau'] = $this->calculerNiveau(intval($carte['points_total']));

                // Historique
                $stmt = $this->db->prepare("
                    SELECT * FROM historique_points 
                    WHERE carte_id = ? 
                    ORDER BY created_at DESC 
                    LIMIT 20
                ");
                $stmt->execute([$carte['id']]);
                $carte['historique'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }

            echo json_encode([
                'success' => true,
                'carte' => $carte,
            ]);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/client/mes-notifications
     */
    public function mesNotifications()
    {
        try {
            $client = $this->verifierClient();

            $notifications = $this->model->getNotifications($client['id'], 50);
            $nonLues = $this->model->compterNotificationsNonLues($client['id']);

            echo json_encode([
                'success' => true,
                'notifications' => $notifications,
                'non_lues' => $nonLues,
            ]);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/client/notifications/lire
     */
    public function marquerNotificationLue()
    {
        try {
            $client = $this->verifierClient();
            $data = json_decode(file_get_contents('php://input'), true);
            $notifId = intval($data['id'] ?? 0);

            if ($notifId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $this->model->marquerNotificationLue($notifId, $client['id']);

            echo json_encode(['success' => true]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // =====================================================
    // HELPERS
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
            throw new Exception('Token manquant');
        }

        return $this->model->verifierToken($token);
    }

    private function calculerNiveau($points)
    {
        if ($points >= 20000) return 'platine';
        if ($points >= 5000) return 'or';
        if ($points >= 1000) return 'argent';
        return 'bronze';
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