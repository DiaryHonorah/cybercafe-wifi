<?php
/**
 * Script de backup automatique
 * À exécuter via Windows Task Scheduler (toutes les heures)
 * ou via cron (Linux)
 * 
 * Usage : php backup_auto.php
 */

require_once __DIR__ . '/../services/BackupService.php';

try {
    $service = new BackupService();
    
    if ($service->doitFaireBackupAuto()) {
        $resultat = $service->creerBackup('automatique');
        echo "✅ Backup créé : " . $resultat['nom_fichier'] . " (" . round($resultat['taille'] / 1024 / 1024, 2) . " MB)\n";
    } else {
        echo "⏳ Pas de backup nécessaire\n";
    }
} catch (Exception $e) {
    echo "❌ Erreur : " . $e->getMessage() . "\n";
    exit(1);
}