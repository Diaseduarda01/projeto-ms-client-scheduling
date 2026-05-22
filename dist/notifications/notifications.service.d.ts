import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface BookingConfirmadoEvent {
    sessionId: string;
    clienteNome: string;
    clienteTelefone: string;
    clienteEmail: string;
    servicoNome: string;
    dataHora: string;
    cancelToken: string;
    empresaId: string;
    empresaSlug: string;
}
export interface BookingExpiradoEvent {
    sessionId: string;
    clienteNome: string;
    clienteTelefone: string;
    empresaId: string;
}
export interface BookingCanceladoEvent {
    sessionId: string;
    clienteNome: string;
    servicoNome: string;
    dataHora: string;
    empresaId: string;
}
export declare class NotificationsService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly logger;
    private connection;
    private channel;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private connect;
    private disconnect;
    publishBookingConfirmado(event: BookingConfirmadoEvent): Promise<void>;
    publishBookingExpirado(event: BookingExpiradoEvent): Promise<void>;
    publishBookingCancelado(event: BookingCanceladoEvent): Promise<void>;
    private publish;
}
