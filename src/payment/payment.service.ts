import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { ErpClientService } from '../erp-client/erp-client.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingStatus } from '@prisma/client';
import axios from 'axios';
import * as crypto from 'crypto';

interface PixResponse {
  cobrancaId: string;
  pixQrCode: string;
  pixQrCodeBase64: string;
  expiracao: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private erpClient: ErpClientService,
    private configService: ConfigService,
    private notifications: NotificationsService,
  ) {}

  async generatePix(sessionId: string, clienteId: string) {
    const session = await this.prisma.bookingSession.findFirst({
      where: { id: sessionId, clienteId },
      include: { cliente: true },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (session.status !== BookingStatus.RASCUNHO) {
      throw new ConflictException('Sessão não está em rascunho');
    }

    if (!session.valorGarantia) {
      throw new BadRequestException('Esta sessão não requer pagamento');
    }

    const disponivel = await this.erpClient.verificarDisponibilidade(
      session.empresaId,
      session.servicoId,
      session.funcionarioId,
      session.dataHoraInicio.toISOString(),
      session.dataHoraFim.toISOString(),
    );

    if (!disponivel) {
      throw new ConflictException('Horário não está mais disponível');
    }

    const ttlSegundos = this.configService.get<number>('PIX_TTL_SEGUNDOS', 900);
    const financeiroUrl = this.configService.get<string>('FINANCEIRO_API_URL');
    const financeiroKey = this.configService.get<string>('FINANCEIRO_INTERNAL_API_KEY');

    const pixResponse = await axios.post<PixResponse>(
      `${financeiroUrl}/cobrancas`,
      {
        empresaId: session.empresaId,
        valor: session.valorGarantia.toNumber(),
        descricao: `Garantia - ${session.servicoNome}`,
        pagador: {
          nome: session.cliente.nome,
          email: session.cliente.email,
          telefone: session.cliente.telefone,
        },
        ttlSegundos,
        metadados: {
          sessionId: session.id,
          servicoNome: session.servicoNome,
        },
      },
      {
        headers: { 'X-Internal-Api-Key': financeiroKey },
      },
    );

    const expiracao = new Date(Date.now() + ttlSegundos * 1000);

    const updated = await this.prisma.bookingSession.update({
      where: { id: sessionId },
      data: {
        status: BookingStatus.AGUARDANDO_PAGAMENTO,
        pixCobrancaId: pixResponse.data.cobrancaId,
        pixQrCode: pixResponse.data.pixQrCode,
        pixQrCodeBase64: pixResponse.data.pixQrCodeBase64,
        pixExpiracao: expiracao,
        expiraEm: expiracao,
      },
    });

    return {
      sessionId: updated.id,
      status: updated.status,
      pix: {
        qrCode: updated.pixQrCode,
        qrCodeBase64: updated.pixQrCodeBase64,
        valor: session.valorGarantia.toString(),
        expiracao: expiracao.toISOString(),
        ttlSegundos,
      },
    };
  }

  async processWebhook(cobrancaId: string, status: string, signature: string, rawBody: string) {
    const webhookSecret = this.configService.get<string>('ABACATEPAY_WEBHOOK_SECRET');

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret || '')
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new BadRequestException('Assinatura inválida');
    }

    const session = await this.prisma.bookingSession.findFirst({
      where: { pixCobrancaId: cobrancaId },
      include: { cliente: true },
    });

    if (!session) {
      this.logger.warn(`Sessão não encontrada para cobrança: ${cobrancaId}`);
      return { processed: false, reason: 'session_not_found' };
    }

    if (session.status === BookingStatus.CONFIRMADO) {
      return { processed: true, reason: 'already_confirmed' };
    }

    if (status === 'PAID') {
      const disponivel = await this.erpClient.verificarDisponibilidade(
        session.empresaId,
        session.servicoId,
        session.funcionarioId,
        session.dataHoraInicio.toISOString(),
        session.dataHoraFim.toISOString(),
      );

      if (!disponivel) {
        await this.prisma.bookingSession.update({
          where: { id: session.id },
          data: { status: BookingStatus.CANCELADO },
        });
        return { processed: true, reason: 'slot_unavailable', refund: true };
      }

      const agendamento = await this.erpClient.criarAgendamento({
        empresaId: session.empresaId,
        servicoId: session.servicoId,
        funcionarioId: session.funcionarioId || undefined,
        clienteNome: session.cliente.nome,
        clienteEmail: session.cliente.email,
        clienteTelefone: session.cliente.telefone || '',
        dataHoraInicio: session.dataHoraInicio.toISOString(),
        dataHoraFim: session.dataHoraFim.toISOString(),
      });

      const updated = await this.prisma.bookingSession.update({
        where: { id: session.id },
        data: {
          status: BookingStatus.CONFIRMADO,
          agendamentoErpId: agendamento.id,
        },
      });

      await this.notifications.publishBookingConfirmado({
        sessionId: updated.id,
        clienteNome: session.cliente.nome,
        clienteTelefone: session.cliente.telefone || '',
        clienteEmail: session.cliente.email,
        servicoNome: session.servicoNome,
        dataHora: session.dataHoraInicio.toISOString(),
        cancelToken: updated.cancelToken,
        empresaId: session.empresaId,
        empresaSlug: session.empresaSlug,
      });

      return { processed: true, reason: 'confirmed', sessionId: session.id };
    }

    if (status === 'EXPIRED' || status === 'CANCELLED') {
      await this.prisma.bookingSession.update({
        where: { id: session.id },
        data: { status: BookingStatus.EXPIRADO },
      });

      await this.notifications.publishBookingExpirado({
        sessionId: session.id,
        clienteNome: session.cliente.nome,
        clienteTelefone: session.cliente.telefone || '',
        empresaId: session.empresaId,
      });

      return { processed: true, reason: 'expired' };
    }

    return { processed: false, reason: 'unknown_status' };
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireSessions() {
    const now = new Date();

    const expired = await this.prisma.bookingSession.updateMany({
      where: {
        status: BookingStatus.AGUARDANDO_PAGAMENTO,
        expiraEm: { lt: now },
      },
      data: { status: BookingStatus.EXPIRADO },
    });

    if (expired.count > 0) {
      this.logger.log(`Expiradas ${expired.count} sessões de agendamento`);
    }
  }
}
