@echo off
echo ========================================================
echo        PolicyVision AI 2.0 - Studio Launch Script
echo ========================================================

set "APP_DIR=%~dp0"
set "TMP=%APP_DIR%tmp"
set "TEMP=%APP_DIR%tmp"

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "PolicyVision Backend" cmd /k "cd /d "%APP_DIR%backend" && set PYTHONPATH=. && "%APP_DIR%venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Frontend Studio on http://localhost:3000 ...
start "PolicyVision Frontend" cmd /k "cd /d "%APP_DIR%frontend" && npm run dev"

echo.
echo ========================================================
echo PolicyVision AI is live!
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:3000
echo ========================================================
