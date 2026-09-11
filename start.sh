#!/usr/bin/env bash

# Legal Metrology Inspection Assistant — Cross-Platform Startup Script

echo "=========================================="
echo " Legal Metrology Inspection Assistant"
echo " PROTOTYPE DEMO"
echo "=========================================="
echo ""

# Check for node
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 18+."
    exit 1
fi

echo "[1/2] Starting Backend Server (Port 3001)..."
(cd server && npm run dev) &
BACKEND_PID=$!

sleep 2

echo "[2/2] Starting Frontend Client (Port 5173)..."
(cd client && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo " Both services running in background!"
echo " Frontend: http://localhost:5173"
echo " Backend:  http://localhost:3001"
echo " Press Ctrl+C to terminate both servers."
echo "=========================================="

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM EXIT
wait
