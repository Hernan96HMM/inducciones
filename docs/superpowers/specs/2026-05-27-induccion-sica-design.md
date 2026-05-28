# Sistema de Inducción SICA — Design Spec
**Fecha:** 2026-05-27  
**Formulario base:** F-003 PGR 6.2.2 Rev.10  
**Empresa:** SICA — "Industria para la Energía"

---

## 1. Objetivo

Digitalizar y centralizar el proceso de inducción de nuevos empleados en planta. Reemplaza el formulario Word F-003 con un flujo de firmas electrónicas entre tres sectores: Higiene & Seguridad → Gestión de Calidad → RRHH, con exportación final a PDF imprimible idéntico al formulario original.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend/Backend | Next.js 14, App Router, `output: 'standalone'` |
| ORM | Prisma |
| Base de datos | PostgreSQL 15 (local, Docker volume) |
| Cache/Real-time | Redis 7 (sesiones NextAuth + pub/sub SSE) |
| Auth | NextAuth v5, Credentials provider |
| PDF | Puppeteer + Chromium (apt en contenedor node:20-slim) |
| Real-time | Server-Sent Events (SSE) sobre Redis pub/sub |
| Email | Nodemailer + SMTP (opcional, toggle desde admin) |
| Iconos | Lucide React |
| Animaciones | Framer Motion |

---

## 3. Paleta de Colores

```css
:root {
  --sica-navy:  #2E4272;  /* Headers, navbar, fondos */
  --sica-blue:  #1A9AD6;  /* CTAs, acentos, highlights */
  --sica-white: #FFFFFF;  /* Texto sobre oscuro */
  --sica-light: #F4F6F9;  /* Fondos secciones claras */
  --sica-muted: #8A9BBE;  /* Texto secundario, bordes */
  --sica-dark:  #1A2A4A;  /* Fondo alternativo oscuro */
}
```

Excepciones semánticas permitidas: amber (estado etapa1 pendiente), emerald (completado).

---

## 4. Tipografía

- **Display/Headlines:** Barlow Condensed Bold/SemiBold
- **Body/Datos:** Inter Regular
- **Códigos/Fechas:** JetBrains Mono
- Fuente: Google Fonts

---

## 5. Roles y Control de Acceso

| Rol | Descripción | Rutas accesibles |
|---|---|---|
| `superadmin` | Administra usuarios y configuración global | `/admin/usuarios`, `/admin/configuracion` |
| `rrhh` | Crea ingresos, gestiona todo el flujo, exporta PDF | `/dashboard`, `/ingresos/nuevo`, `/detalle/[id]` |
| `hygiene` | Completa checklist Etapa 1 (parcial) y firma | `/hygiene/[id]` |
| `calidad` | Ve firma H&S, completa Etapa 1 (resto) + Etapa 2, firma | `/calidad/[id]` |
| `encargado` | Completa Etapa 3 (evaluación fin de prueba) | `/evaluacion/[id]` |

- Middleware Next.js protege todas las rutas por rol.
- Sin acceso cruzado entre roles (excepto superadmin que ve todo).
- Superadmin es el único que crea/edita/desactiva cuentas de usuario — no hay self-registration.

---

## 6. Flujo de Estados

```
borrador
  └─► etapa1_pendiente   (RRHH envía a H&S)
        └─► etapa2_pendiente  (H&S firma → notifica a Calidad)
              └─► completado       (Calidad firma → notifica a RRHH)
                    └─► evaluado        (Encargado completa Etapa 3)
```

Reglas de validación:
- No avanzar de etapa sin completar todos los items del checklist.
- No avanzar sin firma SVG capturada en canvas.
- RRHH puede exportar PDF solo desde estado `completado` o `evaluado`.

---

## 7. Etapas del Formulario

### Etapa 1 — G. Calidad y Seguridad & S.O. (compartida H&S + Calidad)

