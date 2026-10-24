@echo off
title Cyber Famille - Arret complet
color 0C

echo ============================================================
echo           CYBER FAMILLE - ARRET COMPLET
echo ============================================================
echo.

echo Arret du frontend React...
taskkill /FI "WINDOWTITLE eq Cyber Famille - Frontend*" /F 2>NUL

echo Arret du serveur WebSocket...
taskkill /FI "WINDOWTITLE eq Cyber Famille - WebSocket*" /F 2>NUL

echo Arret d'Apache...
taskkill /IM httpd.exe /F 2>NUL

echo Arret de MySQL...
taskkill /IM mysqld.exe /F 2>NUL

echo.
echo ============================================================
echo   TOUS LES SERVICES SONT ARRETES
echo ============================================================
echo.
pause