import { PrismaService } from '../prisma.service';
export declare class ClienteService {
    private prisma;
    constructor(prisma: PrismaService);
    updateTelefone(clienteId: string, telefone: string): Promise<{
        precisaOnboarding: boolean;
        email: string;
        id: string;
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
        email: string;
        id: string;
        nome: string;
        fotoPerfil: string | null;
        telefone: string | null;
    }>;
}
