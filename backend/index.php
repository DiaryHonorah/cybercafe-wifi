<?php
/**
 * API Cyber Famille — Point d'entrée principal
 * Version 3.7 - Sécurité renforcée
 */

// ============================================
// SÉCURITÉ : En-têtes HTTP
// ============================================
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
header("Referrer-Policy: strict-origin-when-cross-origin");

// ============================================
// SÉCURITÉ : Limiter les méthodes autorisées
// ============================================
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])) {
    http_response_code(405);
    echo json_encode(["erreur" => "Méthode non autorisée"]);
    exit;
}

// ============================================
// CORS : Répondre aux requêtes préflight
// ============================================
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ============================================
// SÉCURITÉ : Timezone
// ============================================
date_default_timezone_set('Indian/Antananarivo');

// ============================================
// SÉCURITÉ : Masquer les erreurs en production
// ============================================
$estDeveloppement = (
    ($_SERVER['SERVER_NAME'] ?? '') === 'localhost' ||
    ($_SERVER['SERVER_NAME'] ?? '') === '127.0.0.1'
);

if ($estDeveloppement) {
    error_reporting(E_ALL);
    ini_set('display_errors', 0); // ⚠️ IMPORTANT : ne jamais afficher les erreurs dans le JSON
    ini_set('log_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
}

// ============================================
// SÉCURITÉ : Vérifier la taille du POST
// ⚠️ Correction : utiliser isset() au lieu d'accéder directement
// ============================================
$tailleMax = 10 * 1024 * 1024; // 10 Mo
$contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int)$_SERVER['CONTENT_LENGTH'] : 0;

if ($contentLength > $tailleMax) {
    http_response_code(413);
    echo json_encode(["erreur" => "Contenu trop volumineux"]);
    exit;
}

// ============================================
// CHARGER LES ROUTES
// ============================================
require_once __DIR__ . '/routes/api.php';


// =====================================================
// SÉCURITÉ (ajouté en premier)
// =====================================================

// Configurer le niveau d'erreur
ini_set('display_errors', 0); // Désactiver l'affichage des erreurs en production
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);

// ===== Headers de sécurité =====
require_once __DIR__ . '/middlewares/SecurityHeaders.php';
SecurityHeaders::appliquer();

// ===== Configuration session sécurisée =====
require_once __DIR__ . '/config/security.php';
$securityConfig = require __DIR__ . '/config/security.php';

if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', $securityConfig['cookie_httponly'] ? 1 : 0);
    ini_set('session.cookie_secure', $securityConfig['cookie_secure'] ? 1 : 0);
    ini_set('session.cookie_samesite', $securityConfig['cookie_samesite']);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_path', '/');
}

// ===== Rate limiting + détection =====
require_once __DIR__ . '/middlewares/RateLimit.php';
require_once __DIR__ . '/services/SecurityService.php';

try {
    require_once __DIR__ . '/config/database.php';
    $db = (new Database())->getConnection();
    
    // Vérifier la sécurité de la requête (XSS, injection)
    SecurityService::verifierRequete($db);
    
    // Vérifier le rate limit
    $rateLimit = new RateLimit($db);
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $uri = str_replace('/cybercafe-wifi/backend', '', $uri);
    $methode = $_SERVER['REQUEST_METHOD'];
    
    // Ne pas appliquer le rate limit sur l'API racine et les options
    if ($uri !== '/api' && $uri !== '/' && $methode !== 'OPTIONS') {
        $rateLimit->verifier($uri, $methode);
    }
} catch (Exception $e) {
    // En cas d'erreur BDD, on continue (le contrôleur gérera l'erreur)
    error_log("Erreur sécurité : " . $e->getMessage());
}

// =====================================================
// SUITE DU FICHIER (ne pas toucher)
// =====================================================
// ... ton code existant (require routes/api.php, etc.)