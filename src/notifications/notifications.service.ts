import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';

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

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    const url = this.configService.get<string>('RABBITMQ_URL');
    if (!url) {
      this.logger.warn('RABBITMQ_URL não configurada, notificações desabilitadas');
      return;
    }

    try {
      this.connection = await amqplib.connect(url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange('booking', 'topic', { durable: true });

      await this.channel.assertQueue('notificacao.booking_confirmado', { durable: true });
      await this.channel.assertQueue('notificacao.booking_expirado', { durable: true });
      await this.channel.assertQueue('notificacao.booking_cancelado', { durable: true });

      await this.channel.bindQueue('notificacao.booking_confirmado', 'booking', 'booking.confirmado');
      await this.channel.bindQueue('notificacao.booking_expirado', 'booking', 'booking.expirado');
      await this.channel.bindQueue('notificacao.booking_cancelado', 'booking', 'booking.cancelado');

      this.logger.log('Conectado ao RabbitMQ');
    } catch (error) {
      this.logger.error('Erro ao conectar ao RabbitMQ', error);
    }
  }

  private async disconnect() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch (error) {
      this.logger.error('Erro ao desconectar do RabbitMQ', error);
    }
  }

  async publishBookingConfirmado(event: BookingConfirmadoEvent) {
    await this.publish('booking.confirmado', event);
  }

  async publishBookingExpirado(event: BookingExpiradoEvent) {
    await this.publish('booking.expirado', event);
  }

  async publishBookingCancelado(event: BookingCanceladoEvent) {
    await this.publish('booking.cancelado', event);
  }

  private async publish(routingKey: string, event: object) {
    if (!this.channel) {
      this.logger.warn(`Canal não disponível, evento ${routingKey} não publicado`);
      return;
    }

    try {
      this.channel.publish(
        'booking',
        routingKey,
        Buffer.from(JSON.stringify(event)),
        { persistent: true },
      );
      this.logger.debug(`Evento ${routingKey} publicado`);
    } catch (error) {
      this.logger.error(`Erro ao publicar evento ${routingKey}`, error);
    }
  }
}
