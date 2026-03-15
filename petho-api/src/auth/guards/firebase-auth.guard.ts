import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { FirebaseService } from '../../firebase/firebase.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = await this.firebaseService.verifyIdToken(token);
      const user = await this.usersService.findOrCreateFromFirebase(
        decoded.uid,
        decoded.email || '',
      );
      request.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
      return true;
    } catch (err: any) {
      if (err.message?.includes('inactiva') || err.message?.includes('no registrado')) {
        throw new UnauthorizedException(err.message);
      }
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
