@echo off
SETLOCAL EnableExtensions
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

echo.
echo ==========================================
echo    STARTING COSMO AI VIDEO ANALYSIS
echo ==========================================
echo.

:: Check for node_modules
if not exist "node_modules\" (
    echo [1/3] Installing dependencies...
    call npm install
) else (
    echo [1/3] Dependencies already installed.
)

:: Wait for server to start
echo [2/3] Starting Cosmo Server...
start /b cmd /c "npm run dev"

echo [3/3] Opening Cosmo in browser...
timeout /t 5 /nobreak > nul
start http://localhost:3000

echo.
echo Application is running! 
echo Keep this window open while using the app.
echo.
pause
