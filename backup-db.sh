#!/bin/bash
set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="induccion-${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "==> Dumping database to ${BACKUP_DIR}/${FILENAME}..."
docker compose exec -T db pg_dump -U sica induccion > "${BACKUP_DIR}/${FILENAME}"

# Keep last 30 backups
ls -t "${BACKUP_DIR}"/induccion-*.sql | tail -n +31 | xargs -r rm

echo "==> Backup complete: ${BACKUP_DIR}/${FILENAME}"
