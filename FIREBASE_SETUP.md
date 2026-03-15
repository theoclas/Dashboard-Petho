# Configuración de Firebase para Petho Dashboard

## 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un proyecto o usa uno existente
3. Habilita **Authentication** > **Sign-in method** > **Email/Password** (activar)

## 2. Frontend (petho-dashboard)

En Firebase Console > Project Settings > General, copia la configuración y crea `petho-dashboard/.env.local`:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxx
```

## 3. Backend (petho-api)

1. En Firebase Console > Project Settings > **Service accounts**
2. Haz clic en **Generate new private key**
3. Se descargará un JSON. Añade a `petho-api/.env`:

```env
FIREBASE_PROJECT_ID=el project_id del JSON
FIREBASE_CLIENT_EMAIL=el client_email del JSON
FIREBASE_PRIVATE_KEY="el private_key del JSON (con \n para saltos de línea)"
```

**Importante:** `FIREBASE_PRIVATE_KEY` debe estar entre comillas y los `\n` deben conservarse.

## 4. Migración de usuarios existentes

Los usuarios que tenían cuenta con usuario/contraseña deben:

1. **Registrarse de nuevo** en `/register` con el mismo correo (Firebase creará la cuenta)
2. Un administrador activa el usuario
3. Al iniciar sesión, el backend vincula automáticamente el `firebase_uid` si encuentra el usuario por email

O bien, un admin puede crear usuarios manualmente y ellos se registran en Firebase con ese correo.

## 5. Admin inicial

El seed crea un admin con email/password en PostgreSQL (sin Firebase). Para que el admin pueda entrar:

1. El admin debe **registrarse en la app** con el mismo email que `ADMIN_EMAIL`
2. El primer login con Firebase vinculará automáticamente el `firebase_uid` al usuario existente
3. O: crear el usuario en Firebase Console manualmente con el email del admin

## 6. Ejecutar migración

```bash
cd petho-api
npm run build
# Las migraciones se ejecutan al arrancar si migrationsRun: true
npm run start:prod
```
