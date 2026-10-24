<?php
require_once __DIR__ . '/../config/database.php';

class HealthController {

    /**
     * Diagnostic complet du système
     * GET /api/health
     */
    public function diagnostic() {
        $resultats = [
            "timestamp" => date('Y-m-d H:i:s'),
            "version_api" => "3.6",
            "php_version" => PHP_VERSION,
            "serveur" => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu',
            "tests" => []
        ];

        // 1. Base de données
        try {
            $db = (new Database())->getConnection();
            $resultats["tests"]["database"] = [
                "nom" => "Base de données MySQL",
                "statut" => "ok",
                "message" => "Connexion réussie"
            ];

            // Vérifier les tables
            $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
            $resultats["tests"]["tables"] = [
                "nom" => "Tables",
                "statut" => count($tables) > 0 ? "ok" : "warn",
                "message" => count($tables) . " tables trouvées",
                "details" => $tables
            ];
        } catch (Exception $e) {
            $resultats["tests"]["database"] = [
                "nom" => "Base de données MySQL",
                "statut" => "error",
                "message" => $e->getMessage()
            ];
        }

        // 2. Extensions PHP
        $extensions = ['pdo_mysql', 'gd', 'openssl', 'curl', 'mbstring', 'json'];
        foreach ($extensions as $ext) {
            $resultats["tests"]["ext_$ext"] = [
                "nom" => "Extension $ext",
                "statut" => extension_loaded($ext) ? "ok" : "error",
                "message" => extension_loaded($ext) ? "Chargée" : "Manquante"
            ];
        }

        // 3. Dossiers
        $dossiers = [
            'backups' => __DIR__ . '/../backups',
            'websocket' => __DIR__ . '/../websocket',
            'libs' => __DIR__ . '/../libs'
        ];
        foreach ($dossiers as $nom => $chemin) {
            $existe = is_dir($chemin);
            $resultats["tests"]["dir_$nom"] = [
                "nom" => "Dossier $nom",
                "statut" => $existe ? "ok" : "warn",
                "message" => $existe ? "Existe" : "Non trouvé",
                "chemin" => $chemin
            ];
        }

        // 4. WebSocket
        $wsHost = '127.0.0.1';
        $wsPort = 8091;
        $wsSocket = @fsockopen($wsHost, $wsPort, $errno, $errstr, 1);
        $resultats["tests"]["websocket"] = [
            "nom" => "Serveur WebSocket",
            "statut" => $wsSocket ? "ok" : "warn",
            "message" => $wsSocket 
                ? "Connecté sur $wsHost:$wsPort" 
                : "Non démarré (fonctionne en mode polling)"
        ];
        if ($wsSocket) fclose($wsSocket);

        // 5. Espace disque
        $espaceLibre = disk_free_space("C:");
        $espaceTotal = disk_total_space("C:");
        $pourcentageUtilise = (1 - $espaceLibre / $espaceTotal) * 100;
        $resultats["tests"]["disque"] = [
            "nom" => "Espace disque",
            "statut" => $pourcentageUtilise < 90 ? "ok" : "warn",
            "message" => round($espaceLibre / 1073741824, 2) . " Go libre sur " . round($espaceTotal / 1073741824, 2) . " Go",
            "pourcentage_utilise" => round($pourcentageUtilise, 1)
        ];

        // 6. Fichiers critiques
        $fichiers = [
            'QrCode' => __DIR__ . '/../libs/phpqrcode/qrlib.php',
            'MikroTik' => __DIR__ . '/../services/MikroTikService.php',
            'Mail' => __DIR__ . '/../services/MailService.php',
            'Sms' => __DIR__ . '/../services/SmsService.php',
            '2FA' => __DIR__ . '/../services/TwoFactorService.php'
        ];
        foreach ($fichiers as $nom => $chemin) {
            $resultats["tests"]["file_$nom"] = [
                "nom" => "Fichier $nom",
                "statut" => file_exists($chemin) ? "ok" : "warn",
                "message" => file_exists($chemin) ? "Présent" : "Manquant"
            ];
        }

        // Résumé
        $ok = 0;
        $warn = 0;
        $error = 0;
        foreach ($resultats["tests"] as $test) {
            if ($test["statut"] === "ok") $ok++;
            elseif ($test["statut"] === "warn") $warn++;
            else $error++;
        }

        $resultats["resume"] = [
            "ok" => $ok,
            "warn" => $warn,
            "error" => $error,
            "statut_global" => $error === 0 ? ($warn === 0 ? "parfait" : "bon") : "probleme"
        ];

        echo json_encode($resultats);
    }

    /**
     * Version courte (pour monitoring)
     * GET /api/health/ping
     */
    public function ping() {
        echo json_encode([
            "status" => "ok",
            "timestamp" => date('Y-m-d H:i:s')
        ]);
    }
}