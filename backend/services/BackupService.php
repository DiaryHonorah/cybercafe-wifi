<?php
/**
 * Service Backup
 * Gère la création, liste, suppression et rotation des sauvegardes
 */

class BackupService
{
    private $db;
    private $backupDir;
    private $config;

    public function __construct($db = null)
    {
        if ($db instanceof PDO) {
            $this->db = $db;
        } else {
            $this->db = $this->connecter();
        }

        $this->backupDir = __DIR__ . '/../backups/';
        
        // Créer le dossier si nécessaire
        if (!file_exists($this->backupDir)) {
            mkdir($this->backupDir, 0755, true);
        }

        // Charger la config
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

    /**
     * Charge la configuration depuis la BDD
     */
    private function chargerConfig()
    {
        try {
            $stmt = $this->db->query("SELECT * FROM backups_config LIMIT 1");
            $config = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($config) {
                return $config;
            }
        } catch (Exception $e) {
            // Si la table n'existe pas encore, config par défaut
        }
        return [
            'auto_actif' => 1,
            'frequence_heures' => 24,
            'retention_jours' => 30,
            'inclure_fichiers' => 0,
        ];
    }

    /**
     * Crée une sauvegarde manuelle ou automatique
     */
    public function creerBackup($type = 'manuel', $adminId = null)
    {
        $debut = microtime(true);
        $nomFichier = 'backup_' . date('Y-m-d_H-i-s') . '_' . $type . '.sql';
        $chemin = $this->backupDir . $nomFichier;

        // Enregistrer l'état "en cours"
        $stmt = $this->db->prepare("
            INSERT INTO backups 
            (nom_fichier, type, chemin, statut, admin_id) 
            VALUES (?, ?, ?, 'en_cours', ?)
        ");
        $stmt->execute([$nomFichier, $type, 'backups/' . $nomFichier, $adminId]);
        $backupId = $this->db->lastInsertId();

        try {
            // Récupérer la config BDD
            $configPath = __DIR__ . '/../config/database.php';
            require_once $configPath;
            
            // Charger .env pour les identifiants
            $envPath = __DIR__ . '/../.env';
            if (file_exists($envPath)) {
                $lignes = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lignes as $ligne) {
                    $ligne = trim($ligne);
                    if (empty($ligne) || strpos($ligne, '#') === 0) continue;
                    if (strpos($ligne, '=') !== false) {
                        list($cle, $valeur) = explode('=', $ligne, 2);
                        $_ENV[trim($cle)] = trim($valeur, " \t\n\r\0\x0B\"'");
                    }
                }
            }

            $host = $_ENV['DB_HOST'] ?? 'localhost';
            $dbName = $_ENV['DB_NAME'] ?? 'cybercafe_db';
            $user = $_ENV['DB_USER'] ?? 'root';
            $pass = $_ENV['DB_PASS'] ?? '';

            // Trouver mysqldump
            $mysqldump = $this->trouverMysqldump();

            // Construire la commande
            if (empty($pass)) {
                $cmd = "\"$mysqldump\" --host=$host --user=$user --databases $dbName --routines --triggers --single-transaction --result-file=\"$chemin\" 2>&1";
            } else {
                $cmd = "\"$mysqldump\" --host=$host --user=$user --password=$pass --databases $dbName --routines --triggers --single-transaction --result-file=\"$chemin\" 2>&1";
            }

            // Exécuter
            exec($cmd, $output, $code);

            if ($code !== 0 || !file_exists($chemin)) {
                throw new Exception("Erreur mysqldump: " . implode("\n", $output));
            }

            $taille = filesize($chemin);
            $duree = round(microtime(true) - $debut, 2);

            // Si inclure_fichiers = 1, ajouter au ZIP
            if ($this->config['inclure_fichiers']) {
                $zip = new ZipArchive();
                $zipPath = str_replace('.sql', '.zip', $chemin);
                
                if ($zip->open($zipPath, ZipArchive::CREATE) === TRUE) {
                    $zip->addFile($chemin, $nomFichier);
                    
                    // Ajouter les uploads
                    $uploadsDir = __DIR__ . '/../uploads/';
                    if (file_exists($uploadsDir)) {
                        $this->ajouterDossierAuZip($zip, $uploadsDir, 'uploads/');
                    }
                    
                    $zip->close();
                    
                    // Supprimer le .sql, garder le .zip
                    unlink($chemin);
                    $nomFichier = str_replace('.sql', '.zip', $nomFichier);
                    $chemin = $zipPath;
                    $taille = filesize($zipPath);
                }
            }

            // Mettre à jour en succès
            $stmt = $this->db->prepare("
                UPDATE backups 
                SET statut = 'succes', taille_octets = ?, duree_secondes = ?
                WHERE id = ?
            ");
            $stmt->execute([$taille, $duree, $backupId]);

            // Rotation : supprimer les vieux backups
            $this->rotation();

            // Mettre à jour la date de dernière exécution
            $this->db->prepare("
                UPDATE backups_config SET derniere_execution = NOW() WHERE id = 1
            ")->execute();

            return [
                'success' => true,
                'id' => $backupId,
                'nom_fichier' => $nomFichier,
                'taille' => $taille,
                'duree' => $duree,
            ];

        } catch (Exception $e) {
            // Marquer comme échec
            $stmt = $this->db->prepare("
                UPDATE backups 
                SET statut = 'echec', message_erreur = ?
                WHERE id = ?
            ");
            $stmt->execute([$e->getMessage(), $backupId]);

            throw $e;
        }
    }

    /**
     * Trouve le chemin de mysqldump selon l'OS
     */
    private function trouverMysqldump()
    {
        // Windows (XAMPP)
        $chemins = [
            'C:\xampp\mysql\bin\mysqldump.exe',
            'C:\wamp64\bin\mysql\mysql8.0.31\bin\mysqldump.exe',
            'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe',
        ];

        foreach ($chemins as $chemin) {
            if (file_exists($chemin)) {
                return $chemin;
            }
        }

        // Linux/Mac : chercher dans le PATH
        $output = [];
        exec('which mysqldump 2>/dev/null', $output);
        if (!empty($output[0])) {
            return $output[0];
        }

        // Fallback
        return 'mysqldump';
    }

    /**
     * Ajoute récursivement un dossier au ZIP
     */
    private function ajouterDossierAuZip($zip, $dossier, $prefixe = '')
    {
        if (!is_dir($dossier)) return;

        $fichiers = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dossier, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($fichiers as $fichier) {
            if ($fichier->isFile()) {
                $cheminRelatif = $prefixe . str_replace($dossier, '', $fichier->getPathname());
                $zip->addFile($fichier->getPathname(), $cheminRelatif);
            }
        }
    }

    /**
     * Rotation : supprime les backups plus vieux que X jours
     */
    public function rotation()
    {
        $retention = (int)$this->config['retention_jours'];
        $dateLimit = date('Y-m-d H:i:s', strtotime("-{$retention} days"));

        // Trouver les backups à supprimer
        $stmt = $this->db->prepare("
            SELECT id, chemin FROM backups 
            WHERE created_at < ? AND statut = 'succes'
        ");
        $stmt->execute([$dateLimit]);
        $anciensBackups = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($anciensBackups as $backup) {
            $cheminComplet = __DIR__ . '/../' . $backup['chemin'];
            if (file_exists($cheminComplet)) {
                unlink($cheminComplet);
            }
            $this->db->prepare("DELETE FROM backups WHERE id = ?")->execute([$backup['id']]);
        }

        return count($anciensBackups);
    }

    /**
     * Liste tous les backups
     */
    public function liste()
    {
        $stmt = $this->db->query("
            SELECT b.*, a.nom AS admin_nom
            FROM backups b
            LEFT JOIN admins a ON a.id = b.admin_id
            ORDER BY b.created_at DESC
            LIMIT 100
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Supprime un backup
     */
    public function supprimer($id)
    {
        $stmt = $this->db->prepare("SELECT chemin FROM backups WHERE id = ?");
        $stmt->execute([$id]);
        $backup = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$backup) {
            throw new Exception("Backup introuvable");
        }

        // Supprimer le fichier
        $cheminComplet = __DIR__ . '/../' . $backup['chemin'];
        if (file_exists($cheminComplet)) {
            unlink($cheminComplet);
        }

        // Supprimer en BDD
        $this->db->prepare("DELETE FROM backups WHERE id = ?")->execute([$id]);

        return true;
    }

    /**
     * Télécharge un backup
     */
    public function telecharger($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM backups WHERE id = ?");
        $stmt->execute([$id]);
        $backup = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$backup) {
            throw new Exception("Backup introuvable");
        }

        $cheminComplet = __DIR__ . '/../' . $backup['chemin'];
        if (!file_exists($cheminComplet)) {
            throw new Exception("Fichier introuvable");
        }

        return [
            'chemin' => $cheminComplet,
            'nom' => $backup['nom_fichier'],
            'taille' => $backup['taille_octets'],
        ];
    }

    /**
     * Statistiques
     */
    public function stats()
    {
        $stmt = $this->db->query("
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN statut = 'succes' THEN 1 ELSE 0 END) AS succes,
                SUM(CASE WHEN statut = 'echec' THEN 1 ELSE 0 END) AS echecs,
                SUM(taille_octets) AS taille_totale,
                MAX(created_at) AS dernier_backup
            FROM backups
        ");
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Met à jour la configuration
     */
    public function sauvegarderConfig($data)
    {
        $stmt = $this->db->prepare("
            UPDATE backups_config 
            SET auto_actif = ?, frequence_heures = ?, retention_jours = ?, inclure_fichiers = ?
            WHERE id = 1
        ");
        return $stmt->execute([
            $data['auto_actif'] ? 1 : 0,
            (int)$data['frequence_heures'],
            (int)$data['retention_jours'],
            $data['inclure_fichiers'] ? 1 : 0,
        ]);
    }

    /**
     * Vérifie si un backup automatique doit être fait
     */
    public function doitFaireBackupAuto()
    {
        if (!$this->config['auto_actif']) {
            return false;
        }

        if (empty($this->config['derniere_execution'])) {
            return true;
        }

        $derniere = strtotime($this->config['derniere_execution']);
        $frequence = (int)$this->config['frequence_heures'] * 3600;

        return (time() - $derniere) >= $frequence;
    }
}