**Items firmados por H&S:**
1. Capacitación en sistema de calidad, seguridad y medio ambiente (F-003 + entrega plan de evacuación)
2. Recorrido por las instalaciones
3. Presentación general de la empresa (Presidente/Gerente general)

**Items firmados por Calidad:**
4. Entrega de estructura del sector
5. Indicar puesto de trabajo, baños y comedor

### Etapa 2 — Puesto de Trabajo (firmado digitalmente por Calidad)
Los items de Etapa 2 son completados y firmados por el rol `calidad` en el mismo paso que termina Etapa 1.
En el PDF impreso, la columna "Sector" de estos items muestra el sector del responsable real.
1. Entrega de descripción del puesto (F-001)
2. Inducción específica al puesto con empleado referente (F-054)

### Etapa 3 — Seguimiento y Evaluación (Encargado/Gerente)
- Fecha de evaluación
- Decisión de continuidad: SI / NO
- Justificación (texto libre)
- Firma del encargado
- Fecha y firma del ingresante (manuscrita, en papel)

---

## 8. Base de Datos (Prisma Schema)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password_hash String
  nombre        String
  rol           Rol
  activo        Boolean   @default(true)
  created_at    DateTime  @default(now())
  ingresos      Ingreso[] @relation("CreatedBy")
  encargado_de  Ingreso[] @relation("Encargado")
  audit_logs    AuditLog[]
  etapa_items   EtapaItem[]
}

enum Rol {
  superadmin
  rrhh
  hygiene
  calidad
  encargado
}

model Ingreso {
  id           String      @id @default(cuid())
  nombre       String
  apellido     String
  fecha_inicio DateTime
  sector       String
  puesto       String
  estado       Estado      @default(borrador)
  created_by   String
  encargado_id String
  created_at   DateTime    @default(now())
  updated_at   DateTime    @updatedAt
  creator      User        @relation("CreatedBy", fields: [created_by], references: [id])
  encargado    User        @relation("Encargado", fields: [encargado_id], references: [id])
  etapa_items  EtapaItem[]
  firmas       Firma[]
  evaluacion   Evaluacion?
  audit_log    AuditLog[]
}

enum Estado {
  borrador
  etapa1_pendiente
  etapa2_pendiente
  completado
  evaluado
}

model EtapaItem {
  id               String    @id @default(cuid())
  ingreso_id       String
  etapa            Int       // 1, 2 o 3
  item_key         String    // ej: "capacitacion_f003", "recorrido"
  completado       Boolean   @default(false)
  fecha_completado DateTime?
  responsable_id   String?
  ingreso          Ingreso   @relation(fields: [ingreso_id], references: [id])
  responsable      User?     @relation(fields: [responsable_id], references: [id])
}

model Firma {
  id              String   @id @default(cuid())
  ingreso_id      String
  rol_firmante    Rol
  nombre_firmante String
  firma_svg       String   // SVG completo como texto
  timestamp       DateTime @default(now())
  ingreso         Ingreso  @relation(fields: [ingreso_id], references: [id])
}

model Evaluacion {
  id                    String   @id @default(cuid())
  ingreso_id            String   @unique
  fecha_evaluacion      DateTime
  continua              Boolean
  justificacion         String?
  firma_encargado_svg   String
  created_at            DateTime @default(now())
  ingreso               Ingreso  @relation(fields: [ingreso_id], references: [id])
}

