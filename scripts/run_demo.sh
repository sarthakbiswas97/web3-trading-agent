#!/bin/bash
# VAPM Demo Setup Script
# Starts all services needed for demo recording

set -e

echo "=== VAPM Demo Setup ==="
echo ""

# 1. Infrastructure
echo "[1/3] Starting PostgreSQL + Redis..."
docker-compose up -d postgres redis
sleep 3
echo "  Done."

# 2. Backend
echo "[2/3] Starting backend (port 8001)..."
cd backend
../venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!
cd ..
sleep 5
echo "  Backend PID: $BACKEND_PID"

# 3. Frontend
echo "[3/3] Starting frontend (port 3000)..."
cd frontend
bun run dev &
FRONTEND_PID=$!
cd ..
sleep 3
echo "  Frontend PID: $FRONTEND_PID"

echo ""
echo "=== All services running ==="
echo ""
echo "Dashboard:  http://localhost:3000"
echo "Backend:    http://localhost:8001/health"
echo ""
echo "To run E2E demo (in separate terminal):"
echo "  cd e2e-ika && cargo run"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker-compose stop" EXIT
wait
