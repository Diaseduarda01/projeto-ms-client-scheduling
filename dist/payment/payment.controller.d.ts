import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentService } from './payment.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
export declare class PaymentController {
    private paymentService;
    constructor(paymentService: PaymentService);
    generatePix(sessionId: string, req: Request): Promise<{
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
    handleWebhook(payload: WebhookPayloadDto, signature: string, req: RawBodyRequest<Request>): Promise<{
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
}
