@echo off
REM ============================================
REM Tâche CRON quotidienne Cyber Famille
REM À exécuter chaque jour à 23h00
REM ============================================

echo [%date% %time%] Démarrage CRON quotidien...

REM 1. Envoyer le rapport journalier
powershell -Command "Invoke-WebRequest -Uri 'http://localhost/cybercafe-wifi/backend/api/cron/rapport-journalier' -UseBasicParsing | Out-Null"
echo [%date% %time%] Rapport journalier envoyé.

REM 2. Vérifier les alertes
powershell -Command "Invoke-WebRequest -Uri 'http://localhost/cybercafe-wifi/backend/api/cron/verifier-alertes' -UseBasicParsing | Out-Null"
echo [%date% %time%] Alertes vérifiées.

echo [%date% %time%] CRON quotidien terminé.