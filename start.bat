@echo off
echo Starting LabelCheck Services...

echo [1/3] Starting Python AI Microservice (Port 8000)...
start "AI Service" cmd /k "cd ai-service && if not exist venv (echo Setting up virtual environment... && python -m venv venv && call venv\Scripts\activate && pip install -r requirements.txt) else (call venv\Scripts\activate) && uvicorn main:app --reload --port 8000"

echo [2/3] Starting Node Backend (Port 5000)...
start "Node Backend" cmd /k "cd server && node server.js"

echo [3/3] Starting React Frontend (Port 5173)...
start "React Frontend" cmd /k "cd client && npm run dev"

echo All services launched in separate windows! 
echo Frontend available at http://localhost:5173
