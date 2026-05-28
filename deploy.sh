#!/bin/bash
set -e

echo "==> Pulling latest changes..."
git pull

echo "==> Stopping containers..."
docker compose down

echo "==> Building and starting containers..."
docker compose up -d --build

echo "==> Running migrations..."
docker compose exec app npx prisma migrate deploy

echo "==> Containers running:"
docker compose ps

echo "==> Logs (Ctrl+C to exit):"
docker compose logs -f app
