import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    googleAuth(): void;
    googleCallback(req: Request, res: Response): Promise<void>;
    getProfile(req: Request): {
        id: string;
        nome: string;
        email: string;
        fotoPerfil: string | null;
        telefone: string | null;
        precisaOnboarding: boolean;
    };
    logout(res: Response): void;
}
