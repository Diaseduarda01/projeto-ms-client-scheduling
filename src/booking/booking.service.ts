import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ErpClientService, Servico } from '../erp-client/erp-client.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from '@prisma/client';

interface ClienteInfo {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
}

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private erpClient: ErpClientService,
    private notifications: NotificationsService,
  ) {}

  async createSession(
    slug: string,
    cliente: ClienteInfo,
    dto: CreateBookingDto,
  ) {
    const empresa = await this.erpClient.getEmpresaBySlug(slug);
    const servicos = await this.erpClient.getServicos(slug);
    const servico = servicos.find((s) => s.id === dto.servicoId);

    if (!servico) {
      throw new NotFoundException('Serviço não encontrado');
    }

    let funcionarioNome: string | null = null;
    if (dto.funcionarioId) {
      const profissionais = await this.erpClient.getProfissionais(slug, dto.servicoId);
      const profissional = profissionais.find((p) => p.id === dto.funcionarioId);
      if (!profissional) {
        throw new NotFoundException('Profissional não encontrado');
      }
      funcionarioNome = profissional.nome;
    }

    const dataHoraInicio = new Date(dto.dataHoraInicio);
    const dataHoraFim = new Date(dataHoraInicio.getTime() + servico.duracaoMinutos * 60000);

    const valorGarantia = this.calcularGarantia(servico, empresa.plano);

    const session = await this.prisma.bookingSession.create({
      data: {
        clienteId: cliente.id,
        empresaId: empresa.id,
        empresaSlug: slug,
        servicoId: dto.servicoId,
        servicoNome: servico.nome,
        servicoPreco: servico.preco,
        funcionarioId: dto.funcionarioId || null,
        funcionarioNome,
        dataHoraInicio,
        dataHoraFim,
        status: BookingStatus.RASCUNHO,
        valorGarantia,
      },
    });

    return {
      sessionId: session.id,
      status: session.status,
      resumo: {
        servico: servico.nome,
        profissional: funcionarioNome || 'Qualquer disponível',
        dataHora: dataHoraInicio.toISOString(),
        valorTotal: servico.preco,
        valorGarantia: valorGarantia?.toString() || null,
        cliente: {
          nome: cliente.nome,
          telefone: cliente.telefone,
        },
      },
    };
  }

  async getSession(sessionId: string, clienteId: string) {
    const session = await this.prisma.bookingSession.findFirst({
      where: { id: sessionId, clienteId },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    return {
      sessionId: session.id,
      status: session.status,
      resumo: {
        servico: session.servicoNome,
        profissional: session.funcionarioNome || 'Qualquer disponível',
        dataHora: session.dataHoraInicio.toISOString(),
        valorTotal: session.servicoPreco.toString(),
        valorGarantia: session.valorGarantia?.toString() || null,
      },
      pix: session.pixQrCode
        ? {
            qrCode: session.pixQrCode,
            qrCodeBase64: session.pixQrCodeBase64,
            expiracao: session.pixExpiracao?.toISOString(),
          }
        : null,
      cancelToken: session.status === BookingStatus.CONFIRMADO ? session.cancelToken : null,
    };
  }

  async confirmSession(sessionId: string, clienteId: string, slug: string) {
    const session = await this.prisma.bookingSession.findFirst({
      where: { id: sessionId, clienteId },
      include: { cliente: true },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (session.status !== BookingStatus.RASCUNHO) {
      throw new ConflictException('Sessão não pode ser confirmada');
    }

    const empresa = await this.erpClient.getEmpresaBySlug(slug);

    if (empresa.plano !== 'BASIC' && empresa.plano !== 'BRONZE') {
      throw new BadRequestException('Este plano requer pagamento antecipado');
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
      where: { id: sessionId },
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

    return {
      sessionId: updated.id,
      status: updated.status,
      cancelToken: updated.cancelToken,
    };
  }

  private calcularGarantia(servico: Servico, plano: string): number | null {
    if (plano === 'BASIC' || plano === 'BRONZE') {
      return null;
    }
    return Number(servico.preco) * 0.5;
  }
}
