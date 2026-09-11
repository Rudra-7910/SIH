@echo off
echo ==========================================
echo  Legal Metrology Inspection Assistant
echo  PROTOTYPE DEMO
echo ==========================================
echo.
echo Starting services...
echo.

echo [1/2] Starting Backend (Port 3001)...
start "LM-Backend" cmd /k "cd server && npm run dev"

timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend (Port 5173)...
start "LM-Frontend" cmd /k "cd client && npm run dev"

echo.
echo ==========================================
echo  Both services launched!
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:3001
echo ==========================================
echo.
pause
