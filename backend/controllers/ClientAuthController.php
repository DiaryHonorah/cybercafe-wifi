<?php
/**
 * Contrôleur ClientAuth (avec parrainage)
 */

require_once __DIR__ . '/../models/Client.php';
require_once __DIR__ . '/../models/Parrainage.php';

class ClientAuthController
{
    private $db;
    private $model;
    private $parrainageModel;

    public function __construct()
    {
        $this->db = $this->connecter();
        $this->model = new Client($this->db);
        $this->parrainageModel = new Parrainage($this->db);
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
     * POST /api/client/auth/inscription
     */
    public function inscription()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Données invalides']);
                return;
            }

            // Code de parrainage utilisé
            $codeParrainage = !empty($data['code_parrainage']) ? trim($data['code_parrainage']) : null;

            // Créer le client
            $client = $this->model->inscrire($data);

            // Générer son propre code de parrainage
            $this->parrainageModel->assurerCodeParrainage($client['id']);

            // Traiter le parrainage si code fourni
            $parrainage = null;
            if ($codeParrainage) {
                try {
                    $parrainage = $this->parrainageModel->traiterParrainage(
                        $client['id'],
                        $codeParrainage
                    );
                } catch (Exception $e) {
                    // Ne pas bloquer l'inscription si le parrainage échoue
                    error_log("Erreur parrainage : " . $e->getMessage());
                }
            }

            // Créer la session
            $resultat = $this->model->connexion($data['email'], $data['mot_de_passe']);

            // Rafraîchir le client (pour avoir les nouveaux champs)
            $client = $this->model->trouverParId($client['id']);

            echo json_encode([
                'success' => true,
                'message' => 'Inscription réussie',
                'client' => $client,
                'token' => $resultat['token'],
                'parrainage' => $parrainage,
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/client/auth/connexion
     */
    public function connexion()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            $email = trim($data['email'] ?? '');
            $motDePasse = $data['mot_de_passe'] ?? '';

            if (empty($email) || empty($motDePasse)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Email et mot de passe requis']);
                return;
            }

            $resultat = $this->model->connexion($email, $motDePasse);

            // Assurer que le client a un code de parrainage
            $this->parrainageModel->assurerCodeParrainage($resultat['client']['id']);

            // Recharger le client
            $client = $this->model->trouverParId($resultat['client']['id']);

            echo json_encode([
                'success' => true,
                'message' => 'Connexion réussie',
                'client' => $client,
                'token' => $resultat['token'],
            ]);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/client/auth/verifier
     */
    public function verifier()
    {
        try {
            $token = $this->getToken();
            
            if (empty($token)) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Token manquant']);
                return;
            }

            $client = $this->model->verifierToken($token);

            // Assurer code parrainage
            $this->parrainageModel->assurerCodeParrainage($client['id']);
            $client = $this->model->trouverParId($client['id']);

            echo json_encode([
                'success' => true,
                'client' => $client,
            ]);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/client/auth/deconnexion
     */
    public function deconnexion()
    {
        try {
            $token = $this->getToken();
            if (!empty($token)) {
                $this->model->deconnexion($token);
            }

            echo json_encode(['success' => true, 'message' => 'Déconnexion réussie']);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    private function getToken()
    {
        $headers = $this->recupererHeaders();
        $authHeader = $headers['authorization'] ?? $headers['Authorization'] ?? '';
        
        if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
            return trim($matches[1]);
        }
        return '';
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