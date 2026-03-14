# Auditoría de Producción — Dashboard Petho
> Generado: 14 de marzo de 2026  
> Stack: NestJS (backend) + React/Vite (frontend)  
> Destino: VPS Linux de Hostinger

---

## Diagnóstico General

El proyecto tiene una arquitectura correcta y código funcional bien organizado. Sin embargo, fue diseñado exclusivamente para desarrollo local y tiene múltiples configuraciones que fallarán o crearán riesgos serios en producción. No existe ningún artefacto de despliegue (Docker, Nginx, PM2), hay secretos hardcodeados en el código fuente, y la base de datos está configurada de una manera que puede destruir datos en un reinicio.

---

## Nivel de Preparación para Producción

**3 / 10 — NO LISTO**

El código base funciona, pero requiere correcciones obligatorias antes de cualquier deploy.

---

## Errores Críticos

### CRÍTICO-1: `synchronize: true` en TypeORM — Riesgo de pérdida de datos
**Archivo:** `petho-api/src/config/database.config.ts`

```typescript
synchronize: true, // Solo para desarrollo — desactivar en producción
```

Cada vez que el servidor reinicia, TypeORM compara las entidades con el esquema real de la base de datos y **altera las tablas automáticamente**. En producción, si cambias una entidad (renombras una columna, cambias un tipo), TypeORM puede **dropear columnas con datos reales sin advertencia**.

**Acción obligatoria:** Cambiar a `synchronize: false` y usar migraciones TypeORM.

---

### CRÍTICO-2: Secreto JWT hardcodeado en código fuente
**Archivos:** `petho-api/src/auth/auth.module.ts`, `petho-api/src/auth/strategies/jwt.strategy.ts`

```typescript
secret: process.env.JWT_SECRET || 'petho_super_secret_key_2026',
```

Aparece **dos veces** en el source. El archivo `.env` actual **no tiene `JWT_SECRET` definido**, por lo que el sistema ya está usando el secreto hardcodeado incluso en local. Cualquiera que vea el código puede forjar tokens de administrador válidos.

**Acción obligatoria:** Agregar `JWT_SECRET` al `.env` con un valor generado aleatoriamente.

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### CRÍTICO-3: CORS abierto a todos los orígenes
**Archivo:** `petho-api/src/main.ts`

```typescript
app.enableCors(); // Sin opciones = permite TODOS los orígenes (*)
```

Cualquier dominio puede hacer requests autenticados a la API. En producción debe restringirse al dominio del frontend.

---

### CRÍTICO-4: Credenciales de admin hardcodeadas y auto-sembradas
**Archivo:** `petho-api/src/users/users.service.ts`

```typescript
console.log('No admin found, creating default admin (admin@petho.com / admin123)...');
const hashedPassword = await bcrypt.hash('admin123', 10);
```

Si la base de datos de producción está vacía al primer arranque, se crea automáticamente un admin con credenciales públicamente conocidas. Cualquiera puede entrar con `admin@petho.com` / `admin123`.

---

### CRÍTICO-5: `JWT_SECRET` ausente en el `.env` actual
**Archivo:** `petho-api/.env`

El archivo `.env` actual tiene solo 6 variables y **no incluye `JWT_SECRET`**. Esto significa que en producción, si se copia este `.env` tal cual, el sistema usará el secreto hardcodeado del punto CRÍTICO-2.

---

## Lista de Riesgos

| Severidad | Riesgo | Archivo |
|---|---|---|
| ALTO | Sin migraciones TypeORM — solo `synchronize: true` | `database.config.ts` |
| ALTO | `JWT_SECRET` no definido en `.env` | `petho-api/.env` |
| ALTO | Sin Dockerfile, Nginx ni PM2 config | No existen |
| ALTO | Contraseña de BD visible en `.env` sin cifrado | `petho-api/.env` |
| MEDIO | `VITE_API_URL` no definido — el frontend usa fallback `localhost` en producción | `petho-dashboard/src/api.ts` |
| MEDIO | JWT almacenado en `localStorage` — vulnerable a XSS | `AuthContext.tsx` |
| MEDIO | `vite.config.ts` sin configuración de producción | `vite.config.ts` |
| MEDIO | Sin rate limiting en endpoints de auth — brute force posible | `auth.controller.ts` |
| MEDIO | Endpoint `POST /api/auth/register` es público sin restricción | `auth.controller.ts` |
| BAJO | `@tanstack/react-query` instalado pero sin `QueryClientProvider` | `package.json` |
| BAJO | READMEs son plantillas por defecto sin documentación real | `README.md` |

---

## Qué Corregir Antes de Subir

### Corrección 1: Actualizar `petho-api/.env` con todas las variables necesarias

```env
PORT=3001
NODE_ENV=production

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=petho_user
DB_PASSWORD=TU_PASSWORD_SEGURA_AQUI
DB_DATABASE=petho_db

JWT_SECRET=GENERA_AQUI_UN_STRING_DE_64_CHARS_ALEATORIOS

CORS_ORIGIN=https://tu-dominio.com

ADMIN_EMAIL=tu-email-real@dominio.com
ADMIN_PASSWORD=TU_PASSWORD_ADMIN_SEGURA
```

