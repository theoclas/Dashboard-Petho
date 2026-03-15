import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

function isFirebaseConfigured(): boolean {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) return true;
  return !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}

async function bootstrap() {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase requerido. Usa FIREBASE_SERVICE_ACCOUNT_PATH (ruta al .json) o FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY en .env',
    );
  }
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para el frontend futuro
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });
  
  // Prefijo global de API
  app.setGlobalPrefix('api');

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Petho API corriendo en http://localhost:${port}/api`);
}
bootstrap();
