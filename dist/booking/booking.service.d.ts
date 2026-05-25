import { PrismaService } from '../prisma.service';
import { ErpClientService } from '../erp-client/erp-client.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBookingDto } from './dto/create-booking.dto';
interface ClienteInfo {
    id: string;
    nome: string;
    email: string;
    telefone: string | null;
}
export declare class BookingService {
    private prisma;
    private erpClient;
    private notifications;
    constructor(prisma: PrismaService, erpClient: ErpClientService, notifications: NotificationsService);
    createSession(slug: string, cliente: ClienteInfo, dto: CreateBookingDto): Promise<{
        sessionId: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        resumo: {
            servico: string;
            profissional: string;
            dataHora: string;
            valorTotal: string;
            valorGarantia: string | null;
            cliente: {
                nome: string;
                telefone: string | null;
            };
        };
    }>;
    getSession(sessionId: string, clienteId: string): Promise<{
        sessionId: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        resumo: {
            servico: string;
            profissional: string;
            dataHora: string;
            valorTotal: string;
            valorGarantia: string | null;
        };
        pix: {
            qrCode: string;
            qrCodeBase64: string | null;
            expiracao: string | undefined;
        } | null;
        cancelToken: string | null;
    }>;
    confirmSession(sessionId: string, clienteId: string, slug: string): Promise<{
        sessionId: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        cancelToken: string;
        resumo: {
            servico: string;
            profissional: string;
            dataHora: string;
            valorTotal: string;
        };
    }>;
    private toSP;
    private calcularGarantia;
}
export {};
