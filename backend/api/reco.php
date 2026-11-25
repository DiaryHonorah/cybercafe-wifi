<?php
/**
 * API Recommandation
 * Point d'entrée : http://localhost/cybercafe-wifi/backend/api/reco.php
 *
 * Routes disponibles :
 *   GET  ?action=recommandations            → Recommandations (client ou populaires)
 *   POST ?action=track                       → Enregistrer une interaction
 *   GET  ?action=profil                      → Profil du client connecté
 *
 *   --- ADMIN (token requis) ---
 *   GET  ?action=admin/config                → Lire config
 *   POST ?action=admin/config                → Sauver config
 *   GET  ?action=admin/stats                 → Statistiques
 *   GET  ?action=admin/interactions          → Historique interactions
 *   POST ?action=admin/vider-cache           → Vider le cache
 *   GET  ?action=admin/services-meta         → Liste métadonnées services
 *   POST ?action=admin/services-meta         → Sauver métadonnées service
 */

// =====================================================
// CORS
// =====================================================
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// =====================================================
// CHARGEMENT
// =====================================================
require_once __DIR__ . '/../controllers/RecommandationController.php';

// =====================================================
// ROUTAGE
// =====================================================
$action = $_GET['action'] ?? '';
$methode = $_SERVER['REQUEST_METHOD'];

try {
    $controller = new RecommandationController();

    switch ($action) {

        // ---------- PUBLIC / CLIENT ----------
        case 'recommandations':
            if ($methode !== 'GET') throw new Exception("Méthode non autorisée");
            $controller->getRecommandations();
            break;

        case 'track':
            if ($methode !== 'POST') throw new Exception("Méthode non autorisée");
            $controller->track();
            break;

        case 'profil':
            if ($methode !== 'GET') throw new Exception("Méthode non autorisée");
            $controller->getMonProfil();
            break;

        // ---------- ADMIN ----------
        case 'admin/config':
            if ($methode === 'GET') {
                $controller->getConfig();
            } elseif ($methode === 'POST') {
                $controller->saveConfig();
            } else {
                throw new Exception("Méthode non autorisée");
            }
            break;

        case 'admin/stats':
            if ($methode !== 'GET') throw new Exception("Méthode non autorisée");
            $controller->getStats();
            break;

        case 'admin/interactions':
            if ($methode !== 'GET') throw new Exception("Méthode non autorisée");
            $controller->getInteractions();
            break;

        case 'admin/vider-cache':
            if ($methode !== 'POST') throw new Exception("Méthode non autorisée");
            $controller->viderCache();
            break;

        case 'admin/services-meta':
            if ($methode === 'GET') {
                $controller->getServicesMeta();
            } elseif ($methode === 'POST') {
                $controller->saveServiceMeta();
            } else {
                throw new Exception("Méthode non autorisée");
            }
            break;

        // ---------- DEFAULT ----------
        default:
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Action inconnue',
                'actions_disponibles' => [
                    'recommandations', 'track', 'profil',
                    'admin/config', 'admin/stats', 'admin/interactions',
                    'admin/vider-cache', 'admin/services-meta',
                ],
            ]);
            break;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
}