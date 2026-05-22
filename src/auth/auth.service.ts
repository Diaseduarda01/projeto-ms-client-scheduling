import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { GoogleProfile } from './strategies/google.strategy';
import { JwtPayload } from './strategies/jwt.strategy';

export interface ClienteWithOnboarding {
  id: string;
  nome: string;
  email: string;
  fotoPerfil: string | null;
  telefone: string | null;
  precisaOnboarding: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async findOrCreateCliente(profile: GoogleProfile): Promise<ClienteWithOnboarding> {
    let cliente = await this.prisma.cliente.findUnique({
      where: { googleId: profile.googleId },
    });

    if (!cliente) {
      cliente = await this.prisma.cliente.create({
        data: {
          googleId: profile.googleId,
          email: profile.email,
          nome: profile.nome,
          fotoPerfil: profile.fotoPerfil,
        },
      });
    }

    return {
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      fotoPerfil: cliente.fotoPerfil,
      telefone: cliente.telefone,
      precisaOnboarding: !cliente.telefone,
    };
  }

  generateToken(cliente: ClienteWithOnboarding): string {
    const payload: JwtPayload = {
      sub: cliente.id,
      email: cliente.email,
    };

    return this.jwtService.sign(payload);
  }

  getCookieOptions() {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const domain = this.configService.get<string>('COOKIE_DOMAIN');

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      ...(domain && { domain }),
    };
  }
}
