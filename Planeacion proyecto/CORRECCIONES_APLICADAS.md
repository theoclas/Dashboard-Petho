# Correcciones Aplicadas — Preparación Local para Producción
> Fecha: 14 de marzo de 2026

---

## 1. Cambios aplicados automáticamente

### Seguridad backend

| Cambio | Archivos |
|--------|----------|
| **CPA Controller** — Añadidos `JwtAuthGuard` y `RolesGuard` | `petho-api/src/cpa/cpa.controller.ts` |
| **Notas Controller** — Añadidos `JwtAuthGuard` y `RolesGuard` | `petho-api/src/notas/notas.controller.ts` |

- Endpoints de lectura (GET): solo usuarios autenticados.
- Endpoints de escritura (POST, PATCH, DELETE): solo roles `ADMIN` y `OPERADOR`.

### Configuración JWT

| Cambio | Archivos |
|--------|----------|
| Eliminado fallback inseguro `\|\| 'petho_super_secret_key_2026'` | `petho-api/src/auth/auth.module.ts` |
| Validación de `JWT_SECRET` al arranque | `petho-api/src/main.ts` |

Si `JWT_SECRET` no está en `.env`, la app no arranca y muestra instrucciones para generarlo.

### Variables de entorno

| Cambio | Archivos |
|--------|----------|
| `.env.example` con variables documentadas | `petho-api/.env.example` (nuevo) |
| Eliminado `.env.Example` antiguo | `petho-api/.env.Example` (eliminado) |
| `.env.production` con `VITE_API_URL` y documentación | `petho-dashboard/.env.production` |
| `.env.example` para el frontend | `petho-dashboard/.env.example` (nuevo) |

### Dependencias

| Cambio | Archivos |
|--------|----------|
| Añadido `dotenv` explícito | `petho-api/package.json` |

### TypeORM

| Cambio | Archivos |
|--------|----------|
| Eliminado comentario obsoleto | `petho-api/src/config/database.config.ts` |

Configuración ya correcta: `synchronize: process.env.NODE_ENV !== 'production'`, `migrations: ['dist/migrations/*.js']`, `migrationsRun: true`.

---

## 2. Problemas encontrados (ya corregidos)

| # | Problema | Estado |
|---|----------|--------|
| 1 | CPA Controller sin autenticación — CRUD público | ✅ Corregido |
| 2 | Notas Controller sin autenticación — CRUD público | ✅ Corregido |
| 3 | Fallback JWT hardcodeado en `auth.module.ts` | ✅ Corregido |
| 4 | Sin validación de `JWT_SECRET` al arranque | ✅ Corregido |
| 5 | `.env.example` incompleto (faltaba `ADMIN_USERNAME`) | ✅ Corregido |
| 6 | `dotenv` no en dependencias explícitas | ✅ Corregido |
| 7 | `.env.production` con `localhost` en producción | ✅ Corregido |

---

## 3. Mejoras recomendadas (no aplicadas)

| Mejora | Motivo |
|--------|--------|
| Rate limiting en auth (`@nestjs/throttler`) | Depende de decisión de diseño |
| Restringir o eliminar `POST /auth/register` público | Decisión de negocio |
| JWT en `HttpOnly` cookies en vez de `localStorage` | Requiere cambios mayores en backend y frontend |
| Code-splitting en frontend (chunks > 500 KB) | Mejora de rendimiento, no bloqueante |

---

## 4. Checklist final antes de deploy

### Backend
- [x] Todos los controllers con datos sensibles tienen `JwtAuthGuard`
- [x] `JWT_SECRET` solo desde `.env`, sin fallback
- [x] `synchronize` desactivado en producción
- [x] Migraciones configuradas y en `dist/migrations/`
- [x] `dotenv` en dependencias
- [x] `npm run build` exitoso
- [ ] Crear `.env` en el VPS con valores reales (al desplegar)
- [ ] Ajustar `CORS_ORIGIN` al dominio de producción (al desplegar)

### Frontend
- [x] `VITE_API_URL` documentada en `.env.production`
- [x] `npm run build` exitoso
- [ ] Actualizar `VITE_API_URL` al dominio real en `.env.production` antes del build de producción
- [ ] Ejecutar `npm run build` con la URL correcta al hacer deploy

### Despliegue (cuando tengas el VPS)
- [ ] Instalar dependencias: `npm install --omit=dev` (backend)
- [ ] Crear `.env` en el servidor
- [ ] Revisar `cwd` en `ecosystem.config.js` si la ruta no es `/var/www/petho-api`
- [ ] Configurar Nginx, SSL, etc.

---

## Nota sobre `.env.production`

El archivo actual usa `VITE_API_URL=https://your-production-domain.com/api` como placeholder. **Antes de generar el build para producción**, edítalo y pon tu dominio real, por ejemplo:

```
VITE_API_URL=https://www.fersuastudio.com/api
```

Luego ejecuta `npm run build` en el frontend. La URL se incluye en el bundle y no puede cambiarse después sin volver a compilar.