model AuditLog {
  id         String   @id @default(cuid())
  ingreso_id String?
  usuario_id String
  accion     String
  detalle    String?
  timestamp  DateTime @default(now())
  ingreso    Ingreso? @relation(fields: [ingreso_id], references: [id])
  usuario    User     @relation(fields: [usuario_id], references: [id])
}
```

---

## 9. API Endpoints

| Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|
| GET | `/api/health` | público | Health check Docker |
| POST | `/api/auth/[...nextauth]` | público | Login/logout |
| GET | `/api/ingresos` | rrhh | Lista todos los ingresos |
| POST | `/api/ingresos` | rrhh | Crear nuevo ingreso |
| GET | `/api/ingresos/[id]` | rrhh, hygiene, calidad, encargado | Detalle de ingreso |
| PATCH | `/api/ingresos/[id]` | rrhh | Actualizar datos |
| POST | `/api/firmas/[id]` | hygiene, calidad | Guardar SVG + avanzar estado |
| POST | `/api/evaluaciones/[id]` | encargado | Guardar Etapa 3 |
| GET | `/api/pdf/[id]` | rrhh | Generar PDF con Puppeteer |
| GET | `/api/events` | autenticado | SSE stream personal |
| GET | `/api/admin/users` | superadmin | Listar usuarios |
| POST | `/api/admin/users` | superadmin | Crear usuario |
| PATCH | `/api/admin/users/[id]` | superadmin | Editar/desactivar usuario |
| GET | `/api/admin/config` | superadmin | Leer configuración (email toggle) |
| PATCH | `/api/admin/config` | superadmin | Actualizar configuración |

---

## 10. Real-Time (SSE + Redis)

- Endpoint `/api/events` mantiene conexión SSE abierta por usuario autenticado.
- Al cambiar estado de un ingreso, el servidor publica en canal Redis `ingreso:{id}`.
- El SSE handler suscribe al canal y pushea el evento al cliente.
- El frontend actualiza badges de navbar y estado de la tabla sin recargar.
- Graceful shutdown: manejo de `SIGTERM` cierra conexiones SSE limpiamente.

---

## 11. Páginas y Layouts

### Login `/login`
- Fondo: mesh gradient animado `--sica-dark` + `--sica-navy`
- Card centrada: logo `logo-footer-1.png`, headline animado (shimmer letra a letra), campos email/password
- Badge de rol visible tras autenticación exitosa

### Dashboard RRHH `/dashboard`
- Navbar: `--sica-navy`, isotipo `Sica_logo.png`, nombre app, badge SSE pendientes
- 4 métricas bento en fila: Total · En proceso · Completados · Evaluados
- Filtros por sector y estado
- Tabla de ingresos con badge de estado + acciones (ver, continuar flujo)
- Botón "+ Nuevo Ingreso" → stepper

### Nuevo Ingreso `/ingresos/nuevo`
- Stepper horizontal visual (paso 1: datos personales, paso 2: puesto, paso 3: encargado)
- Validación inline por campo
- Confirmar → crea ingreso en estado `borrador`, opción de enviar a H&S inmediatamente

### Vista H&S `/hygiene/[id]`
- Header: datos del ingresante + badge estado
- Checklist táctil (checkboxes grandes, touch-friendly) con items de Etapa 1 (H&S)
- Canvas de firma: fondo blanco, trazo `--sica-navy`, botón limpiar con ícono reset
- Botón "Firmar y Enviar a Calidad" (habilitado solo si todos los items están marcados + firma capturada)

### Vista Calidad `/calidad/[id]`
- Sección read-only: firma H&S con SVG embebido visible + fecha + nombre firmante
- Checklist Calidad (items restantes Etapa 1 + Etapa 2)
- Canvas de firma propio
- Botón "Firmar y Enviar a RRHH"

### Detalle RRHH `/detalle/[id]`
- Formulario completo read-only: datos ingresante + todos los items + ambas firmas SVG
- Timeline de auditoría (quién hizo qué y cuándo)
- Botón "Exportar PDF" (solo si estado ≥ `completado`)

### Vista Evaluación `/evaluacion/[id]`
- Etapa 3: fecha de evaluación, toggle SI/NO, textarea justificación
- Canvas de firma encargado
- Enviar → estado `evaluado`

### Admin Usuarios `/admin/usuarios` (superadmin)
- Tabla de usuarios con rol, estado activo/inactivo
- Modal crear/editar: nombre, email, contraseña temporal, rol
- Toggle activo/inactivo

### Admin Config `/admin/configuracion` (superadmin)
- Toggle email notifications (on/off)
- Campos SMTP: host, port, user, password, from
- Test de conexión

### 404
- Isotipo `Sica_logo.png` centrado
- Mensaje en paleta corporativa, estilo industrial
- Link volver al dashboard

---

## 12. Componentes Reutilizables

| Componente | Descripción |
|---|---|
| `FirmaCanvas` | Canvas mouse+touch → SVG exportable. Props: `onCapture(svg)`, `strokeColor`, `bgColor`. Botón limpiar incluido. |
| `StatusBadge` | Badge de estado con color semántico SICA. Props: `estado: Estado`. |
| `BentoMetric` | Card métrica con valor grande y label. Props: `valor`, `label`, `color`. |
| `ChecklistItem` | Checkbox táctil grande. Props: `label`, `checked`, `onChange`, `disabled`. |
| `FirmaReadOnly` | Muestra SVG de firma con nombre firmante y fecha. Props: `firma: Firma`. |
| `AuditTimeline` | Lista cronológica de eventos audit_log. |
| `SSEProvider` | Context provider que mantiene conexión SSE y expone eventos. |

---

## 13. Exportación PDF

Template HTML que replica F-003:

**Header:**
- Logo `logo-footer-1.png` izquierda
- "PROGRAMA DE INDUCCIÓN" centrado en negrita
- "F-003" derecha en JetBrains Mono

**Tabla datos ingresante:**
- Nombre y Apellido | Espacio firma manuscrita
- Fecha de Inicio | Sector
- Puesto | Encargado/Gerente

**Tabla registro de inducción:**
- Columnas: Registro | Sector | Fecha | Firma Responsable
- Etapa 1: items H&S (sector "G. Calidad y Seguridad & S.O.") + items Calidad (sector "RR.HH.")
- Etapa 2: items con sector del responsable
- Etapa 3: fecha evaluación, SI/NO, justificación, firma encargado SVG

**Footer:**
- Línea punteada
- "Fecha y Firma del Ingresante"
- "PGR 6.2.2 – F-003 Rev.10"

Configuración Puppeteer:
- `executablePath`: Chromium instalado vía apt en `node:20-slim`
- Flags: `--no-sandbox --disable-setuid-sandbox` (Docker)
- Formato: A4, márgenes 2cm
- SVG de firmas: embebidos como `<img src="data:image/svg+xml;base64,..."/>`

---

## 14. Notificaciones

### In-app (siempre activo)
- Badge en navbar con contador de formularios pendientes para el rol activo.
- SSE pushea actualización del contador en tiempo real.

### Email (opcional, toggle desde `/admin/configuracion`)
- H&S firma → email a usuarios con rol `calidad`
- Calidad firma → email a usuarios con rol `rrhh`
- Nuevo ingreso creado → email a usuarios con rol `hygiene`
- Implementado con Nodemailer, config SMTP en variables de entorno.

---

## 15. Infraestructura y Deployment

### Docker Compose
```yaml
services:
  app:
    build: .
    ports: ["127.0.0.1:3010:3010"]   # NO exponer al exterior
    depends_on: [db, redis]
    env_file: .env
  db:
    image: postgres:15
    volumes: [postgres_data:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: induccion
      POSTGRES_USER: sica
      POSTGRES_PASSWORD: ${DB_PASSWORD}
  redis:
    image: redis:7-alpine
volumes:
  postgres_data:
```

### Dockerfile (multi-stage)
- Stage `builder`: `node:20-slim`, instala Chromium, `npm run build`
- Stage `runner`: `node:20-slim`, standalone output, usuario no-root `nextjs`
- `EXPOSE 3010`
- `HEALTHCHECK`: `curl -f http://localhost:3010/api/health`

### Variables de entorno (.env.example)
```
DATABASE_URL=postgresql://sica:password@db:5432/induccion
NEXTAUTH_SECRET=cambiar_esto_en_produccion
NEXTAUTH_URL=http://induccion.sica.local
NEXT_PUBLIC_APP_URL=http://induccion.sica.local
NEXT_PUBLIC_COMPANY_NAME=SICA
REDIS_URL=redis://redis:6379
PORT=3010
DB_PASSWORD=cambiar_esto
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=inducciones@sica.com.ar
EMAIL_ENABLED=false
# Seed superadmin (usar solo en primer deploy)
SEED_ADMIN_EMAIL=admin@sica.com.ar
SEED_ADMIN_PASSWORD=cambiar_esto_en_produccion
```

### nginx.conf.example
```nginx
server {
    listen 80;
    server_name induccion.sica.local;

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3010;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Scripts de operación
- `deploy.sh`: `git pull` → `docker compose down` → `docker compose up -d --build` → `docker compose logs -f`
- `backup-db.sh`: `pg_dump` con timestamp hacia `/backups/induccion-YYYY-MM-DD.sql`
- `README-deploy.md`: setup Ubuntu Server, instalar Docker, clonar repo, configurar nginx, primer deploy

---

## 16. Estructura de Archivos

```
induccion-sica/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── ingresos/nuevo/page.tsx
│   │   ├── hygiene/[id]/page.tsx
│   │   ├── calidad/[id]/page.tsx
│   │   ├── detalle/[id]/page.tsx
│   │   └── evaluacion/[id]/page.tsx
│   ├── admin/
│   │   ├── usuarios/page.tsx
│   │   └── configuracion/page.tsx
│   ├── not-found.tsx
│   └── api/
│       ├── health/route.ts
│       ├── ingresos/route.ts
│       ├── ingresos/[id]/route.ts
│       ├── firmas/[id]/route.ts
│       ├── evaluaciones/[id]/route.ts
│       ├── pdf/[id]/route.ts
│       ├── events/route.ts
│       ├── admin/users/route.ts
│       ├── admin/users/[id]/route.ts
│       ├── admin/config/route.ts
│       └── auth/[...nextauth]/route.ts
├── components/
│   ├── firma-canvas.tsx
│   ├── firma-read-only.tsx
│   ├── status-badge.tsx
│   ├── bento-metric.tsx
│   ├── checklist-item.tsx
│   ├── audit-timeline.tsx
│   └── sse-provider.tsx
├── lib/
│   ├── auth.ts              # NextAuth config
│   ├── pdf-generator.ts     # Puppeteer + template F-003
│   ├── redis.ts             # Redis client + pub/sub
│   ├── email.ts             # Nodemailer
│   └── prisma.ts            # Prisma client singleton
├── middleware.ts             # Protección de rutas por rol
├── prisma/
│   ├── schema.prisma
│   └── seed.ts              # Seed superadmin inicial (email + password desde .env)
├── public/brand/
│   ├── logo-footer-1.png
│   ├── logo-footer-1.jpg
│   └── Sica_logo.png
├── docker-compose.yml
├── Dockerfile
├── nginx.conf.example
├── .env.example
├── deploy.sh
├── backup-db.sh
└── README-deploy.md
```

---

## 17. Decisiones de Diseño Clave

1. **SSE sobre WebSocket:** Unidireccional (servidor → cliente) es suficiente para actualizaciones de estado de formulario. Menos complejidad que WS, funciona con fetch nativo.
2. **Puppeteer en contenedor:** PDF server-side garantiza fidelidad al F-003 independientemente del browser del usuario. Chromium instalado vía apt en imagen slim.
3. **Sin Supabase cloud:** Todo local. Prisma migrations para control de esquema. `pg_dump` para backups.
4. **Superadmin gestiona usuarios:** Sin self-registration. Sistema cerrado para usuarios internos de planta.
5. **Email desactivado por defecto:** No bloquea el deploy inicial. Se activa cuando el cliente configure SMTP.
6. **SVG como string en DB:** Simplicidad. Los SVG de firma son pequeños (<10KB típicamente). No necesita S3 ni filesystem separado.
