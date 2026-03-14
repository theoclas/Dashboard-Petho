# Auditoría Técnica de Producción — Dashboard Petho
> Fecha: 14 de marzo de 2026  
> Stack: NestJS + TypeORM + PostgreSQL (backend) | React + Vite (frontend)  
> Destino: VPS Ubuntu (Hostinger) con PM2, Nginx, SSL/Certbot

---

## 1. Diagnóstico general del proyecto

El proyecto está bien estructurado y gran parte de la configuración de producción ya está implementada. La mayoría de los puntos críticos identificados en auditorías anteriores han sido corregidos: `synchronize` condicionado a `NODE_ENV`, CORS restringido, seed de admin con variables de entorno, JWT_SECRET en `.env`, `ecosystem.config.js` para PM2. Sin embargo, persisten **2 errores críticos de seguridad** (endpoints CPA y Notas sin autenticación) y **1 error bloqueante** (`.env.production` con URL localhost). La base técnica permite desplegar; faltan correcciones puntuales antes de hacerlo de forma segura.

---

## 2. Qué ya está listo para producción

| Área | Estado | Detalle |
|------|--------|---------|
| **Backend build** | ✅ | `nest build` genera `dist/` correctamente |
| **Backend start** | ✅ | `start:prod`: `node dist/main` — punto de entrada correcto |
| **TypeORM** | ✅ | `synchronize: process.env.NODE_ENV !== 'production'` |
| **Migraciones** | ✅ | Existe `src/migrations/1773521930879-NuevoCambio.ts`, se compila a `dist/migrations/` |
| **migrationsRun** | ✅ | `migrationsRun: true` en `database.config.ts` |
| **JWT_SECRET** | ✅ | Definido en `.env` (no hardcodeado en uso real) |
| **CORS** | ✅ | Restringido con `CORS_ORIGIN`, fallback localhost:5173 |
| **Admin seed** | ✅ | Usa `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` del `.env` |
| **PM2** | ✅ | `ecosystem.config.js` configurado con `dist/main.js`, `env_file`, autorestart |
| **Variables .env** | ✅ | Todas las necesarias definidas en `petho-api/.env` |
| **Frontend build** | ✅ | `tsc -b && vite build` — genera `dist/` |
| **React Router** | ✅ | `BrowserRouter` + rutas protegidas — compatible con SPA fallback en Nginx |
| **Protección rutas** | ⚠️ Parcial | Pedidos, Cartera, Mapeo, Users, Import protegidos con JWT |
| **Auth** | ✅ | JWT con validación de `is_active` en `jwt.strategy.ts` |

---

## 3. Problemas críticos que impedirían desplegarlo

### CRÍTICO 1: `VITE_API_URL` apunta a localhost en `.env.production`

**Archivo:** `petho-dashboard/.env.production`

```
VITE_API_URL=http://localhost:3001/api
#VITE_API_URL=https://www.fersuastudio.com/api
```

En producción, el frontend se sirve como estático. La variable `VITE_API_URL` se incrusta en el bundle en tiempo de build. Con `localhost`, todas las peticiones irán al navegador del usuario, no al servidor. La aplicación quedará sin conexión a la API.

**Corrección:** Descomentar y usar la URL real, y comentar o eliminar la de localhost:
```
VITE_API_URL=https://www.fersuastudio.com/api
```

Y ejecutar `npm run build` con esta configuración antes de subir.

---

### CRÍTICO 2: CPA Controller sin autenticación

**Archivo:** `petho-api/src/cpa/cpa.controller.ts`

El controlador no usa `@UseGuards(JwtAuthGuard)`. Los endpoints son públicos:
- `GET /api/cpa` — listar todos
- `GET /api/cpa/stats`
- `POST /api/cpa` — crear
- `GET /api/cpa/:id`
- `PATCH /api/cpa/:id`
- `DELETE /api/cpa/:id`

Cualquiera puede crear, modificar y eliminar datos CPA sin autenticación.

