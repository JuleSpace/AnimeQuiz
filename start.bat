@echo off
echo ====================================
echo   Demarrage d'AnimeQuiz
echo ====================================
echo.

if not exist ".env" (
    echo ATTENTION: Fichier .env manquant !
    echo Copiez env.example vers .env et configurez-le
    echo.
    pause
    exit /b 1
)

echo Demarrage du serveur en mode developpement...
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo Appuyez sur Ctrl+C pour arreter
echo.

npm run dev