Para generar `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### Corrección 2: Crear `.env.production` para el frontend

Crear `petho-dashboard/.env.production`:

```env
VITE_API_URL=https://tu-dominio.com/api
```

> **Importante:** Esta variable se fija en tiempo de build (`npm run build`). No se puede cambiar después sin recompilar.

---

### Corrección 3: Desactivar `synchronize` en TypeORM

**Archivo:** `petho-api/src/config/database.config.ts`

Reemplazar:
```typescript
synchronize: true,
```

Por:
```typescript
synchronize: process.env.NODE_ENV !== 'production',
migrations: ['dist/migrations/*.js'],
migrationsRun: true,
```

Luego generar la migración inicial:
```bash
cd petho-api
npx typeorm migration:generate src/migrations/InitialSchema -d src/data-source.ts
```

---

### Corrección 4: Restringir CORS

**Archivo:** `petho-api/src/main.ts`

Reemplazar:
```typescript
app.enableCors();
```

Por:
```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
});
```

---

### Corrección 5: Usar variables de entorno para el seed del admin

**Archivo:** `petho-api/src/users/users.service.ts`

Reemplazar la lógica hardcodeada:
```typescript
async seedAdmin() {
  const adminCount = await this.usersRepository.count({ where: { role: UserRole.ADMIN } });
  if (adminCount === 0) {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      throw new Error('ADMIN_EMAIL y ADMIN_PASSWORD son requeridos en el .env');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = this.usersRepository.create({
      email,
      username: 'admin',
      password: hashedPassword,
      role: UserRole.ADMIN,
      is_active: true,
    });
    await this.usersRepository.save(admin);
    console.log(`Admin creado: ${email}`);
  }
}
```

---

### Corrección 6: Ajustar `vite.config.ts` para producción

**Archivo:** `petho-dashboard/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd', '@ant-design/icons'],
        }
      }
    }
  }
})
```

---

## Guía de Despliegue — Hostinger VPS (Ubuntu 22.04)

### Paso 1: Preparar el VPS

```bash
sudo apt update && sudo apt upgrade -y

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 (process manager)
sudo npm install -g pm2

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Nginx
sudo apt install -y nginx
```

---

### Paso 2: Configurar PostgreSQL

```bash
sudo -u postgres psql

CREATE USER petho_user WITH PASSWORD 'tu_password_segura';
CREATE DATABASE petho_db OWNER petho_user;
GRANT ALL PRIVILEGES ON DATABASE petho_db TO petho_user;
\q
```

---

### Paso 3: Subir y compilar el backend

```bash
# Subir la carpeta petho-api al VPS en /var/www/petho-api/
# Crear /var/www/petho-api/.env con las variables de producción

cd /var/www/petho-api
npm install --omit=dev
npm run build
# Genera dist/ — el punto de entrada es dist/main.js
```

---

### Paso 4: Crear config de PM2

Crear `/var/www/petho-api/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'petho-api',
    script: 'dist/main.js',
    cwd: '/var/www/petho-api',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env_file: '.env',
    env: {
      NODE_ENV: 'production',
    },
  }]
};
```

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # genera el comando para arranque automático con el sistema
```

---

### Paso 5: Compilar el frontend (en tu máquina local)

```bash
cd petho-dashboard
# Asegúrate de que petho-dashboard/.env.production existe con VITE_API_URL correcto
npm run build
# Genera petho-dashboard/dist/
# Subir el contenido de dist/ al VPS en /var/www/petho-dashboard/
```

---

### Paso 6: Configurar Nginx

Crear `/etc/nginx/sites-available/petho`:

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Frontend — servir el build estático de React/Vite
    root /var/www/petho-dashboard;
    index index.html;

    # SPA fallback — necesario para que react-router-dom funcione
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy inverso al backend NestJS
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        # Para uploads de archivos Excel/CSV grandes
        client_max_body_size 50M;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/petho /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Paso 7: Habilitar HTTPS con Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
# Certbot modifica automáticamente el bloque de nginx para redirigir HTTP → HTTPS
sudo systemctl reload nginx
```

---

### Paso 8: Verificar que todo funciona

```bash
# Estado del backend
pm2 status
pm2 logs petho-api --lines 50

# Estado de Nginx
sudo systemctl status nginx

# Probar la API directamente
curl http://localhost:3001/api

# Probar a través de Nginx
curl https://tu-dominio.com/api
```

---

## Checklist Final Pre-Deploy

- [ ] `JWT_SECRET` agregado al `.env` del backend
- [ ] `synchronize` cambiado a `false` en `database.config.ts`
- [ ] Migración inicial de TypeORM generada y probada
- [ ] CORS restringido al dominio de producción
- [ ] Seed del admin usa variables de entorno, no hardcodeado
- [ ] `petho-dashboard/.env.production` creado con `VITE_API_URL` correcto
- [ ] `npm run build` ejecutado en el frontend con las variables de producción
- [ ] `ecosystem.config.js` creado para PM2
- [ ] Nginx configurado con SPA fallback y proxy `/api/`
- [ ] SSL/HTTPS habilitado con Certbot
- [ ] Contraseña del admin por defecto cambiada inmediatamente después del primer arranque

---

## Veredicto Final

> **NO LISTO — Requiere correcciones antes del deploy**

Ninguno de los errores críticos requiere reescribir el proyecto. Son todos correcciones de configuración. Con el checklist anterior completado, el proyecto puede desplegarse en Hostinger VPS sin problemas estructurales.

**Tiempo estimado de corrección:** 2-4 horas.
