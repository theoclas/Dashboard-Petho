import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('firebase')
  async verifyFirebase(@Body() body: { idToken: string }) {
    return this.authService.verifyFirebaseToken(body.idToken);
  }

  @Post('firebase/register')
  async registerFirebase(@Body() body: { idToken: string; username: string }) {
    return this.authService.registerWithFirebase(body.idToken, body.username);
  }
}
