@echo off
title Cyber Famille - Demarrage complet
color 0A

echo ============================================================
echo           CYBER FAMILLE - DEMARRAGE COMPLET
echo ============================================================
echo.

REM ============================================
REM 1. Verification XAMPP
REM ============================================
echo [1/5] Verification de XAMPP...
if not exist "C:\xampp\xampp_start.exe" (
    echo    ERREUR : XAMPP non trouve dans C:\xampp\
    pause
    exit
)
echo    OK - XAMPP trouve
echo.

REM ============================================
REM 2. Demarrage Apache + MySQL
REM ============================================
echo [2/5] Demarrage d'Apache et MySQL...
tasklist /FI "IMAGENAME eq httpd.exe" 2>NUL | find /I /N "httpd.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo    Apache deja en cours
) else (
    start "" "C:\xampp\apache\bin\httpd.exe"
    echo    Apache demarre
)

tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo    MySQL deja en cours
) else (
    start "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
    echo    MySQL demarre
)
timeout /t 3 /nobreak >NUL
echo.

REM ============================================
REM 3. Demarrage WebSocket
REM ============================================
echo [3/5] Demarrage du serveur WebSocket...
if exist "C:\xampp\htdocs\cybercafe-wifi\backend\websocket\server.php" (
    start "Cyber Famille - WebSocket" cmd /k "cd /d C:\xampp\htdocs\cybercafe-wifi\backend\websocket && C:\xampp\php\php.exe server.php"
    echo    WebSocket demarre
) else (
    echo    ATTENTION : WebSocket non trouve
)
timeout /t 2 /nobreak >NUL
echo.

REM ============================================
REM 4. Demarrage frontend React
REM ============================================
echo [4/5] Demarrage du frontend React...
if exist "C:\xampp\htdocs\cybercafe-wifi\frontend\package.json" (
    start "Cyber Famille - Frontend" cmd /k "cd /d C:\xampp\htdocs\cybercafe-wifi\frontend && npm run dev"
    echo    Frontend demarre
) else (
    echo    ERREUR : frontend non trouve
    pause
    exit
)
timeout /t 6 /nobreak >NUL
echo.

REM ============================================
REM 5. Ouverture navigateur
REM ============================================
echo [5/5] Ouverture du navigateur...
start "" "http://localhost:5173"

echo.
echo ============================================================
echo   TOUT EST PRET !
echo ============================================================
echo.
echo   Frontend  : http://localhost:5173
echo   Backend   : http://localhost/cybercafe-wifi/backend
echo   Portail   : http://localhost:5173/portail
echo   Diagnostic: http://localhost:5173/admin/diagnostic
echo.
echo   Pour arreter : lancez arreter_tout.bat
echo.
pause