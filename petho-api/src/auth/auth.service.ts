import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async verifyFirebaseToken(idToken: string) {
    const decoded = await this.firebaseService.verifyIdToken(idToken);
    const user = await this.usersService.findOrCreateFromFirebase(
      decoded.uid,
      decoded.email || '',
    );
    return { user };
  }

  async registerWithFirebase(idToken: string, username: string) {
    const decoded = await this.firebaseService.verifyIdToken(idToken);
    return this.usersService.createFromFirebase(
      decoded.uid,
      decoded.email || '',
      username,
    );
  }
}
