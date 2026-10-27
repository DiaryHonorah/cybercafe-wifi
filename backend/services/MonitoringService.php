<?php
/**
 * Service Monitoring
 * Vérifie la santé du site et envoie des alertes
 */

use PHPMailer\PHPMailer\PHPMailer;

class MonitoringService
{
    private $db;
    private $config;

    public function __construct($db = null)
    {
        if ($db instanceof PDO) {
            $this->db = $db;
        } else {
            $this->db = $this->connecter();
        }

        $this->config = $this->chargerConfig();
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

    private function chargerConfig()
    {
        try {
            $stmt = $this->db->query("SELECT * FROM monitoring_config LIMIT 1");
            $config = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($config) return $config;
        } catch (Exception $e) {}
        return [
            'check_auto_actif' => 1,
            'frequence_minutes' => 5,
            'seuil_disk_pct' => 85,
            'seuil_ram_pct' => 90,
            'seuil_temps_reponse_ms' => 2000,
            'notif_email_actif' => 1,
        ];
    }

    // =====================================================
    // CHECKS DE SANTÉ
    // =====================================================

    /**
     * Vérifie l'état complet du système
     */
    public function verifierTout()
    {
        $resultats = [];

        $resultats['bdd'] = $this->checkBDD();
        $resultats['disk'] = $this->checkDisk();
        $resultats['ram'] = $this->checkRAM();
        $resultats['site'] = $this->checkSite();

        // Créer les alertes si nécessaire
        $this->creerAlertes($resultats);

        return $resultats;
    }

    /**
     * Vérifie la connexion BDD
     */
    private function checkBDD()
    {
        $debut = microtime(true);
        try {
            $this->db->query("SELECT 1");
            $temps = round((microtime(true) - $debut) * 1000);
            
            $statut = $temps > 500 ? 'warning' : 'ok';
            $message = $statut === 'ok' ? 'Base de données accessible' : 'BDD lente';

            $this->enregistrerCheck('bdd', $statut, null, $message, $temps);

            return [
                'type' => 'bdd',
                'statut' => $statut,
                'message' => $message,
                'temps_reponse' => $temps,
            ];
        } catch (Exception $e) {
            $this->enregistrerCheck('bdd', 'error', null, $e->getMessage(), null);
            return [
                'type' => 'bdd',
                'statut' => 'error',
                'message' => 'BDD inaccessible : ' . $e->getMessage(),
                'temps_reponse' => null,
            ];
        }
    }

    /**
     * Vérifie l'espace disque
     */
    private function checkDisk()
    {
        $path = __DIR__ . '/../';
        $total = @disk_total_space($path);
        $libre = @disk_free_space($path);

        if ($total === false || $libre === false) {
            $this->enregistrerCheck('disk', 'warning', null, 'Impossible de lire le disque');
            return [
                'type' => 'disk',
                'statut' => 'warning',
                'message' => 'Impossible de lire le disque',
                'valeur' => null,
            ];
        }

        $utilise = $total - $libre;
        $pctUtilise = round(($utilise / $total) * 100, 1);

        $statut = 'ok';
        if ($pctUtilise >= $this->config['seuil_disk_pct']) {
            $statut = 'error';
        } elseif ($pctUtilise >= ($this->config['seuil_disk_pct'] - 10)) {
            $statut = 'warning';
        }

        $message = sprintf(
            'Disque : %.1f%% utilisé (%.2f GB libre sur %.2f GB)',
            $pctUtilise,
            $libre / 1073741824,
            $total / 1073741824
        );

        $this->enregistrerCheck('disk', $statut, $pctUtilise, $message);

        return [
            'type' => 'disk',
            'statut' => $statut,
            'message' => $message,
            'valeur' => $pctUtilise,
            'libre_gb' => round($libre / 1073741824, 2),
            'total_gb' => round($total / 1073741824, 2),
        ];
    }

    /**
     * Vérifie l'utilisation RAM (Windows ou Linux)
     */
    private function checkRAM()
    {
        $pctUtilise = null;

        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            // Windows
            $output = [];
            @exec('wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /Value', $output);
            $data = [];
            foreach ($output as $line) {
                if (strpos($line, '=') !== false) {
                    list($k, $v) = explode('=', $line);
                    $data[trim($k)] = trim($v);
                }
            }
            if (isset($data['FreePhysicalMemory']) && isset($data['TotalVisibleMemorySize'])) {
                $free = intval($data['FreePhysicalMemory']) / 1024; // MB
                $total = intval($data['TotalVisibleMemorySize']) / 1024; // MB
                $utilise = $total - $free;
                $pctUtilise = round(($utilise / $total) * 100, 1);
            }
        } else {
            // Linux
            $meminfo = @file_get_contents('/proc/meminfo');
            if ($meminfo) {
                preg_match('/MemTotal:\s+(\d+)/', $meminfo, $total);
                preg_match('/MemAvailable:\s+(\d+)/', $meminfo, $dispo);
                if (!empty($total[1]) && !empty($dispo[1])) {
                    $totalKB = intval($total[1]);
                    $dispoKB = intval($dispo[1]);
                    $utiliseKB = $totalKB - $dispoKB;
                    $pctUtilise = round(($utiliseKB / $totalKB) * 100, 1);
                }
            }
        }

        if ($pctUtilise === null) {
            $this->enregistrerCheck('ram', 'warning', null, 'Impossible de lire la RAM');
            return [
                'type' => 'ram',
                'statut' => 'warning',
                'message' => 'Impossible de lire la RAM',
                'valeur' => null,
            ];
        }

        $statut = 'ok';
        if ($pctUtilise >= $this->config['seuil_ram_pct']) {
            $statut = 'error';
        } elseif ($pctUtilise >= ($this->config['seuil_ram_pct'] - 10)) {
            $statut = 'warning';
        }

        $message = sprintf('RAM : %.1f%% utilisée', $pctUtilise);

        $this->enregistrerCheck('ram', $statut, $pctUtilise, $message);

        return [
            'type' => 'ram',
            'statut' => $statut,
            'message' => $message,
            'valeur' => $pctUtilise,
        ];
    }

