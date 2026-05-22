import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { GoogleProfile } from './strategies/google.strategy';
export interface ClienteWithOnboarding {
    id: string;
    nome: string;
    email: string;
    fotoPerfil: string | null;
    telefone: string | null;
    precisaOnboarding: boolean;
}
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    findOrCreateCliente(profile: GoogleProfile): Promise<ClienteWithOnboarding>;
    generateToken(cliente: ClienteWithOnboarding): string;
    getCookieOptions(): {
        domain?: string | undefined;
        httpOnly: boolean;
        secure: boolean;
        sameSite: "lax";
        path: string;
        maxAge: number;
    };
}
