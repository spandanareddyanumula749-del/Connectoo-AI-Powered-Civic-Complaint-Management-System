@echo off
title Connectoo Launcher
cd /d "%~dp0"
echo ========================================================
echo       Starting Connectoo - AI Civic Management System
echo ========================================================
echo.

:: Check Backend venv
if not exist "backend\venv\Scripts\activate.bat" (
    echo [SETUP] Setting up backend Python environment (first time only)...
    cd backend
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    python seed.py
    cd ..
)

:: Check Frontend node_modules
if not exist "frontend\node_modules" (
    echo [SETUP] Installing frontend packages (first time only)...
    cd frontend
    call npm install
    cd ..
)

echo [1/2] Starting Backend (FastAPI on http://127.0.0.1:8000)...
start "Connectoo - Backend" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Frontend (Vite on http://localhost:5173)...
start "Connectoo - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Waiting 5 seconds for servers to initialize...
timeout /t 5 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
explorer "http://localhost:5173"

echo.
echo ========================================================
echo Connectoo is running!
echo If your browser did not open automatically, simply open
echo Chrome or Edge and go to:
echo.
echo         http://localhost:5173
echo.
echo ========================================================
echo (Keep the two black terminal windows open while using the app)
pause
