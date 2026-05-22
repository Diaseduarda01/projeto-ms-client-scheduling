import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleProfile } from './strategies/google.strategy';
import { AuthenticatedUser } from './strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Passport redireciona para o Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const googleProfile = req.user as GoogleProfile;

    if (!googleProfile) {
      throw new UnauthorizedException('Falha na autenticação com Google');
    }

    const cliente = await this.authService.findOrCreateCliente(googleProfile);
    const token = this.authService.generateToken(cliente);
    const cookieOptions = this.authService.getCookieOptions();

    res.cookie('access_token', token, cookieOptions);

    const path = cliente.precisaOnboarding ? '/onboarding' : '/';
    res.redirect(path);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;

    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      fotoPerfil: user.fotoPerfil,
      telefone: user.telefone,
      precisaOnboarding: !user.telefone,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Res() res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      path: '/',
    });

    res.json({ message: 'Logout realizado com sucesso' });
  }
}
