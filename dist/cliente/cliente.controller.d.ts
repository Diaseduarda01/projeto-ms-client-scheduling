import type { Request } from 'express';
import { ClienteService } from './cliente.service';
import { UpdateTelefoneDto } from './dto/update-telefone.dto';
export declare class ClienteController {
    private clienteService;
    constructor(clienteService: ClienteService);
    getProfile(req: Request): Promise<{
        precisaOnboarding: boolean;
        email: string;
        id: string;
        nome: string;
        fotoPerfil: string | null;
        telefone: string | null;
    }>;
    updateTelefone(req: Request, dto: UpdateTelefoneDto): Promise<{
        precisaOnboarding: boolean;
        email: string;
        id: string;
        nome: string;
        fotoPerfil: string | null;
        telefone: string | null;
    }>;
    getAgendamentos(req: Request): Promise<{
        id: string;
        servicoNome: string;
        empresaSlug: string;
        dataHora: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        cancelToken: string | null;
    }[]>;
}
