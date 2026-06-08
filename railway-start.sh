#!/usr/bin/env sh
# Démarrage Railway : migrations puis les 2 process (API interne :4000 + web public :$PORT).
set -e

echo "[loden] prisma migrate deploy..."
npx --yes prisma migrate deploy

echo "[loden] démarrage API (interne :4000)..."
PORT=4000 node dist/backend/main.js &

echo "[loden] démarrage web (public :${PORT:-3000})..."
exec npx --yes next start -p "${PORT:-3000}"
