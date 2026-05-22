import {
  Controller,
  Delete,
  Param,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ErpClientService } from '../erp-client/erp-client.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { BookingStatus } from '@prisma/client';

@Controller('book')
export class CancelController {
  constructor(
    private prisma: PrismaService,
    private erpClient: ErpClientService,
    private notifications: NotificationsService,
    private configService: ConfigService,
  ) {}

  @Delete('cancelar/:cancelToken')
  async cancelByToken(@Param('cancelToken') cancelToken: string) {
    const session = await this.prisma.bookingSession.findUnique({
      where: { cancelToken },
      include: { cliente: true },
    });

    if (!session) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (session.status !== BookingStatus.CONFIRMADO) {
      throw new ConflictException('Agendamento não pode ser cancelado');
    }

    const antecedenciaHoras = this.configService.get<number>('CANCELAMENTO_ANTECEDENCIA_HORAS', 2);
    const limiteCancelamento = new Date(
      session.dataHoraInicio.getTime() - antecedenciaHoras * 60 * 60 * 1000,
    );

    if (new Date() > limiteCancelamento) {
      throw new ConflictException(
        `Cancelamento permitido até ${antecedenciaHoras}h antes do horário`,
      );
    }

    if (session.agendamentoErpId) {
      await this.erpClient.cancelarAgendamento(session.agendamentoErpId);
    }

    await this.prisma.bookingSession.update({
      where: { id: session.id },
      data: { status: BookingStatus.CANCELADO },
    });

    await this.notifications.publishBookingCancelado({
      sessionId: session.id,
      clienteNome: session.cliente.nome,
      servicoNome: session.servicoNome,
      dataHora: session.dataHoraInicio.toISOString(),
      empresaId: session.empresaId,
    });

    return {
      message: 'Agendamento cancelado com sucesso',
      sessionId: session.id,
    };
  }
}