    /**
     * Vérifie que l'API répond
     */
    private function checkSite()
    {
        $debut = microtime(true);
        try {
            $this->db->query("SELECT 1");
            $temps = round((microtime(true) - $debut) * 1000);

            $statut = 'ok';
            if ($temps > $this->config['seuil_temps_reponse_ms']) {
                $statut = 'warning';
            }

            $message = sprintf('API répond en %d ms', $temps);

            $this->enregistrerCheck('site', $statut, $temps, $message, $temps);

            return [
                'type' => 'site',
                'statut' => $statut,
                'message' => $message,
                'temps_reponse' => $temps,
            ];
        } catch (Exception $e) {
            return [
                'type' => 'site',
                'statut' => 'error',
                'message' => 'Site inaccessible',
                'temps_reponse' => null,
            ];
        }
    }

    // =====================================================
    // ALERTES
    // =====================================================

    /**
     * Crée des alertes si nécessaire
     */
    private function creerAlertes($resultats)
    {
        foreach ($resultats as $type => $resultat) {
            if ($resultat['statut'] === 'error') {
                // Vérifier s'il y a déjà une alerte active pour ce type
                $stmt = $this->db->prepare("
                    SELECT id FROM monitoring_alertes 
                    WHERE type = ? AND resolue = 0
                    ORDER BY created_at DESC LIMIT 1
                ");
                $stmt->execute([$type]);
                $existante = $stmt->fetchColumn();

                if (!$existante) {
                    $this->creerAlerte(
                        $type,
                        'danger',
                        "Erreur détectée : " . strtoupper($type),
                        $resultat['message'],
                        $resultat['valeur'] ?? null
                    );
                }
            } elseif ($resultat['statut'] === 'ok') {
                // Résoudre les alertes actives pour ce type
                $this->db->prepare("
                    UPDATE monitoring_alertes 
                    SET resolue = 1, resolue_at = NOW()
                    WHERE type = ? AND resolue = 0
                ")->execute([$type]);
            }
        }
    }

    /**
     * Crée une alerte
     */
    public function creerAlerte($type, $niveau, $titre, $message, $valeur = null, $seuil = null)
    {
        $stmt = $this->db->prepare("
            INSERT INTO monitoring_alertes 
            (type, niveau, titre, message, valeur_actuelle, seuil) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$type, $niveau, $titre, $message, $valeur, $seuil]);
        $alerteId = $this->db->lastInsertId();

        // Envoyer email si configuré
        if ($this->config['notif_email_actif'] && $niveau === 'danger') {
            $this->envoyerEmailAlerte($alerteId, $titre, $message);
        }

        return $alerteId;
    }

    /**
     * Enregistre un check
     */
    private function enregistrerCheck($type, $statut, $valeur = null, $message = null, $tempsReponse = null)
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO monitoring_checks 
                (type, statut, valeur, message, temps_reponse) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$type, $statut, $valeur, $message, $tempsReponse]);
        } catch (Exception $e) {}
    }

    /**
     * Envoie un email d'alerte
     */
    private function envoyerEmailAlerte($alerteId, $titre, $message)
    {
        try {
            $config = require __DIR__ . '/../config/mail.php';
            $adminEmail = $this->config['email_alertes'] ?: $config['to_email'];

            $phpMailerPath = __DIR__ . '/../libs/PHPMailer/src/';
            if (!file_exists($phpMailerPath . 'PHPMailer.php')) return false;

            require_once $phpMailerPath . 'Exception.php';
            require_once $phpMailerPath . 'PHPMailer.php';
            require_once $phpMailerPath . 'SMTP.php';

            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $config['host'];
            $mail->SMTPAuth = true;
            $mail->Username = $config['username'];
            $mail->Password = $config['password'];
            $mail->SMTPSecure = $config['encryption'] === 'ssl'
                ? PHPMailer::ENCRYPTION_SMTPS
                : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = $config['port'];
            $mail->CharSet = 'UTF-8';

            $mail->setFrom($config['from_email'], 'Monitoring Cyber Famille');
            $mail->addAddress($adminEmail);

            $mail->isHTML(true);
            $mail->Subject = "🚨 ALERTE : $titre";
            $mail->Body = "
                <h2 style='color:red'>🚨 Alerte Monitoring</h2>
                <h3>$titre</h3>
                <p>$message</p>
                <p><strong>Date :</strong> " . date('d/m/Y H:i:s') . "</p>
                <p><a href='http://localhost:5173/admin/monitoring'>Voir le dashboard</a></p>
            ";

            $mail->send();

            $this->db->prepare("UPDATE monitoring_alertes SET email_envoye = 1 WHERE id = ?")
                ->execute([$alerteId]);

            return true;
        } catch (Exception $e) {
            error_log("Erreur email alerte : " . $e->getMessage());
            return false;
        }
    }

    // =====================================================
    // STATISTIQUES
    // =====================================================

    /**
     * Statistiques monitoring
     */
    public function stats()
    {
        $stats = [];

        // Alertes actives
        $stmt = $this->db->query("SELECT COUNT(*) FROM monitoring_alertes WHERE resolue = 0");
        $stats['alertes_actives'] = intval($stmt->fetchColumn());

        // Alertes non lues
        $stmt = $this->db->query("SELECT COUNT(*) FROM monitoring_alertes WHERE lu = 0");
        $stats['alertes_non_lues'] = intval($stmt->fetchColumn());

        // Erreurs 24h
        $stmt = $this->db->query("
            SELECT COUNT(*) FROM monitoring_erreurs 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ");
        $stats['erreurs_24h'] = intval($stmt->fetchColumn());

        // Uptime 24h
        $stmt = $this->db->query("
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN statut = 'ok' THEN 1 ELSE 0 END) AS ok
            FROM monitoring_checks 
            WHERE type = 'site' AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ");
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['uptime_24h'] = $row['total'] > 0
            ? round(($row['ok'] / $row['total']) * 100, 2)
            : 100;

        // Temps de réponse moyen 1h
        $stmt = $this->db->query("
            SELECT AVG(temps_reponse) FROM monitoring_checks 
            WHERE type = 'site' AND temps_reponse IS NOT NULL
            AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ");
        $stats['temps_reponse_moyen'] = round(floatval($stmt->fetchColumn()), 0);

        return $stats;
    }

    /**
     * Historique des checks (graphique)
     */
    public function historiqueChecks($type = 'site', $heures = 24)
    {
        $stmt = $this->db->prepare("
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m-%d %H:00') AS heure,
                AVG(CASE WHEN statut = 'ok' THEN 100 ELSE 0 END) AS uptime,
                AVG(temps_reponse) AS temps_reponse,
                COUNT(*) AS nb_checks
            FROM monitoring_checks
            WHERE type = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d %H:00')
            ORDER BY heure ASC
        ");
        $stmt->execute([$type, $heure = $heures]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Liste des alertes
     */
    public function listeAlertes($limite = 50, $nonResoluesSeulement = false)
    {
        $sql = "SELECT * FROM monitoring_alertes";
        if ($nonResoluesSeulement) {
            $sql .= " WHERE resolue = 0";
        }
        $sql .= " ORDER BY created_at DESC LIMIT " . intval($limite);

        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Marquer une alerte comme lue
     */
    public function marquerLue($id)
    {
        $stmt = $this->db->prepare("UPDATE monitoring_alertes SET lu = 1 WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Résoudre une alerte manuellement
     */
    public function resoudreAlerte($id)
    {
        $stmt = $this->db->prepare("
            UPDATE monitoring_alertes SET resolue = 1, resolue_at = NOW() WHERE id = ?
        ");
        return $stmt->execute([$id]);
    }

    /**
     * Liste des erreurs récentes
     */
    public function listeErreurs($limite = 50)
    {
        $stmt = $this->db->query("
            SELECT * FROM monitoring_erreurs 
            ORDER BY created_at DESC 
            LIMIT " . intval($limite)
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Enregistrer une erreur
     */
    public function logErreur($niveau, $message, $code = null, $fichier = null, $ligne = null, $trace = null)
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO monitoring_erreurs 
                (niveau, code, message, fichier, ligne, trace, url, methode, ip, user_agent) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $niveau,
                $code,
                $message,
                $fichier,
                $ligne,
                $trace,
                $_SERVER['REQUEST_URI'] ?? null,
                $_SERVER['REQUEST_METHOD'] ?? null,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null,
            ]);
            return $this->db->lastInsertId();
        } catch (Exception $e) {
            return false;
        }
    }
}