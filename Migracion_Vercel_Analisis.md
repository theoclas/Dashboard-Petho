# Análisis de Migración a Vercel - Proyecto Dashboard Petho

Este documento es el resultado de un análisis en profundidad de la arquitectura actual del proyecto (compuesto por un backend en **NestJS** y un frontend en **React + Vite**) para evaluar la viabilidad y los requisitos necesarios para desplegar la aplicación en **Vercel**.

---

## 1. Análisis del Frontend (`petho-dashboard`)

El frontend está desarrollado en **React** y empaquetado con **Vite**.

### **Estado: Altamente Compatible ✅**
Vercel nació originalmente como una plataforma optimizada para frontends estáticos y aplicaciones como React/Next.js/Vite. El despliegue de este módulo será directo y sin complicaciones mayores.

### **Requisitos para la migración:**
1. **Configuración de Enrutamiento (SPA):** Al ser una Single Page Application (SPA), es necesario crear un archivo `vercel.json` en la raíz del frontend (o configurarlo en el dashboard de Vercel) con una regla de "Rewrite" para que todas las rutas caigan a `index.html` y no generen error 404 al recargar la página:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
2. **Variables de Entorno:** Todas las variables de `.env.production` (como la URL base de la API y el entorno) deben ser agregadas manualmente en el panel de configuración del proyecto en Vercel.
3. **Build Command:** Asegurarse de que el comando de compilación (`npm run build`) en Vercel ejecute el script asociado (`tsc -b && vite build`) de manera satisfactoria.

---

## 2. Análisis del Backend (`petho-api`)

El backend está desarrollado en **NestJS** utilizando **TypeORM**, conectándose a una base de datos **PostgreSQL**, e implementando cargas de archivos pesados (Excel con `multer` y `xlsx`).

### **Estado: Requiere Modificaciones Importantes y Presenta Riesgos Críticos ⚠️**
Vercel no está diseñado para alojar aplicaciones Node.js persistentes y de larga duración (long-running), sino para **"Serverless Functions"** (Funciones sin servidor). Subir una API de NestJS a Vercel requiere adaptarla a este modelo, y trae las siguientes limitaciones:

#### **Riesgo 1: Tiempos de Ejecución (Timeouts) - ❌ CRÍTICO**
- **El problema:** En Vercel, el plan gratuito (Hobby) tiene un tiempo máximo de ejecución por función de **10 segundos** (en el plan Pro son 5 o 15 minutos máximo, dependiendo de configuraciones experimentales, típicamente 300 segundos). 
- **Impacto en Petho:** El servicio de importación (`import.service.ts`) procesa archivos Excel pesados (Pedidos, Productos, Cartera) fila por fila guardando a la base de datos de manera síncrona/iterativa. Si un archivo de Dropi tiene varios miles de filas, la importación tomará más de 10 segundos y Vercel **matará el proceso** arrojando un error `504 Gateway Timeout` sin terminar de guardar los datos.

#### **Riesgo 2: Límites de Carga de Archivos (Payload) - ❌ CRÍTICO**
- **El problema:** Vercel impone un límite estricto de **4.5 MB** para el payload (cuerpo) de las solicitudes en sus funciones Serverless.
- **Impacto en Petho:** Al utilizar `FileInterceptor` para subir archivos Excel, si el exporte de pedidos o productos de Dropi supera los 4.5 MB, Vercel **bloqueará la subida entera** con un error HTTP 413 (Payload Too Large), sin que la petición llegue siquiera a NestJS.

#### **Riesgo 3: Manejo de Conexiones de Base de Datos - ⚠️ ALTO**
- **El problema:** Al ser Serverless (funciones sin estado), por cada petición (o cada pocass peticiones), Vercel levanta una nueva instancia de la API. Cada instancia nueva inicializará **TypeORM** y abrirá su propio pool de conexiones a PostgreSQL.
- **Impacto en Petho:** Con algo de tráfico o peticiones concurrentes, PostgreSQL se quedará rápidamente sin conexiones disponibles (Connection Exhaustion). Para prevenir esto Serverless exige utilizar un servicio de Connection Pooling en la base de datos, como **PgBouncer** o el pooler de Supabase.

#### **Requisitos de migración (si se decide continuar usando el backend en Vercel):**
1. **Instalar el adaptador Serverless:** Modificar `main.ts` para crear un export de Express utilizando paquetes como `@vendia/serverless-express` en lugar del método habitual `app.listen()`.
2. **Archivo de Configuración:** Crear un `vercel.json` en el backend para redirigir todo el tráfico manejando rutas de API `api/index.ts`.
3. **Desacoplar la importación:** Reescribir `import.service.ts` para que no procese el archivo directamente, sino que suba el Excel a un Bucket S3, encole una tarea en segundo plano (con un Worker) y libere la respuesta HTTP de inmediato, y dicho worker deberá estar alojado en algún otro lado.

---

## 3. Conclusión y Sugerencias Recomendadas

Intentar forzar el backend en Vercel te llevará a lidiar constantemente con errores de Timeouts e impedirá la correcta carga de excels pesados limitando el modelo del negocio.

### **Sugerencia Arquitectónica Recomendada:**

1. **Frontend en Vercel (Recomendado):**
   - Vercel es el líder para frontends. Mantén tu aplicación Vite/React ahí conectada y desplegada, aprovechando el CDN rápido que tienen para la interfaz.

2. **Backend en un Entorno Persistente (No-Serverless):**
   Ya que en el historial mencionaste contar con un plan de **Hostinger**, o como alternativas PaaS modernas (**Railway**, **Render** o **Fly.io**):
   - **Hostinger VPS:** Si ya tienes un servidor privado virtual ahí, aloja en él el contenedor de NestJS con Docker o PM2. Esto te permitirá procesar Excels que duren más de 10 segundos, no habrá límite de subida de 4.5mb (puedes ajustar Node.js a 50mb), y el pooling de la base de datos se comportará normalmente con la conexión TypeORM estándar que ya tienes configurada.
   - **Railway / Render:** Plataformas optimizadas donde subes el backend de GitHub y se ejecuta constantemente, sin las dolorosas métricas y limitantes restrictivas de funciones serverless de Vercel. 

### Siguientes pasos propuestos:
1. Desplegar de inmediato el proyecto de React (`petho-dashboard`) en Vercel (Simplemente conectar la cuenta de GitHub y apuntar al directorio `petho-dashboard/`).
2. Configurar un entorno en un servidor dedicado o PaaS (Railway/Render) para el proyecto de la API de NestJS (`petho-api/`).
3. Actualizar la variable `.env.production` (por ejemplo `VITE_API_BASE_URL`) del Frontend en Vercel para que apunte al dominio remoto donde quedó alojado en el paso anterior y ¡listo! Todo funcionará correctamente.
