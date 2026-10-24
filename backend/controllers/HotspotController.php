<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/MikroTikService.php';

class HotspotController {

    /**
     * Récupérer la configuration du routeur
     * GET /api/hotspot/config
     */
    public function getConfig() {
        $db = (new Database())->getConnection();
        $stmt = $db->query("SELECT * FROM config_routeur WHERE id = 1 LIMIT 1");
        $config = $stmt->fetch(PDO::FETCH_ASSOC);

        // Masquer le mot de passe
        if ($config && !empty($config['password'])) {
            $config['password'] = '••••••••';
        }

        echo json_encode($config);
    }

    /**
     * Sauvegarder la configuration
     * POST /api/hotspot/config
     */
    public function saveConfig() {
        $data = json_decode(file_get_contents("php://input"), true);

        $host = $data['host'] ?? '192.168.88.1';
        $port = (int)($data['port'] ?? 8728);
        $username = $data['username'] ?? 'admin';
        $password = $data['password'] ?? '';
        $hotspotServer = $data['hotspot_server'] ?? 'hotspot1';
        $actif = !empty($data['actif']) ? 1 : 0;

        $db = (new Database())->getConnection();

        // Si le mot de passe est masqué (••••), ne pas le modifier
        if ($password === '••••••••') {
            $stmt = $db->prepare("
                UPDATE config_routeur
                SET host = ?, port = ?, username = ?, hotspot_server = ?, actif = ?
                WHERE id = 1
            ");
            $ok = $stmt->execute([$host, $port, $username, $hotspotServer, $actif]);
        } else {
            $stmt = $db->prepare("
                UPDATE config_routeur
                SET host = ?, port = ?, username = ?, password = ?, hotspot_server = ?, actif = ?
                WHERE id = 1
            ");
            $ok = $stmt->execute([$host, $port, $username, $password, $hotspotServer, $actif]);
        }

        echo json_encode(["success" => $ok]);
    }

    /**
     * Tester la connexion au routeur
     * POST /api/hotspot/tester
     */
    public function tester() {
        $service = new MikroTikService();
        echo json_encode($service->testerConnexion());
    }

    /**
     * Créer un utilisateur Hotspot manuellement
     * POST /api/hotspot/utilisateur
     */
    public function creerUtilisateur() {
        $data = json_decode(file_get_contents("php://input"), true);
        $code = $data['code'] ?? '';
        $mdp = $data['mot_de_passe'] ?? '';
        $duree = (int)($data['duree_minutes'] ?? 60);

        if (!$code || !$mdp) {
            http_response_code(400);
            echo json_encode(["erreur" => "Code et mot de passe requis"]);
            return;
        }

        $service = new MikroTikService();
        $ok = $service->creerUtilisateur($code, $mdp, $duree);

        echo json_encode([
            "success" => $ok,
            "simulation" => $service->isSimulation(),
            "message" => $ok ? "Utilisateur créé" : "Échec de création"
        ]);
    }

    /**
     * Supprimer un utilisateur Hotspot
     * POST /api/hotspot/supprimer
     */
    public function supprimerUtilisateur() {
        $data = json_decode(file_get_contents("php://input"), true);
        $code = $data['code'] ?? '';

        if (!$code) {
            http_response_code(400);
            echo json_encode(["erreur" => "Code requis"]);
            return;
        }

        $service = new MikroTikService();
        $ok = $service->supprimerUtilisateur($code);
        $service->deconnecterSession($code);

        echo json_encode([
            "success" => $ok,
            "simulation" => $service->isSimulation()
        ]);
    }
}