import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { ErpClientService } from '../erp-client/erp-client.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class PaymentService {
    private prisma;
    private erpClient;
    private configService;
    private notifications;
    private readonly logger;
    constructor(prisma: PrismaService, erpClient: ErpClientService, configService: ConfigService, notifications: NotificationsService);
    generatePix(sessionId: string, clienteId: string): Promise<{
        sessionId: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        pix: {
            qrCode: string | null;
            qrCodeBase64: string | null;
            valor: string;
            expiracao: string;
            ttlSegundos: number;
        };
    }>;
    processWebhook(cobrancaId: string, status: string, signature: string, rawBody: string): Promise<{
        processed: boolean;
        reason: string;
        refund?: undefined;
        sessionId?: undefined;
    } | {
        processed: boolean;
        reason: string;
        refund: boolean;
        sessionId?: undefined;
    } | {
        processed: boolean;
        reason: string;
        sessionId: string;
        refund?: undefined;
    }>;
    expireSessions(): Promise<void>;
}
