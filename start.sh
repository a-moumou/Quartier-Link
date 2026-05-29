#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo " Démarrage de QuartierLink..."

# Backend
echo "Backend Symfony sur http://localhost:8000"
cd "$ROOT/backend"
php -S localhost:8000 -t public &
BACKEND_PID=$!

# Frontend
echo "Frontend React sur http://localhost:3000"
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Les deux serveurs sont lancés."
echo "   Frontend : http://localhost:3000"
echo "   Backend  : http://localhost:8000"
echo ""
echo "Appuie sur Ctrl+C pour tout arrêter."

# Arrêter les deux processus proprement au Ctrl+C
trap "echo ''; echo 'Arrêt...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait
