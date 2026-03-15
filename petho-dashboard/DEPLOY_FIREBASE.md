# Desplegar Frontend en Firebase Hosting

## Antes del build

1. **Completar `.env.production`** con valores reales:
   - `VITE_API_URL`: URL pública de tu API (ej: `https://tu-api.run.app/api`)
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`: desde [Firebase Console](https://console.firebase.google.com) → Project Settings → General → Your apps

2. Las demás variables Firebase (`authDomain`, `projectId`, `storageBucket`) ya tienen el valor de dashboard-petho.

## Build y deploy

```bash
# Desde la raíz del proyecto
cd petho-dashboard
npm run build

cd ..
firebase deploy
```

O con npm run desde raíz (si añades script):

```bash
npm run build:dashboard
firebase deploy
```

## Primera vez

Si no tienes Firebase CLI instalado:
```bash
npm install -g firebase-tools
firebase login
firebase use dashboard-petho
```
