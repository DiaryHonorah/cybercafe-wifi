@echo off
REM ============================================
REM Sauvegarde automatique Cyber Famille
REM ============================================

echo [%date% %time%] Lancement de la sauvegarde automatique...

REM Utilisation de PHP CLI pour lancer la sauvegarde
C:\xampp\php\php.exe -r ^
"$_POST['type']='automatique'; require 'C:/xampp/htdocs/cybercafe-wifi/backend/controllers/BackupController.php'; $b = new BackupController(); $b->creer();"

echo [%date% %time%] Sauvegarde terminee.