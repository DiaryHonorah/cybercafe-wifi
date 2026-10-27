@echo off
echo ========================================
echo   Sauvegarde automatique Cyber Famille
echo ========================================
echo.
echo Ce script doit etre configure dans le
echo Planificateur de taches Windows.
echo.
echo Appuyez sur une touche pour lancer
echo une sauvegarde manuelle maintenant...
pause > nul

"C:\xampp\php\php.exe" "C:\xampp\htdocs\cybercafe-wifi\backend\scripts\backup_auto.php"

echo.
echo Appuyez sur une touche pour fermer
pause > nul