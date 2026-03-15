import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseService {
  private app: admin.app.App | null = null;

  constructor() {
    const jsonPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (jsonPath) {
      const resolved = path.isAbsolute(jsonPath) ? jsonPath : path.resolve(process.cwd(), jsonPath);
      if (fs.existsSync(resolved)) {
        const serviceAccount = JSON.parse(fs.readFileSync(resolved, 'utf8'));
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        console.warn(`Firebase: archivo no encontrado: ${resolved}`);
      }
    } else {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (privateKey && !privateKey.includes('-----BEGIN')) {
        privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey.trim()}\n-----END PRIVATE KEY-----`;
      }

      if (projectId && clientEmail && privateKey) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }
    }

    if (!this.app) {
      console.warn(
        'Firebase no configurado. Usa FIREBASE_SERVICE_ACCOUNT_PATH (ruta al .json) o FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.',
      );
    }
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.app) {
      throw new Error('Firebase no está configurado');
    }
    return admin.auth().verifyIdToken(idToken);
  }

  getAuth(): admin.auth.Auth {
    if (!this.app) {
      throw new Error('Firebase no está configurado');
    }
    return admin.auth();
  }
}