**Corrección:** Añadir el guard (y RolesGuard si aplica), igual que en pedidos/mapeo-estados:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('cpa')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERADOR)
export class CpaController {
```

---

### CRÍTICO 3: Notas Controller sin autenticación

**Archivo:** `petho-api/src/notas/notas.controller.ts`

Tampoco usa guards. Endpoints públicos:
- `POST /api/notas`
- `GET /api/notas`
- `GET /api/notas/:id`
- `PATCH /api/notas/:id`
- `DELETE /api/notas/:id`

**Corrección:** Añadir los mismos guards que en CPA o pedidos, según el modelo de permisos deseado.

---

## 4. Problemas importantes a corregir

### IMPORTANTE 1: Fallback JWT en auth.module.ts

**Archivo:** `petho-api/src/auth/auth.module.ts` (línea 14)

```typescript
secret: process.env.JWT_SECRET || 'petho_super_secret_key_2026',
```

Si `JWT_SECRET` no está en el `.env` del VPS, se usará el secreto hardcodeado. El `.env` actual sí lo tiene, pero conviene eliminar el fallback para que la aplicación falle de forma explícita:

```typescript
secret: process.env.JWT_SECRET,
```

Y validar en bootstrap que exista, o usar `ConfigService` para asegurarse de que el valor esté definido.

---

### IMPORTANTE 2: .env.Example incompleto

**Archivo:** `petho-api/.env.Example`

Falta `ADMIN_USERNAME`, que `users.service.ts` usa en el seed. El comentario sobre la clave JWT (`#LA CLAVE SECRETA PARA EL JWT ES PETHO EN CODIGO X 3`) puede inducir a usar secretos débiles; es mejor eliminarlo o sustituirlo por instrucciones genéricas de generación.

---

### IMPORTANTE 3: dotenv como dependencia explícita

**Archivo:** `petho-api/package.json`

`main.ts` usa `import 'dotenv/config'`, pero `dotenv` no está en `dependencies`. Funciona vía dependencias transitivas (p. ej. TypeORM), pero no está garantizado en futuras versiones. Se recomienda añadirlo explícitamente:

```bash
npm install dotenv
```

---

### IMPORTANTE 4: CORS_ORIGIN en producción

`petho-api/.env` tiene `CORS_ORIGIN=http://localhost:5173`. En el VPS debe coincidir con el dominio real, por ejemplo:

```
CORS_ORIGIN=https://www.fersuastudio.com
```

Si usas `www` y también el dominio sin `www`, puede hacerse con múltiples orígenes si NestJS lo soporta, o usando el dominio principal que Nginx sirva.

---

### IMPORTANTE 5: Verificación de ruta de migraciones

**Archivo:** `petho-api/src/config/database.config.ts`

```typescript
migrations: ['dist/migrations/*.js'],
```

`nest build` incluye `src/migrations/*.ts` en la compilación y genera `dist/migrations/*.js`. La ruta es correcta. Solo hay que asegurarse de que `NODE_ENV=production` esté definido al arrancar, para que `synchronize` sea `false` y las migraciones se ejecuten.

---

## 5. Mejoras recomendadas

| Mejora | Prioridad | Descripción |
|--------|-----------|-------------|
| Rate limiting en auth | Media | Añadir `@nestjs/throttler` en `/api/auth/login` y `/api/auth/register` |
| Registro público | Media | Valorar restringir `POST /api/auth/register` (ej. solo en desarrollo o con token/invitación) |
| JWT en HttpOnly cookies | Media | Sustituir `localStorage` por cookies para reducir riesgo XSS |
| Configuración Nginx | Alta | Crear y versionar `nginx.conf` o un snippet para el sitio |
| `.env.example` sin valores reales | Alta | Crear `.env.example` con nombres de variables pero sin credenciales |
| Logs | Baja | Configurar rotación de logs con PM2 o sistema externo |
| Health check | Baja | Endpoint `/api/health` para comprobar que la API responde |

---

## 6. Checklist final antes de deploy

### Backend
- [ ] Corregir CPA controller: añadir `JwtAuthGuard` (y `RolesGuard` si aplica)
- [ ] Corregir Notas controller: añadir guards de autenticación
- [ ] Eliminar o endurecer fallback de `JWT_SECRET` en `auth.module.ts`
- [ ] Añadir `dotenv` a `dependencies` si se mantiene `import 'dotenv/config'`
- [ ] Verificar `petho-api/.env` en el VPS con `CORS_ORIGIN` del dominio de producción
- [ ] Ejecutar `npm run build` en `petho-api` y comprobar que existe `dist/main.js` y `dist/migrations/`

### Frontend
- [ ] Cambiar `VITE_API_URL` en `petho-dashboard/.env.production` a la URL real (ej. `https://www.fersuastudio.com/api`)
- [ ] Ejecutar `npm run build` en `petho-dashboard`
- [ ] Comprobar que `dist/` contiene `index.html` y assets

### Base de datos
- [ ] PostgreSQL instalado y accesible desde el VPS
- [ ] Base de datos y usuario creados
- [ ] Variables `DB_*` correctas en `.env`

### Despliegue
- [ ] `ecosystem.config.js` con `cwd` correcto (`/var/www/petho-api` o la ruta real)
- [ ] PM2 instalado globalmente
- [ ] Configuración Nginx creada (proxy `/api`, SPA fallback, root del frontend)
- [ ] Certbot instalado y certificado SSL obtenido

---

## 7. Pasos exactos para desplegar en VPS Ubuntu

### A. Preparar el VPS
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs postgresql postgresql-contrib nginx
sudo npm install -g pm2
```

### B. PostgreSQL
```bash
sudo -u postgres psql
CREATE USER petho_user WITH PASSWORD 'tu_password_segura';
CREATE DATABASE petho_db OWNER petho_user;
GRANT ALL PRIVILEGES ON DATABASE petho_db TO petho_user;
\q
```

### C. Subir backend
```bash
# Copiar petho-api al VPS (rsync, scp, git, etc.)
cd /var/www/petho-api
# Crear .env con variables de producción (incluida CORS_ORIGIN=https://...)
npm install --omit=dev
npm run build
```

### D. PM2
```bash
cd /var/www/petho-api
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### E. Frontend (build local con URL de producción)
```bash
# En tu máquina local:
cd petho-dashboard
# Asegurar .env.production con VITE_API_URL=https://tu-dominio.com/api
npm run build
# Subir el contenido de dist/ al VPS en /var/www/petho-dashboard/
```

### F. Nginx
Crear `/etc/nginx/sites-available/petho`:
```nginx
server {
    listen 80;
    server_name www.fersuastudio.com fersuastudio.com;

    root /var/www/petho-dashboard;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/petho /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### G. SSL
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d www.fersuastudio.com -d fersuastudio.com
```

### H. Verificación
```bash
pm2 status
pm2 logs petho-api
curl -I https://www.fersuastudio.com
curl https://www.fersuastudio.com/api
```

---

## Resumen ejecutivo

| Aspecto | Estado |
|---------|--------|
| Estructura del proyecto | ✅ Adecuada |
| Build backend/frontend | ✅ Funcional |
| TypeORM y migraciones | ✅ Listas |
| PM2 | ✅ Configurado |
| Seguridad (JWT, CORS, admin) | ⚠️ Mayormente OK; fallback JWT y CORS_ORIGIN pendientes |
| Endpoints sin auth (CPA, Notas) | ❌ Crítico |
| VITE_API_URL en producción | ❌ Bloqueante |
| Nginx / SSL | ⚠️ Por configurar en el VPS |

**Veredicto:** El proyecto puede desplegarse tras corregir los 3 problemas críticos (CPA, Notas y `VITE_API_URL`) y ajustar CORS_ORIGIN y el fallback de JWT. Con esas correcciones, está listo para producción en un VPS Ubuntu con Hostinger.
