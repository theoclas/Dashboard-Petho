# Checklist de Producción — Dashboard Petho

> Objetivo: dejar el proyecto **listo para desplegar en un VPS de Hostinger**
> Estado actual: `synchronize` **ya corregido** ✅

---

## Cómo usar este archivo
- Marca cada tarea con `- [✅]` cuando la termines.
- Si una tarea queda pendiente, déjala como `- [ ]`.
- Recomendación: trabaja **en este orden**.

---

# Fase 1 — Seguridad y configuración crítica

## 1. JWT y variables sensibles
- [✅] Agregar `JWT_SECRET` al archivo `petho-api/.env`
- [✅] Generar un `JWT_SECRET` largo y seguro
- [✅] Revisar `petho-api/src/auth/auth.module.ts`
- [✅] Revisar `petho-api/src/auth/strategies/jwt.strategy.ts`
- [✅] Eliminar cualquier fallback inseguro como:
  - [✅] `process.env.JWT_SECRET || '...hardcodeado...'`
- [✅] Confirmar que el backend falla de forma segura si `JWT_SECRET` no existe

## 2. Variables de entorno del backend
- [✅] Revisar que `PORT` esté definido
- [✅] Revisar que `NODE_ENV=production` esté contemplado
- [✅] Revisar `DB_HOST`
- [✅] Revisar `DB_PORT`
- [✅] Revisar `DB_USERNAME`
- [✅] Revisar `DB_PASSWORD`
- [✅] Revisar `DB_DATABASE`
- [✅] Revisar que no queden credenciales hardcodeadas en el código
- [✅] Crear un `.env` limpio para producción

## 3. CORS
- [✅] Revisar `petho-api/src/main.ts`
- [✅] Cambiar `app.enableCors()` abierto por una configuración restringida
- [✅] Agregar `CORS_ORIGIN` al `.env`
- [✅] Confirmar que solo el frontend autorizado pueda consumir la API

## 4. Admin por defecto
- [✅] Revisar `petho-api/src/users/users.service.ts`
- [✅] Eliminar credenciales hardcodeadas tipo `admin@... / admin123`
- [✅] Mover `ADMIN_EMAIL` al `.env`
- [✅] Mover `ADMIN_PASSWORD` al `.env`
- [✅] Confirmar que no se cree un admin inseguro automáticamente

---

# Fase 2 — Frontend listo para producción

## 5. Variables de entorno del frontend
- [✅] Crear `petho-dashboard/.env.production`
- [✅] Agregar `VITE_API_URL`
- [✅] Confirmar que `VITE_API_URL` apunta al dominio real de producción
- [✅] Confirmar que no existe fallback a `localhost` en producción

## 6. Build del frontend
- [✅] Revisar `petho-dashboard/package.json`
- [✅] Confirmar que `npm run build` funciona
- [✅] Revisar `vite.config.ts`
- [✅] Confirmar salida correcta a `dist/`
- [ ] Confirmar que React Router funcionará con fallback de SPA

---

# Fase 3 — Backend listo para producción

## 7. Build y arranque del backend
- [✅] Revisar `petho-api/package.json`
- [✅] Confirmar que existe `build`
- [✅] Confirmar que existe `start:prod`
- [✅] Ejecutar build local del backend
- [✅] Confirmar que el backend arranca desde `dist/main.js`

## 8. Base de datos y migraciones
- [✅] Corregir `synchronize`
- [✅] Confirmar que `synchronize` queda desactivado en producción
- [ ] Revisar si ya existen migraciones
- [ ] Crear migración inicial si aún no existe
- [ ] Confirmar que la base de datos puede levantarse sin depender de entorno local
- [ ] Probar conexión real a PostgreSQL con variables de entorno

---

# Fase 4 — Despliegue en VPS

## 9. PM2
- [ ] Crear `ecosystem.config.js`
- [ ] Configurar nombre de la app
- [ ] Configurar `script: dist/main.js`
- [ ] Configurar `env_file`
- [ ] Probar arranque con PM2
- [ ] Probar reinicio automático

## 10. Nginx
- [ ] Definir dominio principal
- [ ] Crear config de Nginx
- [ ] Servir frontend estático desde `/var/www/...`
- [ ] Configurar proxy inverso para `/api/`
- [ ] Agregar soporte SPA fallback para React Router
- [ ] Validar configuración con `nginx -t`

## 11. HTTPS
- [ ] Instalar Certbot
- [ ] Emitir certificado SSL
- [ ] Forzar redirección HTTP → HTTPS
- [ ] Confirmar que frontend y API responden por HTTPS

---

# Fase 5 — Endurecimiento y validación final

## 12. Seguridad adicional
- [ ] Revisar si `POST /auth/register` debe seguir siendo público
- [ ] Revisar rate limiting en login/auth
- [ ] Revisar dónde se guarda el JWT en el frontend
- [ ] Revisar exposición de archivos sensibles
- [ ] Revisar logs de errores para producción

## 13. Validación final
- [ ] Probar login real en entorno de producción
- [ ] Probar consumo del frontend hacia la API real
- [ ] Probar refresco de rutas del frontend
- [ ] Probar reinicio del backend
- [ ] Probar reinicio del VPS
- [ ] Confirmar que todo vuelve a levantar automáticamente

---

# Orden recomendado de ejecución

- [✅] Corregir `synchronize`
- [✅] JWT secret
- [✅] CORS
- [✅] Admin por defecto
- [✅] `.env.production` del frontend
- [✅] `VITE_API_URL`
- [✅] Build frontend
- [ ] Build backend
- [ ] Migraciones
- [ ] PM2
- [ ] Nginx
- [ ] SSL
- [ ] Pruebas finales

---

# Notas

## Archivos que vamos a tocar sí o sí
- [ ] `petho-api/.env`
- [ ] `petho-api/src/auth/auth.module.ts`
- [ ] `petho-api/src/auth/strategies/jwt.strategy.ts`
- [ ] `petho-api/src/main.ts`
- [ ] `petho-api/src/users/users.service.ts`
- [✅] `petho-dashboard/.env.production`
- [✅] `petho-dashboard/vite.config.ts`
- [ ] `petho-api/package.json`
- [✅] `petho-dashboard/package.json`
- [ ] `ecosystem.config.js`
- [ ] config de Nginx

---

# Siguiente paso

## Empezamos por aquí:
- [✅] Revisar `petho-api/src/auth/auth.module.ts`
- [✅] Revisar `petho-api/src/auth/strategies/jwt.strategy.ts`
- [ ] Agregar `JWT_SECRET` al `.env`
