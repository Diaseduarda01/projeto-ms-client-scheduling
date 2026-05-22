import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ClienteService {
  constructor(private prisma: PrismaService) {}

  async updateTelefone(clienteId: string, telefone: string) {
    const cliente = await this.prisma.cliente.update({
      where: { id: clienteId },
      data: { telefone },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        fotoPerfil: true,
      },
    });

    return {
      ...cliente,
      precisaOnboarding: false,
    };
  }

  async getAgendamentos(clienteId: string) {
    const sessions = await this.prisma.bookingSession.findMany({
      where: {
        clienteId,
        status: { in: ['CONFIRMADO', 'CONCLUIDO', 'CANCELADO'] },
      },
      orderBy: { dataHoraInicio: 'desc' },
      select: {
        id: true,
        servicoNome: true,
        empresaSlug: true,
        dataHoraInicio: true,
        status: true,
        cancelToken: true,
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      servicoNome: session.servicoNome,
      empresaSlug: session.empresaSlug,
      dataHora: session.dataHoraInicio.toISOString(),
      status: session.status,
      cancelToken: session.status === 'CONFIRMADO' ? session.cancelToken : null,
    }));
  }

  async findById(id: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        fotoPerfil: true,
      },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return cliente;
  }
}
