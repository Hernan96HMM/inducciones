# Deploy — SICA Sistema de Inducción

## Requisitos

- Ubuntu Server 22.04+
- Docker + Docker Compose v2
- nginx (ya instalado y corriendo)
- Git

## Primer Deploy

```bash
# 1. Clonar repositorio
git clone <repo-url> /opt/induccion-sica
cd /opt/induccion-sica

# 2. Configurar variables de entorno
cp .env.example .env
nano .env
# Cambiar: NEXTAUTH_SECRET, DB_PASSWORD, NEXTAUTH_URL, SEED_ADMIN_*

# 3. Levantar contenedores
docker compose up -d --build

# 4. Correr migraciones
docker compose exec app npx prisma migrate deploy

# 5. Crear superadmin inicial
docker compose exec app npm run db:seed
```

## Configurar nginx

```bash
# Copiar config de ejemplo
sudo cp nginx.conf.example /etc/nginx/sites-available/induccion-sica
sudo ln -s /etc/nginx/sites-available/induccion-sica /etc/nginx/sites-enabled/

# Editar server_name según DNS interno
sudo nano /etc/nginx/sites-available/induccion-sica

# Verificar y recargar
sudo nginx -t && sudo systemctl reload nginx
```

## DNS Interno (Fortinet)

Crear registro A: `induccion.sica.local` → IP del servidor

## Updates

```bash
chmod +x deploy.sh
./deploy.sh
```

## Backups

```bash
chmod +x backup-db.sh
./backup-db.sh

# Automatizar con cron (diario a las 2am)
echo "0 2 * * * /opt/induccion-sica/backup-db.sh" | crontab -
```

## Variables de entorno clave

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret para JWT (usar `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL pública de la app |
| `REDIS_URL` | Redis connection string |
| `EMAIL_ENABLED` | `true` para activar emails |
| `SMTP_*` | Configuración SMTP |
| `SEED_ADMIN_EMAIL` | Email del superadmin inicial |
| `SEED_ADMIN_PASSWORD` | Contraseña del superadmin inicial |

## Logs

```bash
docker compose logs -f app    # App
docker compose logs -f db     # PostgreSQL
docker compose logs -f redis  # Redis
```

## Health check

```bash
curl http://localhost:3010/api/health
# {"status":"ok","timestamp":"..."}
```
