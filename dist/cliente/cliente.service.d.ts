import { PrismaService } from '../prisma.service';
export declare class ClienteService {
    private prisma;
    constructor(prisma: PrismaService);
    updateTelefone(clienteId: string, telefone: string): Promise<{
        precisaOnboarding: boolean;
        id: string;
        email: string;
        nome: string;
        fotoPerfil: string | null;
        telefone: string | null;
    }>;
    getAgendamentos(clienteId: string): Promise<{
        id: string;
        servicoNome: string;
        empresaSlug: string;
        dataHora: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        cancelToken: string | null;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        email: string;
        nome: string;
        fotoPerfil: string | null;
        telefone: string | null;
    }>;
}
