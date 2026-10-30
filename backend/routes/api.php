<?php
// =====================================================
// HEADERS CORS + SESSION
// =====================================================
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$originesAutorisees = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];

if (in_array($origin, $originesAutorisees)) {
    header("Access-Control-Allow-Origin: $origin");
} elseif (!empty($origin)) {
    header("Access-Control-Allow-Origin: http://localhost:5173");
} else {
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 3600");
header("Vary: Origin");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_samesite', 'Lax');
    ini_set('session.cookie_path', '/');
    session_start();
}

// =====================================================
// ROUTEUR
// =====================================================
$basePath = '/cybercafe-wifi/backend';
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = str_replace($basePath, '', $uri);
$method = $_SERVER['REQUEST_METHOD'];

if ($uri === '/' || $uri === '/api' || $uri === '/api/') {
    echo json_encode([
        "message" => "API Cybercafé opérationnelle ✅",
        "version" => "8.5",
        "routes" => [
            "== Auth Admin ==",
            "POST /api/auth/login",
            "GET  /api/auth/verifier",
            "POST /api/auth/logout",

            "== Client Auth ==",
            "POST /api/client/auth/inscription    (public)",
            "POST /api/client/auth/connexion      (public)",
            "GET  /api/client/auth/verifier       (client)",
            "POST /api/client/auth/deconnexion    (client)",

            "== Client Espace ==",
            "GET  /api/client/mon-profil          (client)",
            "POST /api/client/modifier-profil     (client)",
            "POST /api/client/changer-mot-de-passe (client)",
            "GET  /api/client/mes-reservations    (client)",
            "GET  /api/client/ma-carte-fidelite   (client)",
            "GET  /api/client/mes-notifications   (client)",
            "POST /api/client/notifications/lire  (client)",

            "== Parrainage ==",
            "GET  /api/parrainage/verifier-code?code=XXX (public)",
            "GET  /api/client/parrainage/mes-stats (client)",
            "GET  /api/parrainage/admin/liste      (admin)",
            "POST /api/parrainage/admin/valider    (admin)",
            "POST /api/parrainage/admin/annuler    (admin)",

            "== Badges ==",
            "GET  /api/client/badges              (client)",
            "GET  /api/badges/admin/liste         (admin)",
            "POST /api/badges/admin/creer         (admin)",
            "POST /api/badges/admin/modifier      (admin)",
            "POST /api/badges/admin/supprimer     (admin)",

            "== VIP ==",
            "GET  /api/client/vip/mon-abonnement  (client)",
            "POST /api/client/vip/souscrire       (client)",
            "POST /api/client/vip/renouveler      (client)",
            "GET  /api/vip/admin/liste            (admin)",
            "POST /api/vip/admin/annuler          (admin)",
            "POST /api/vip/admin/activer          (admin)",

            "== Roue de la fortune ==",
            "GET  /api/client/roue/etat           (client)",
            "POST /api/client/roue/jouer          (client)",
            "GET  /api/roue/admin/stats           (admin)",

            "== Transactions bonus ==",
            "GET  /api/client/transactions         (client)",
            "GET  /api/client/transactions/export  (client - CSV)",
            "GET  /api/transactions/admin/liste    (admin)",
            "POST /api/transactions/admin/ajuster  (admin)",

            "== Portefeuille ==",
            "GET  /api/client/portefeuille         (client)",
            "POST /api/client/portefeuille/demander (client)",
            "GET  /api/client/portefeuille/demandes (client)",
            "GET  /api/client/portefeuille/transactions (client)",
            "GET  /api/portefeuille/admin/stats    (admin)",
            "GET  /api/portefeuille/admin/demandes (admin)",
            "POST /api/portefeuille/admin/valider  (admin)",
            "POST /api/portefeuille/admin/rejeter  (admin)",
            "GET  /api/portefeuille/admin/liste    (admin)",

            "== Avis clients ==",
            "GET  /api/avis                        (public)",
            "GET  /api/avis/config                 (public)",
            "POST /api/avis                        (public)",
            "POST /api/avis/utile                  (public)",
            "GET  /api/client/avis/mes-avis        (client)",
            "GET  /api/avis/admin/liste            (admin)",
            "POST /api/avis/admin/valider          (admin)",
            "POST /api/avis/admin/rejeter          (admin)",
            "POST /api/avis/admin/repondre         (admin)",
            "POST /api/avis/admin/supprimer        (admin)",

            "== Support (Client) ==",
            "GET  /api/client/support/tickets          (client)",
            "POST /api/client/support/tickets          (client)",
            "GET  /api/client/support/tickets/{id}     (client)",
            "POST /api/client/support/tickets/{id}/messages (client)",
            "POST /api/client/support/tickets/{id}/noter    (client)",
            "GET  /api/client/support/non-lus          (client)",

            "== Support (Admin) ==",
            "GET  /api/support/admin/tickets           (admin)",
            "GET  /api/support/admin/tickets/{id}      (admin)",
            "POST /api/support/admin/tickets/{id}/messages (admin)",
            "POST /api/support/admin/tickets/{id}/statut   (admin)",
            "POST /api/support/admin/tickets/{id}/priorite (admin)",
            "POST /api/support/admin/tickets/{id}/supprimer (admin)",
            "GET  /api/support/admin/non-lus           (admin)",

            "== Profil Admin ==",
            "GET  /api/profil/mon-profil           (admin)",
            "POST /api/profil/modifier             (admin)",
            "POST /api/profil/upload-avatar        (admin)",
            "POST /api/profil/supprimer-avatar     (admin)",
            "POST /api/profil/changer-mot-de-passe (admin)",

            "== 2FA ==",
            "POST /api/2fa/generer",
            "POST /api/2fa/activer",
            "POST /api/2fa/verifier",
            "POST /api/2fa/desactiver",
            "GET  /api/2fa/statut",

            "== Sessions Actives ==",
            "GET  /api/sessions-actives",
            "POST /api/sessions-actives/revoquer",
            "POST /api/sessions-actives/revoquer-autres",
            "GET  /api/sessions-actives/stats",
            "POST /api/sessions-actives/nettoyer",

            "== Health ==",
            "GET  /api/health",
            "GET  /api/health/ping",

            "== Dashboard ==",
            "GET  /api/dashboard",
            "GET  /api/dashboard/transactions",
            "GET  /api/dashboard/graphique",

            "== Stats Temps Réel ==",
            "GET  /api/stats-temps-reel/comparaison",
            "GET  /api/stats-temps-reel/top-heures",
            "GET  /api/stats-temps-reel/flux",
            "GET  /api/stats-temps-reel/alertes",
            "GET  /api/stats-temps-reel/resume",

            "== Rapport PDF ==",
            "GET  /api/rapport-pdf",

            "== Notifications Externes ==",
            "GET  /api/notifications-externes/config",
            "POST /api/notifications-externes/config",
            "POST /api/notifications-externes/test-email",
            "POST /api/notifications-externes/test-sms",
            "POST /api/notifications-externes/envoyer-email",
            "GET  /api/notifications-externes/historique",
            "GET  /api/notifications-externes/stats",

            "== Cron ==",
            "GET  /api/cron/rapport-journalier",
            "GET  /api/cron/verifier-alertes",

            "== Forfaits / Tickets ==",
            "GET  /api/forfaits",
            "POST /api/tickets/creer",

            "== Sessions ==",
            "POST /api/sessions/demarrer",
            "GET  /api/sessions",
            "POST /api/sessions/terminer",
            "GET  /api/sessions/statut",

            "== Caisses ==",
            "GET  /api/caisses",
            "POST /api/caisses/creer",
            "POST /api/caisses/modifier",
            "POST /api/caisses/supprimer",
            "POST /api/caisses/ouvrir",
            "POST /api/caisses/fermer",
            "GET  /api/caisses/session",
            "GET  /api/caisses/stats",

            "== Hotspot ==",
            "GET  /api/hotspot/config",
            "POST /api/hotspot/config",
            "POST /api/hotspot/tester",
            "POST /api/hotspot/utilisateur",
            "POST /api/hotspot/supprimer",

            "== Statistiques ==",
            "GET  /api/statistiques",
            "GET  /api/statistiques/resume",
            "GET  /api/statistiques/top-forfaits",
            "GET  /api/statistiques/graphique",
            "GET  /api/statistiques/previsions",
            "GET  /api/statistiques/comparaison",
            "GET  /api/statistiques/top-clients",
            "GET  /api/statistiques/heures-pointe",
            "GET  /api/statistiques/repartition-forfaits",
            "GET  /api/statistiques/jours-semaine",

            "== Admins ==",
            "GET  /api/admins",
            "POST /api/admins/creer",
            "POST /api/admins/modifier",
            "POST /api/admins/supprimer",

            "== Sites ==",
            "GET  /api/sites",
            "POST /api/sites/creer",
            "POST /api/sites/modifier",
            "POST /api/sites/supprimer",
            "GET  /api/sites/comparaison",

            "== Export / Rapport ==",
            "GET  /api/export/csv",
            "GET  /api/export/resume",
            "GET  /api/rapport",

            "== Notifications Admin ==",
            "GET  /api/notifications",
            "GET  /api/notifications/non-lues",
            "POST /api/notifications/lire",
            "POST /api/notifications/lire-une",

            "== Paramètres ==",
            "GET  /api/parametres",
            "POST /api/parametres",

            "== QR Code ==",
            "GET  /api/qrcode",
            "GET  /api/qrcode/ticket",
            "GET  /api/qrcode/image",

            "== Impression ==",
            "POST /api/impression/ticket",
            "POST /api/impression/tester",
            "POST /api/impression/test",

            "== Sauvegardes ==",
            "POST /api/backup/creer",
            "GET  /api/backup/liste",
            "GET  /api/backup/telecharger",
            "POST /api/backup/supprimer",
            "GET  /api/backup/config",
            "POST /api/backup/config",
            "GET  /api/backup/auto",

            "== Codes Promo ==",
            "POST /api/promotions/valider         (public)",
            "GET  /api/promotions/actives         (public)",
            "GET  /api/promotions/admin/liste     (admin)",
            "GET  /api/promotions/admin/utilisations (admin)",
            "POST /api/promotions/admin/creer     (admin)",
            "POST /api/promotions/admin/modifier  (admin)",
            "POST /api/promotions/admin/supprimer (admin)",
            "POST /api/promotions/admin/toggle    (admin)",

            "== Galerie ==",
            "GET  /api/galerie/photos            (public)",
            "GET  /api/galerie/admin/photos       (admin)",
            "POST /api/galerie/admin/upload       (admin)",
            "POST /api/galerie/admin/modifier     (admin)",
            "POST /api/galerie/admin/supprimer    (admin)",
            "POST /api/galerie/admin/toggle       (admin)",

            "== Monitoring ==",
            "GET  /api/monitoring/dashboard       (admin)",
            "GET  /api/monitoring/alertes         (admin)",
            "POST /api/monitoring/alertes/lire    (admin)",
            "POST /api/monitoring/alertes/resoudre (admin)",
            "GET  /api/monitoring/erreurs         (admin)",
            "GET  /api/monitoring/non-lues        (admin)",
            "POST /api/monitoring/check           (admin)",

            "== WebSocket ==",
            "POST /api/websocket/envoyer",
            "GET  /api/websocket/statut",

            "== Reçus ==",
            "POST /api/recu/client",
            "GET  /api/recu",
            "GET  /api/recu/dernier",

            "== Logs ==",
            "GET  /api/logs",
            "GET  /api/logs/stats",
            "POST /api/logs/nettoyer",

            "== Contact (Public) ==",
            "POST /api/contact",

            "== Réservations ==",
            "POST /api/reservations                (public)",
            "GET  /api/reservations                (admin)",
            "GET  /api/reservations/stats          (admin)",
            "GET  /api/reservations/detail?code=XX (public)",
            "POST /api/reservations/confirmer      (admin)",
            "POST /api/reservations/annuler        (admin)",
            "POST /api/reservations/terminer       (admin)",
            "POST /api/reservations/supprimer      (admin)",

            "== Fidélité ==",
            "POST /api/fidelite/inscription        (public)",
            "GET  /api/fidelite/carte?code=FID-XXX (public)",
            "GET  /api/fidelite/recompenses        (public)",
            "GET  /api/fidelite                    (admin)",
            "GET  /api/fidelite/stats              (admin)",
            "POST /api/fidelite/ajouter-points     (admin)",
            "POST /api/fidelite/utiliser-recompense (admin)",
            "POST /api/fidelite/toggle-actif       (admin)",
            "POST /api/fidelite/supprimer          (admin)",
            "GET  /api/fidelite/historique?carte_id=X (admin)",

            "== Blog ==",
            "GET  /api/blog/articles               (public)",
            "GET  /api/blog/article?slug=XXX       (public)",
            "GET  /api/blog/categories             (public)",
            "GET  /api/blog/admin/articles         (admin)",
            "GET  /api/blog/admin/article?id=X     (admin)",
            "GET  /api/blog/admin/stats            (admin)",
            "POST /api/blog/admin/creer            (admin)",
            "POST /api/blog/admin/modifier         (admin)",
            "POST /api/blog/admin/supprimer        (admin)",

            "== Newsletter ==",
            "POST /api/newsletter/inscription      (public)",
            "GET  /api/newsletter/confirmer?token=X (public)",
            "GET  /api/newsletter/desinscrire?email=X (public)",
            "GET  /api/newsletter/stats-publiques  (public)",
            "GET  /api/newsletter/admin/abonnes    (admin)",
            "GET  /api/newsletter/admin/stats      (admin)",
            "POST /api/newsletter/admin/supprimer  (admin)",
            "POST /api/newsletter/admin/envoyer    (admin)",
            "GET  /api/newsletter/admin/envois     (admin)",

            "== Chat ==",
            "POST /api/chat/init                   (public)",
            "POST /api/chat/envoyer                (public)",
            "GET  /api/chat/messages?token=X&apres=Y (public)",
            "GET  /api/chat/admin/conversations    (admin)",
            "GET  /api/chat/admin/conversation?id=X (admin)",
            "POST /api/chat/admin/repondre         (admin)",
            "GET  /api/chat/admin/messages?id=X&apres=Y (admin)",
            "POST /api/chat/admin/fermer           (admin)",
            "POST /api/chat/admin/rouvrir          (admin)",
            "POST /api/chat/admin/supprimer        (admin)",
            "POST /api/chat/admin/toggle-bot       (admin)",
            "GET  /api/chat/admin/non-lus          (admin)",
            "GET  /api/chat/admin/stats            (admin)"
        ]
    ]);
    return;
}

switch (true) {
    // ===== AUTH ADMIN =====
    case $uri === '/api/auth/login' && $method === 'POST':
        require_once __DIR__ . '/../controllers/AuthController.php';
        (new AuthController())->login();
        break;

    case $uri === '/api/auth/verifier' && $method === 'GET':
        require_once __DIR__ . '/../controllers/AuthController.php';
        (new AuthController())->verifier();
        break;

    case $uri === '/api/auth/logout' && $method === 'POST':
        require_once __DIR__ . '/../controllers/AuthController.php';
        (new AuthController())->logout();
        break;

    // ===== CLIENT AUTH =====
    case $uri === '/api/client/auth/inscription' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ClientAuthController.php';
        (new ClientAuthController())->inscription();
        break;

    case $uri === '/api/client/auth/connexion' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ClientAuthController.php';
        (new ClientAuthController())->connexion();
        break;

    case $uri === '/api/client/auth/verifier' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ClientAuthController.php';
        (new ClientAuthController())->verifier();
        break;

    case $uri === '/api/client/auth/deconnexion' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ClientAuthController.php';
        (new ClientAuthController())->deconnexion();
        break;

    // ===== CLIENT ESPACE =====
    case $uri === '/api/client/mon-profil' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ClientController.php';
        (new ClientController())->monProfil();
        break;

    case $uri === '/api/client/modifier-profil' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ClientController.php';
        (new ClientController())->modifierProfil();
        break;

    case $uri === '/api/client/changer-mot-de-passe' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ClientController.php';
        (new ClientController())->changerMotDePasse();
        break;

    case $uri === '/api/client/mes-reservations' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ClientController.php';
        (new ClientController())->mesReservations();
        break;

    case $uri === '/api/client/ma-carte-fidelite' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ClientController.php';
        (new ClientController())->maCarteFidelite();
        break;

    case $uri === '/api/client/mes-notifications' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ClientController.php';
        (new ClientController())->mesNotifications();
        break;

    case $uri === '/api/client/notifications/lire' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ClientController.php';
        (new ClientController())->marquerNotificationLue();
        break;

    // ===== PARRAINAGE =====
    case $uri === '/api/parrainage/verifier-code' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ParrainageController.php';
        (new ParrainageController())->verifierCode();
        break;

    case $uri === '/api/client/parrainage/mes-stats' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ParrainageController.php';
        (new ParrainageController())->mesStats();
        break;

    case $uri === '/api/parrainage/admin/liste' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ParrainageController.php';
        (new ParrainageController())->listeAdmin();
        break;

    case $uri === '/api/parrainage/admin/valider' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ParrainageController.php';
        (new ParrainageController())->valider();
        break;

    case $uri === '/api/parrainage/admin/annuler' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ParrainageController.php';
        (new ParrainageController())->annuler();
        break;

    // ===== BADGES =====
    case $uri === '/api/client/badges' && $method === 'GET':
        require_once __DIR__ . '/../controllers/BadgeController.php';
        (new BadgeController())->mesBadges();
        break;

    case $uri === '/api/badges/admin/liste' && $method === 'GET':
        require_once __DIR__ . '/../controllers/BadgeController.php';
        (new BadgeController())->listeAdmin();
        break;

    case $uri === '/api/badges/admin/creer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/BadgeController.php';
        (new BadgeController())->creer();
        break;

    case $uri === '/api/badges/admin/modifier' && $method === 'POST':
        require_once __DIR__ . '/../controllers/BadgeController.php';
        (new BadgeController())->modifier();
        break;

    case $uri === '/api/badges/admin/supprimer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/BadgeController.php';
        (new BadgeController())->supprimer();
        break;

    // ===== VIP =====
    case $uri === '/api/client/vip/mon-abonnement' && $method === 'GET':
        require_once __DIR__ . '/../controllers/VipController.php';
        (new VipController())->monAbonnement();
        break;

    case $uri === '/api/client/vip/souscrire' && $method === 'POST':
        require_once __DIR__ . '/../controllers/VipController.php';
        (new VipController())->souscrire();
        break;

    case $uri === '/api/client/vip/renouveler' && $method === 'POST':
        require_once __DIR__ . '/../controllers/VipController.php';
        (new VipController())->renouveler();
        break;

    case $uri === '/api/vip/admin/liste' && $method === 'GET':
        require_once __DIR__ . '/../controllers/VipController.php';
        (new VipController())->listeAdmin();
        break;

    case $uri === '/api/vip/admin/annuler' && $method === 'POST':
        require_once __DIR__ . '/../controllers/VipController.php';
        (new VipController())->annuler();
        break;

    case $uri === '/api/vip/admin/activer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/VipController.php';
        (new VipController())->activerManuellement();
        break;

    // ===== ROUE =====
    case $uri === '/api/client/roue/etat' && $method === 'GET':
        require_once __DIR__ . '/../controllers/RoueController.php';
        (new RoueController())->etat();
        break;

    case $uri === '/api/client/roue/jouer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/RoueController.php';
        (new RoueController())->jouer();
        break;

    case $uri === '/api/roue/admin/stats' && $method === 'GET':
        require_once __DIR__ . '/../controllers/RoueController.php';
        (new RoueController())->statsAdmin();
        break;

    // ===== TRANSACTIONS BONUS =====
    case $uri === '/api/client/transactions' && $method === 'GET':
        require_once __DIR__ . '/../controllers/TransactionController.php';
        (new TransactionController())->mesTransactions();
        break;

    case $uri === '/api/client/transactions/export' && $method === 'GET':
        require_once __DIR__ . '/../controllers/TransactionController.php';
        (new TransactionController())->exportCSV();
        break;

    case $uri === '/api/transactions/admin/liste' && $method === 'GET':
        require_once __DIR__ . '/../controllers/TransactionController.php';
        (new TransactionController())->listeAdmin();
        break;

    case $uri === '/api/transactions/admin/ajuster' && $method === 'POST':
        require_once __DIR__ . '/../controllers/TransactionController.php';
        (new TransactionController())->ajuster();
        break;

    // ===== PORTEFEUILLE =====
    case $uri === '/api/client/portefeuille' && $method === 'GET':
        require_once __DIR__ . '/../controllers/PortefeuilleController.php';
        (new PortefeuilleController())->monPortefeuille();
        break;

    case $uri === '/api/client/portefeuille/demander' && $method === 'POST':
        require_once __DIR__ . '/../controllers/PortefeuilleController.php';
        (new PortefeuilleController())->demanderRechargement();
        break;

    case $uri === '/api/client/portefeuille/demandes' && $method === 'GET':
        require_once __DIR__ . '/../controllers/PortefeuilleController.php';
        (new PortefeuilleController())->mesDemandes();
        break;

    case $uri === '/api/client/portefeuille/transactions' && $method === 'GET':
        require_once __DIR__ . '/../controllers/PortefeuilleController.php';
        (new PortefeuilleController())->mesTransactions();
        break;

    case $uri === '/api/portefeuille/admin/stats' && $method === 'GET':
        require_once __DIR__ . '/../controllers/PortefeuilleController.php';
        (new PortefeuilleController())->adminStats();
        break;

    case $uri === '/api/portefeuille/admin/demandes' && $method === 'GET':
        require_once __DIR__ . '/../controllers/PortefeuilleController.php';
        (new PortefeuilleController())->adminDemandes();
        break;

    case $uri === '/api/portefeuille/admin/valider' && $method === 'POST':
        require_once __DIR__ . '/../controllers/PortefeuilleController.php';
        (new PortefeuilleController())->adminValider();
        break;

    case $uri === '/api/portefeuille/admin/rejeter' && $method === 'POST':
        require_once __DIR__ . '/../controllers/PortefeuilleController.php';
        (new PortefeuilleController())->adminRejeter();
        break;

    case $uri === '/api/portefeuille/admin/liste' && $method === 'GET':
        require_once __DIR__ . '/../controllers/PortefeuilleController.php';
        (new PortefeuilleController())->adminListePortefeuilles();
        break;

    // ===== AVIS =====
    case $uri === '/api/avis' && $method === 'GET':
        require_once __DIR__ . '/../controllers/AvisController.php';
        (new AvisController())->listePublique();
        break;

    case $uri === '/api/avis' && $method === 'POST':
        require_once __DIR__ . '/../controllers/AvisController.php';
        (new AvisController())->creer();
        break;

    case $uri === '/api/avis/config' && $method === 'GET':
        require_once __DIR__ . '/../controllers/AvisController.php';
        (new AvisController())->getConfig();
        break;

    case $uri === '/api/avis/utile' && $method === 'POST':
        require_once __DIR__ . '/../controllers/AvisController.php';
        (new AvisController())->marquerUtile();
        break;

    case $uri === '/api/client/avis/mes-avis' && $method === 'GET':
        require_once __DIR__ . '/../controllers/AvisController.php';
        (new AvisController())->mesAvis();
        break;

    case $uri === '/api/avis/admin/liste' && $method === 'GET':
        require_once __DIR__ . '/../controllers/AvisController.php';
        (new AvisController())->listeAdmin();
        break;

    case $uri === '/api/avis/admin/valider' && $method === 'POST':
        require_once __DIR__ . '/../controllers/AvisController.php';
        (new AvisController())->valider();
        break;

    case $uri === '/api/avis/admin/rejeter' && $method === 'POST':
        require_once __DIR__ . '/../controllers/AvisController.php';
        (new AvisController())->rejeter();
        break;

    case $uri === '/api/avis/admin/repondre' && $method === 'POST':
        require_once __DIR__ . '/../controllers/AvisController.php';
        (new AvisController())->repondre();
        break;

    case $uri === '/api/avis/admin/supprimer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/AvisController.php';
        (new AvisController())->supprimer();
        break;

    // ===== SUPPORT CLIENT =====
    case $uri === '/api/client/support/tickets' && $method === 'GET':
        require_once __DIR__ . '/../controllers/TicketSupportController.php';
        (new TicketSupportController())->mesTickets();
        break;

    case $uri === '/api/client/support/tickets' && $method === 'POST':
        require_once __DIR__ . '/../controllers/TicketSupportController.php';
        (new TicketSupportController())->creer();
        break;

    case $uri === '/api/client/support/non-lus' && $method === 'GET':
        require_once __DIR__ . '/../controllers/TicketSupportController.php';
        (new TicketSupportController())->nonLusClient();
        break;

    case preg_match('#^/api/client/support/tickets/(\d+)$#', $uri, $m) && $method === 'GET':
        require_once __DIR__ . '/../controllers/TicketSupportController.php';
        (new TicketSupportController())->detailClient((int) $m[1]);
        break;

    case preg_match('#^/api/client/support/tickets/(\d+)/messages$#', $uri, $m) && $method === 'POST':
        require_once __DIR__ . '/../controllers/TicketSupportController.php';
        (new TicketSupportController())->ajouterMessageClient((int) $m[1]);
        break;

    case preg_match('#^/api/client/support/tickets/(\d+)/noter$#', $uri, $m) && $method === 'POST':
        require_once __DIR__ . '/../controllers/TicketSupportController.php';
        (new TicketSupportController())->noter((int) $m[1]);
        break;

    // ===== SUPPORT ADMIN =====
    case $uri === '/api/support/admin/tickets' && $method === 'GET':
        require_once __DIR__ . '/../controllers/TicketSupportController.php';
        (new TicketSupportController())->listeAdmin();
        break;

    case $uri === '/api/support/admin/non-lus' && $method === 'GET':
        require_once __DIR__ . '/../controllers/TicketSupportController.php';
        (new TicketSupportController())->nonLusAdmin();
        break;

    case preg_match('#^/api/support/admin/tickets/(\d+)$#', $uri, $m) && $method === 'GET':
        require_once __DIR__ . '/../controllers/TicketSupportController.php';
        (new TicketSupportController())->detailAdmin((int) $m[1]);
        break;

    case preg_match('#^/api/support/admin/tickets/(\d+)/messages$#', $uri, $m) && $method === 'POST':
        require_once __DIR__ . '/../controllers/TicketSupportController.php';
        (new TicketSupportController())->ajouterMessageAdmin((int) $m[1]);
        break;

    case preg_match('#^/api/support/admin/tickets/(\d+)/statut$#', $uri, $m) && $method === 'POST':
        require_once __DIR__ . '/../controllers/TicketSupportController.php';
        (new TicketSupportController())->changerStatut((int) $m[1]);
        break;

    case preg_match('#^/api/support/admin/tickets/(\d+)/priorite$#', $uri, $m) && $method === 'POST':
        require_once __DIR__ . '/../controllers/TicketSupportController.php';
        (new TicketSupportController())->changerPriorite((int) $m[1]);
        break;

    case preg_match('#^/api/support/admin/tickets/(\d+)/supprimer$#', $uri, $m) && $method === 'POST':
        require_once __DIR__ . '/../controllers/TicketSupportController.php';
        (new TicketSupportController())->supprimer((int) $m[1]);
        break;

    // ===== PROFIL ADMIN =====
    case $uri === '/api/profil/mon-profil' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ProfilController.php';
        (new ProfilController())->monProfil();
        break;

    case $uri === '/api/profil/modifier' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ProfilController.php';
        (new ProfilController())->modifierProfil();
        break;

    case $uri === '/api/profil/upload-avatar' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ProfilController.php';
        (new ProfilController())->uploadAvatar();
        break;

    case $uri === '/api/profil/supprimer-avatar' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ProfilController.php';
        (new ProfilController())->supprimerAvatar();
        break;

    case $uri === '/api/profil/changer-mot-de-passe' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ProfilController.php';
        (new ProfilController())->changerMotDePasse();
        break;

    // ===== 2FA =====
    case $uri === '/api/2fa/generer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/TwoFactorController.php';
        (new TwoFactorController())->generer();
        break;

    case $uri === '/api/2fa/activer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/TwoFactorController.php';
        (new TwoFactorController())->activer();
        break;

    case $uri === '/api/2fa/verifier' && $method === 'POST':
        require_once __DIR__ . '/../controllers/TwoFactorController.php';
        (new TwoFactorController())->verifier();
        break;

    case $uri === '/api/2fa/desactiver' && $method === 'POST':
        require_once __DIR__ . '/../controllers/TwoFactorController.php';
        (new TwoFactorController())->desactiver();
        break;

    case $uri === '/api/2fa/statut' && $method === 'GET':
        require_once __DIR__ . '/../controllers/TwoFactorController.php';
        (new TwoFactorController())->statut();
        break;

    // ===== SESSIONS ACTIVES =====
    case $uri === '/api/sessions-actives' && $method === 'GET':
        require_once __DIR__ . '/../controllers/SessionsActivesController.php';
        (new SessionsActivesController())->liste();
        break;

    case $uri === '/api/sessions-actives/revoquer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/SessionsActivesController.php';
        (new SessionsActivesController())->revoquer();
        break;

    case $uri === '/api/sessions-actives/revoquer-autres' && $method === 'POST':
        require_once __DIR__ . '/../controllers/SessionsActivesController.php';
        (new SessionsActivesController())->revoquerAutres();
        break;

    case $uri === '/api/sessions-actives/stats' && $method === 'GET':
        require_once __DIR__ . '/../controllers/SessionsActivesController.php';
        (new SessionsActivesController())->stats();
        break;

    case $uri === '/api/sessions-actives/nettoyer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/SessionsActivesController.php';
        (new SessionsActivesController())->nettoyer();
        break;

    // ===== HEALTH =====
    case $uri === '/api/health' && $method === 'GET':
        require_once __DIR__ . '/../controllers/HealthController.php';
        (new HealthController())->diagnostic();
        break;

    case $uri === '/api/health/ping' && $method === 'GET':
        require_once __DIR__ . '/../controllers/HealthController.php';
        (new HealthController())->ping();
        break;

    // ===== STATS TEMPS RÉEL =====
    case $uri === '/api/stats-temps-reel/comparaison' && $method === 'GET':
        require_once __DIR__ . '/../controllers/StatsTempsReelController.php';
        (new StatsTempsReelController())->comparaison();
        break;

    case $uri === '/api/stats-temps-reel/top-heures' && $method === 'GET':
        require_once __DIR__ . '/../controllers/StatsTempsReelController.php';
        (new StatsTempsReelController())->topHeures();
        break;

    case $uri === '/api/stats-temps-reel/flux' && $method === 'GET':
        require_once __DIR__ . '/../controllers/StatsTempsReelController.php';
        (new StatsTempsReelController())->flux();
        break;

    case $uri === '/api/stats-temps-reel/alertes' && $method === 'GET':
        require_once __DIR__ . '/../controllers/StatsTempsReelController.php';
        (new StatsTempsReelController())->alertes();
        break;

    case $uri === '/api/stats-temps-reel/resume' && $method === 'GET':
        require_once __DIR__ . '/../controllers/StatsTempsReelController.php';
        (new StatsTempsReelController())->resume();
        break;

    // ===== RAPPORT PDF =====
    case $uri === '/api/rapport-pdf' && $method === 'GET':
        require_once __DIR__ . '/../controllers/RapportPDFController.php';
        (new RapportPDFController())->donnees();
        break;

    // ===== NOTIFICATIONS EXTERNES =====
    case $uri === '/api/notifications-externes/config' && $method === 'GET':
        require_once __DIR__ . '/../controllers/NotificationExterneController.php';
        (new NotificationExterneController())->getConfig();
        break;

    case $uri === '/api/notifications-externes/config' && $method === 'POST':
        require_once __DIR__ . '/../controllers/NotificationExterneController.php';
        (new NotificationExterneController())->saveConfig();
        break;

    case $uri === '/api/notifications-externes/test-email' && $method === 'POST':
        require_once __DIR__ . '/../controllers/NotificationExterneController.php';
        (new NotificationExterneController())->testEmail();
        break;

    case $uri === '/api/notifications-externes/test-sms' && $method === 'POST':
        require_once __DIR__ . '/../controllers/NotificationExterneController.php';
        (new NotificationExterneController())->testSms();
        break;

    case $uri === '/api/notifications-externes/envoyer-email' && $method === 'POST':
        require_once __DIR__ . '/../controllers/NotificationExterneController.php';
        (new NotificationExterneController())->envoyerEmail();
        break;

    case $uri === '/api/notifications-externes/historique' && $method === 'GET':
        require_once __DIR__ . '/../controllers/NotificationExterneController.php';
        (new NotificationExterneController())->historique();
        break;

    case $uri === '/api/notifications-externes/stats' && $method === 'GET':
        require_once __DIR__ . '/../controllers/NotificationExterneController.php';
        (new NotificationExterneController())->stats();
        break;

    // ===== CRON =====
    case $uri === '/api/cron/rapport-journalier' && $method === 'GET':
        require_once __DIR__ . '/../controllers/CronController.php';
        (new CronController())->rapportJournalier();
        break;

    case $uri === '/api/cron/verifier-alertes' && $method === 'GET':
        require_once __DIR__ . '/../controllers/CronController.php';
        (new CronController())->verifierAlertes();
        break;

    // ===== FORFAITS =====
    case $uri === '/api/forfaits' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ForfaitController.php';
        (new ForfaitController())->liste();
        break;

    // ===== DASHBOARD =====
    case $uri === '/api/dashboard' && $method === 'GET':
        require_once __DIR__ . '/../controllers/DashboardController.php';
        (new DashboardController())->stats();
        break;

    case $uri === '/api/dashboard/transactions' && $method === 'GET':
        require_once __DIR__ . '/../controllers/DashboardController.php';
        (new DashboardController())->transactions();
        break;

    case $uri === '/api/dashboard/graphique' && $method === 'GET':
        require_once __DIR__ . '/../controllers/DashboardController.php';
        (new DashboardController())->graphique();
        break;

    // ===== TICKETS WIFI =====
    case $uri === '/api/tickets/creer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/TicketController.php';
        (new TicketController())->creer();
        break;

    // ===== SESSIONS =====
    case $uri === '/api/sessions/demarrer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/SessionController.php';
        (new SessionController())->demarrer();
        break;

    case $uri === '/api/sessions' && $method === 'GET':
        require_once __DIR__ . '/../controllers/SessionController.php';
        (new SessionController())->liste();
        break;

    case $uri === '/api/sessions/terminer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/SessionController.php';
        (new SessionController())->terminer();
        break;

    case $uri === '/api/sessions/statut' && $method === 'GET':
        require_once __DIR__ . '/../controllers/SessionController.php';
        (new SessionController())->statut();
        break;

    // ===== CAISSES =====
    case $uri === '/api/caisses' && $method === 'GET':
        require_once __DIR__ . '/../controllers/CaisseController.php';
        (new CaisseController())->liste();
        break;

    case $uri === '/api/caisses/creer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/CaisseController.php';
        (new CaisseController())->creer();
        break;

    case $uri === '/api/caisses/modifier' && $method === 'POST':
        require_once __DIR__ . '/../controllers/CaisseController.php';
        (new CaisseController())->modifier();
        break;

    case $uri === '/api/caisses/supprimer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/CaisseController.php';
        (new CaisseController())->supprimer();
        break;

    case $uri === '/api/caisses/ouvrir' && $method === 'POST':
        require_once __DIR__ . '/../controllers/CaisseController.php';
        (new CaisseController())->ouvrir();
        break;

    case $uri === '/api/caisses/fermer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/CaisseController.php';
        (new CaisseController())->fermer();
        break;

    case $uri === '/api/caisses/session' && $method === 'GET':
        require_once __DIR__ . '/../controllers/CaisseController.php';
        (new CaisseController())->session();
        break;

    case $uri === '/api/caisses/stats' && $method === 'GET':
        require_once __DIR__ . '/../controllers/CaisseController.php';
        (new CaisseController())->stats();
        break;

    // ===== HOTSPOT =====
    case $uri === '/api/hotspot/config' && $method === 'GET':
        require_once __DIR__ . '/../controllers/HotspotController.php';
        (new HotspotController())->getConfig();
        break;

    case $uri === '/api/hotspot/config' && $method === 'POST':
        require_once __DIR__ . '/../controllers/HotspotController.php';
        (new HotspotController())->saveConfig();
        break;

    case $uri === '/api/hotspot/tester' && $method === 'POST':
        require_once __DIR__ . '/../controllers/HotspotController.php';
        (new HotspotController())->tester();
        break;

    case $uri === '/api/hotspot/utilisateur' && $method === 'POST':
        require_once __DIR__ . '/../controllers/HotspotController.php';
        (new HotspotController())->creerUtilisateur();
        break;

    case $uri === '/api/hotspot/supprimer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/HotspotController.php';
        (new HotspotController())->supprimerUtilisateur();
        break;

    // ===== STATISTIQUES =====
    case $uri === '/api/statistiques' && $method === 'GET':
        require_once __DIR__ . '/../controllers/StatistiquesController.php';
        (new StatistiquesController())->parPeriode();
        break;

    case $uri === '/api/statistiques/resume' && $method === 'GET':
        require_once __DIR__ . '/../controllers/StatistiquesController.php';
        (new StatistiquesController())->resume();
        break;

    case $uri === '/api/statistiques/top-forfaits' && $method === 'GET':
        require_once __DIR__ . '/../controllers/StatistiquesController.php';
        (new StatistiquesController())->topForfaits();
        break;

    case $uri === '/api/statistiques/graphique' && $method === 'GET':
        require_once __DIR__ . '/../controllers/StatistiquesAvanceesController.php';
        (new StatistiquesAvanceesController())->graphique();
        break;

    case $uri === '/api/statistiques/previsions' && $method === 'GET':
        require_once __DIR__ . '/../controllers/StatistiquesAvanceesController.php';
        (new StatistiquesAvanceesController())->previsions();
        break;

    case $uri === '/api/statistiques/comparaison' && $method === 'GET':
        require_once __DIR__ . '/../controllers/StatistiquesAvanceesController.php';
        (new StatistiquesAvanceesController())->comparaison();
        break;

    case $uri === '/api/statistiques/top-clients' && $method === 'GET':
        require_once __DIR__ . '/../controllers/StatistiquesAvanceesController.php';
        (new StatistiquesAvanceesController())->topClients();
        break;

    case $uri === '/api/statistiques/heures-pointe' && $method === 'GET':
        require_once __DIR__ . '/../controllers/StatistiquesAvanceesController.php';
        (new StatistiquesAvanceesController())->heuresPointe();
        break;

    case $uri === '/api/statistiques/repartition-forfaits' && $method === 'GET':
        require_once __DIR__ . '/../controllers/StatistiquesAvanceesController.php';
        (new StatistiquesAvanceesController())->repartitionForfaits();
        break;

    case $uri === '/api/statistiques/jours-semaine' && $method === 'GET':
        require_once __DIR__ . '/../controllers/StatistiquesAvanceesController.php';
        (new StatistiquesAvanceesController())->joursSemaine();
        break;

    // ===== ADMINS =====
    case $uri === '/api/admins' && $method === 'GET':
        require_once __DIR__ . '/../controllers/AdminController.php';
        (new AdminController())->liste();
        break;

    case $uri === '/api/admins/creer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/AdminController.php';
        (new AdminController())->creer();
        break;

    case $uri === '/api/admins/modifier' && $method === 'POST':
        require_once __DIR__ . '/../controllers/AdminController.php';
        (new AdminController())->modifier();
        break;

    case $uri === '/api/admins/supprimer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/AdminController.php';
        (new AdminController())->supprimer();
        break;

    // ===== SITES =====
    case $uri === '/api/sites' && $method === 'GET':
        require_once __DIR__ . '/../controllers/SiteController.php';
        (new SiteController())->liste();
        break;

    case $uri === '/api/sites/creer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/SiteController.php';
        (new SiteController())->creer();
        break;

    case $uri === '/api/sites/modifier' && $method === 'POST':
        require_once __DIR__ . '/../controllers/SiteController.php';
        (new SiteController())->modifier();
        break;

    case $uri === '/api/sites/supprimer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/SiteController.php';
        (new SiteController())->supprimer();
        break;

    case $uri === '/api/sites/comparaison' && $method === 'GET':
        require_once __DIR__ . '/../controllers/SiteController.php';
        (new SiteController())->comparaison();
        break;

    // ===== EXPORT =====
    case $uri === '/api/export/csv' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ExportController.php';
        (new ExportController())->csv();
        break;

    case $uri === '/api/export/resume' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ExportController.php';
        (new ExportController())->resume();
        break;

    // ===== RAPPORT =====
    case $uri === '/api/rapport' && $method === 'GET':
        require_once __DIR__ . '/../controllers/RapportController.php';
        (new RapportController())->journalier();
        break;

    // ===== NOTIFICATIONS ADMIN =====
    case $uri === '/api/notifications' && $method === 'GET':
        require_once __DIR__ . '/../controllers/NotificationController.php';
        (new NotificationController())->liste();
        break;

    case $uri === '/api/notifications/non-lues' && $method === 'GET':
        require_once __DIR__ . '/../controllers/NotificationController.php';
        (new NotificationController())->nonLues();
        break;

    case $uri === '/api/notifications/lire' && $method === 'POST':
        require_once __DIR__ . '/../controllers/NotificationController.php';
        (new NotificationController())->marquerLues();
        break;

    case $uri === '/api/notifications/lire-une' && $method === 'POST':
        require_once __DIR__ . '/../controllers/NotificationController.php';
        (new NotificationController())->marquerUne();
        break;

    // ===== PARAMÈTRES =====
    case $uri === '/api/parametres' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ParametresController.php';
        (new ParametresController())->liste();
        break;

    case $uri === '/api/parametres' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ParametresController.php';
        (new ParametresController())->sauvegarder();
        break;

    // ===== QR CODE =====
    case $uri === '/api/qrcode' && $method === 'GET':
        require_once __DIR__ . '/../controllers/QrCodeController.php';
        (new QrCodeController())->generer();
        break;

    case $uri === '/api/qrcode/ticket' && $method === 'GET':
        require_once __DIR__ . '/../controllers/QrCodeController.php';
        (new QrCodeController())->pourTicket();
        break;

    case $uri === '/api/qrcode/image' && $method === 'GET':
        require_once __DIR__ . '/../controllers/QrCodeController.php';
        (new QrCodeController())->image();
        break;

    // ===== IMPRESSION =====
    case $uri === '/api/impression/ticket' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ImpressionController.php';
        (new ImpressionController())->ticket();
        break;

    case $uri === '/api/impression/tester' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ImpressionController.php';
        (new ImpressionController())->tester();
        break;

    case $uri === '/api/impression/test' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ImpressionController.php';
        (new ImpressionController())->testImprimante();
        break;

    // ===== SAUVEGARDES =====
    case $uri === '/api/backup/creer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/BackupController.php';
        (new BackupController())->creer();
        break;

    case $uri === '/api/backup/liste' && $method === 'GET':
        require_once __DIR__ . '/../controllers/BackupController.php';
        (new BackupController())->liste();
        break;

    case $uri === '/api/backup/telecharger' && $method === 'GET':
        require_once __DIR__ . '/../controllers/BackupController.php';
        (new BackupController())->telecharger();
        break;

    case $uri === '/api/backup/supprimer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/BackupController.php';
        (new BackupController())->supprimer();
        break;

    case $uri === '/api/backup/config' && $method === 'GET':
        require_once __DIR__ . '/../controllers/BackupController.php';
        (new BackupController())->getConfig();
        break;

    case $uri === '/api/backup/config' && $method === 'POST':
        require_once __DIR__ . '/../controllers/BackupController.php';
        (new BackupController())->saveConfig();
        break;

    case $uri === '/api/backup/auto' && $method === 'GET':
        require_once __DIR__ . '/../controllers/BackupController.php';
        (new BackupController())->auto();
        break;

    // ===== PROMOTIONS =====
    case $uri === '/api/promotions/valider' && $method === 'POST':
        require_once __DIR__ . '/../controllers/PromotionController.php';
        (new PromotionController())->valider();
        break;

    case $uri === '/api/promotions/actives' && $method === 'GET':
        require_once __DIR__ . '/../controllers/PromotionController.php';
        (new PromotionController())->actives();
        break;

    case $uri === '/api/promotions/admin/liste' && $method === 'GET':
        require_once __DIR__ . '/../controllers/PromotionController.php';
        (new PromotionController())->listeAdmin();
        break;

    case $uri === '/api/promotions/admin/utilisations' && $method === 'GET':
        require_once __DIR__ . '/../controllers/PromotionController.php';
        (new PromotionController())->utilisations();
        break;

    case $uri === '/api/promotions/admin/creer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/PromotionController.php';
        (new PromotionController())->creer();
        break;

    case $uri === '/api/promotions/admin/modifier' && $method === 'POST':
        require_once __DIR__ . '/../controllers/PromotionController.php';
        (new PromotionController())->modifier();
        break;

    case $uri === '/api/promotions/admin/supprimer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/PromotionController.php';
        (new PromotionController())->supprimer();
        break;

    case $uri === '/api/promotions/admin/toggle' && $method === 'POST':
        require_once __DIR__ . '/../controllers/PromotionController.php';
        (new PromotionController())->toggle();
        break;

    // ===== GALERIE =====
    case $uri === '/api/galerie/photos' && $method === 'GET':
        require_once __DIR__ . '/../controllers/GalerieController.php';
        (new GalerieController())->listePublique();
        break;

    case $uri === '/api/galerie/admin/photos' && $method === 'GET':
        require_once __DIR__ . '/../controllers/GalerieController.php';
        (new GalerieController())->listeAdmin();
        break;

    case $uri === '/api/galerie/admin/upload' && $method === 'POST':
        require_once __DIR__ . '/../controllers/GalerieController.php';
        (new GalerieController())->upload();
        break;

    case $uri === '/api/galerie/admin/modifier' && $method === 'POST':
        require_once __DIR__ . '/../controllers/GalerieController.php';
        (new GalerieController())->modifier();
        break;

    case $uri === '/api/galerie/admin/supprimer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/GalerieController.php';
        (new GalerieController())->supprimer();
        break;

    case $uri === '/api/galerie/admin/toggle' && $method === 'POST':
        require_once __DIR__ . '/../controllers/GalerieController.php';
        (new GalerieController())->toggle();
        break;

    // ===== MONITORING =====
    case $uri === '/api/monitoring/dashboard' && $method === 'GET':
        require_once __DIR__ . '/../controllers/MonitoringController.php';
        (new MonitoringController())->dashboard();
        break;

    case $uri === '/api/monitoring/alertes' && $method === 'GET':
        require_once __DIR__ . '/../controllers/MonitoringController.php';
        (new MonitoringController())->alertes();
        break;

    case $uri === '/api/monitoring/alertes/lire' && $method === 'POST':
        require_once __DIR__ . '/../controllers/MonitoringController.php';
        (new MonitoringController())->marquerLue();
        break;

    case $uri === '/api/monitoring/alertes/resoudre' && $method === 'POST':
        require_once __DIR__ . '/../controllers/MonitoringController.php';
        (new MonitoringController())->resoudre();
        break;

    case $uri === '/api/monitoring/erreurs' && $method === 'GET':
        require_once __DIR__ . '/../controllers/MonitoringController.php';
        (new MonitoringController())->erreurs();
        break;

    case $uri === '/api/monitoring/non-lues' && $method === 'GET':
        require_once __DIR__ . '/../controllers/MonitoringController.php';
        (new MonitoringController())->nonLues();
        break;

    case $uri === '/api/monitoring/check' && $method === 'POST':
        require_once __DIR__ . '/../controllers/MonitoringController.php';
        (new MonitoringController())->check();
        break;

    // ===== WEBSOCKET =====
    case $uri === '/api/websocket/envoyer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/WebSocketController.php';
        (new WebSocketController())->envoyer();
        break;

    case $uri === '/api/websocket/statut' && $method === 'GET':
        require_once __DIR__ . '/../controllers/WebSocketController.php';
        (new WebSocketController())->statut();
        break;

    // ===== REÇUS =====
    case $uri === '/api/recu/client' && $method === 'POST':
        require_once __DIR__ . '/../controllers/RecuController.php';
        (new RecuController())->enregistrerClient();
        break;

    case $uri === '/api/recu' && $method === 'GET':
        require_once __DIR__ . '/../controllers/RecuController.php';
        (new RecuController())->getRecu();
        break;

    case $uri === '/api/recu/dernier' && $method === 'GET':
        require_once __DIR__ . '/../controllers/RecuController.php';
        (new RecuController())->dernier();
        break;

    // ===== LOGS =====
    case $uri === '/api/logs' && $method === 'GET':
        require_once __DIR__ . '/../controllers/LogController.php';
        (new LogController())->liste();
        break;

    case $uri === '/api/logs/stats' && $method === 'GET':
        require_once __DIR__ . '/../controllers/LogController.php';
        (new LogController())->stats();
        break;

    case $uri === '/api/logs/nettoyer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/LogController.php';
        (new LogController())->nettoyer();
        break;

    // ===== CONTACT =====
    case $uri === '/api/contact' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ContactController.php';
        (new ContactController())->envoyer();
        break;

    // ===== RÉSERVATIONS =====
    case $uri === '/api/reservations' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ReservationController.php';
        (new ReservationController())->creer();
        break;

    case $uri === '/api/reservations' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ReservationController.php';
        (new ReservationController())->liste();
        break;

    case $uri === '/api/reservations/stats' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ReservationController.php';
        (new ReservationController())->stats();
        break;

    case $uri === '/api/reservations/detail' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ReservationController.php';
        (new ReservationController())->detail();
        break;

    case $uri === '/api/reservations/confirmer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ReservationController.php';
        (new ReservationController())->confirmer();
        break;

    case $uri === '/api/reservations/annuler' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ReservationController.php';
        (new ReservationController())->annuler();
        break;

    case $uri === '/api/reservations/terminer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ReservationController.php';
        (new ReservationController())->terminer();
        break;

    case $uri === '/api/reservations/supprimer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ReservationController.php';
        (new ReservationController())->supprimer();
        break;

    // ===== FIDÉLITÉ =====
    case $uri === '/api/fidelite/inscription' && $method === 'POST':
        require_once __DIR__ . '/../controllers/FideliteController.php';
        (new FideliteController())->inscription();
        break;

    case $uri === '/api/fidelite/carte' && $method === 'GET':
        require_once __DIR__ . '/../controllers/FideliteController.php';
        (new FideliteController())->detail();
        break;

    case $uri === '/api/fidelite/recompenses' && $method === 'GET':
        require_once __DIR__ . '/../controllers/FideliteController.php';
        (new FideliteController())->recompenses();
        break;

    case $uri === '/api/fidelite' && $method === 'GET':
        require_once __DIR__ . '/../controllers/FideliteController.php';
        (new FideliteController())->liste();
        break;

    case $uri === '/api/fidelite/stats' && $method === 'GET':
        require_once __DIR__ . '/../controllers/FideliteController.php';
        (new FideliteController())->stats();
        break;

    case $uri === '/api/fidelite/ajouter-points' && $method === 'POST':
        require_once __DIR__ . '/../controllers/FideliteController.php';
        (new FideliteController())->ajouterPoints();
        break;

    case $uri === '/api/fidelite/utiliser-recompense' && $method === 'POST':
        require_once __DIR__ . '/../controllers/FideliteController.php';
        (new FideliteController())->utiliserRecompense();
        break;

    case $uri === '/api/fidelite/toggle-actif' && $method === 'POST':
        require_once __DIR__ . '/../controllers/FideliteController.php';
        (new FideliteController())->toggleActif();
        break;

    case $uri === '/api/fidelite/supprimer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/FideliteController.php';
        (new FideliteController())->supprimer();
        break;

    case $uri === '/api/fidelite/historique' && $method === 'GET':
        require_once __DIR__ . '/../controllers/FideliteController.php';
        (new FideliteController())->historique();
        break;

    // ===== BLOG =====
    case $uri === '/api/blog/articles' && $method === 'GET':
        require_once __DIR__ . '/../controllers/BlogController.php';
        (new BlogController())->listePublique();
        break;

    case $uri === '/api/blog/article' && $method === 'GET':
        require_once __DIR__ . '/../controllers/BlogController.php';
        (new BlogController())->detailPublique();
        break;

    case $uri === '/api/blog/categories' && $method === 'GET':
        require_once __DIR__ . '/../controllers/BlogController.php';
        (new BlogController())->categories();
        break;

    case $uri === '/api/blog/admin/articles' && $method === 'GET':
        require_once __DIR__ . '/../controllers/BlogController.php';
        (new BlogController())->listeAdmin();
        break;

    case $uri === '/api/blog/admin/article' && $method === 'GET':
        require_once __DIR__ . '/../controllers/BlogController.php';
        (new BlogController())->detailAdmin();
        break;

    case $uri === '/api/blog/admin/stats' && $method === 'GET':
        require_once __DIR__ . '/../controllers/BlogController.php';
        (new BlogController())->stats();
        break;

    case $uri === '/api/blog/admin/creer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/BlogController.php';
        (new BlogController())->creer();
        break;

    case $uri === '/api/blog/admin/modifier' && $method === 'POST':
        require_once __DIR__ . '/../controllers/BlogController.php';
        (new BlogController())->modifier();
        break;

    case $uri === '/api/blog/admin/supprimer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/BlogController.php';
        (new BlogController())->supprimer();
        break;

    // ===== NEWSLETTER =====
    case $uri === '/api/newsletter/inscription' && $method === 'POST':
        require_once __DIR__ . '/../controllers/NewsletterController.php';
        (new NewsletterController())->inscription();
        break;

    case $uri === '/api/newsletter/confirmer' && $method === 'GET':
        require_once __DIR__ . '/../controllers/NewsletterController.php';
        (new NewsletterController())->confirmer();
        break;

    case $uri === '/api/newsletter/desinscrire' && $method === 'GET':
        require_once __DIR__ . '/../controllers/NewsletterController.php';
        (new NewsletterController())->desinscrire();
        break;

    case $uri === '/api/newsletter/stats-publiques' && $method === 'GET':
        require_once __DIR__ . '/../controllers/NewsletterController.php';
        (new NewsletterController())->statsPubliques();
        break;

    case $uri === '/api/newsletter/admin/abonnes' && $method === 'GET':
        require_once __DIR__ . '/../controllers/NewsletterController.php';
        (new NewsletterController())->listeAbonnes();
        break;

    case $uri === '/api/newsletter/admin/stats' && $method === 'GET':
        require_once __DIR__ . '/../controllers/NewsletterController.php';
        (new NewsletterController())->stats();
        break;

    case $uri === '/api/newsletter/admin/supprimer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/NewsletterController.php';
        (new NewsletterController())->supprimerAbonne();
        break;

    case $uri === '/api/newsletter/admin/envoyer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/NewsletterController.php';
        (new NewsletterController())->envoyer();
        break;

    case $uri === '/api/newsletter/admin/envois' && $method === 'GET':
        require_once __DIR__ . '/../controllers/NewsletterController.php';
        (new NewsletterController())->listeEnvois();
        break;

    // ===== CHAT =====
    case $uri === '/api/chat/init' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ChatController.php';
        (new ChatController())->init();
        break;

    case $uri === '/api/chat/envoyer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ChatController.php';
        (new ChatController())->envoyerClient();
        break;

    case $uri === '/api/chat/messages' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ChatController.php';
        (new ChatController())->messagesClient();
        break;

    case $uri === '/api/chat/admin/conversations' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ChatController.php';
        (new ChatController())->listeAdmin();
        break;

    case $uri === '/api/chat/admin/conversation' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ChatController.php';
        (new ChatController())->detailAdmin();
        break;

    case $uri === '/api/chat/admin/repondre' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ChatController.php';
        (new ChatController())->repondre();
        break;

    case $uri === '/api/chat/admin/messages' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ChatController.php';
        (new ChatController())->messagesAdmin();
        break;

    case $uri === '/api/chat/admin/fermer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ChatController.php';
        (new ChatController())->fermer();
        break;

    case $uri === '/api/chat/admin/rouvrir' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ChatController.php';
        (new ChatController())->rouvrir();
        break;

    case $uri === '/api/chat/admin/supprimer' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ChatController.php';
        (new ChatController())->supprimer();
        break;

    case $uri === '/api/chat/admin/toggle-bot' && $method === 'POST':
        require_once __DIR__ . '/../controllers/ChatController.php';
        (new ChatController())->toggleBot();
        break;

    case $uri === '/api/chat/admin/non-lus' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ChatController.php';
        (new ChatController())->nonLus();
        break;

    case $uri === '/api/chat/admin/stats' && $method === 'GET':
        require_once __DIR__ . '/../controllers/ChatController.php';
        (new ChatController())->stats();
        break;

    // ===== ROUTE PAR DÉFAUT =====
    default:
        http_response_code(404);
        echo json_encode([
            "erreur" => "Route non trouvée",
            "uri_recue" => $uri,
            "methode" => $method
        ]);
}