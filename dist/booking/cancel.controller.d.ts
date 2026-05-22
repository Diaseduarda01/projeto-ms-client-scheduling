import { PrismaService } from '../prisma.service';
import { ErpClientService } from '../erp-client/erp-client.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
export declare class CancelController {
    private prisma;
    private erpClient;
    private notifications;
    private configService;
    constructor(prisma: PrismaService, erpClient: ErpClientService, notifications: NotificationsService, configService: ConfigService);
    cancelByToken(cancelToken: string): Promise<{
        message: string;
        sessionId: string;
    }>;
}
