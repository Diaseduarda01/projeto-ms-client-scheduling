import type { Request } from 'express';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
export declare class BookingController {
    private bookingService;
    constructor(bookingService: BookingService);
    createSession(slug: string, dto: CreateBookingDto, req: Request): Promise<{
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
    getSession(sessionId: string, req: Request): Promise<{
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
    confirmSession(slug: string, sessionId: string, req: Request): Promise<{
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
}
