import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { BookingService } from './booking.service';
import { PrismaService } from '../prisma.service';
import { ErpClientService } from '../erp-client/erp-client.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingStatus } from '@prisma/client';

describe('BookingService', () => {
  let service: BookingService;
  let prisma: jest.Mocked<PrismaService>;
  let erpClient: jest.Mocked<ErpClientService>;
  let notifications: jest.Mocked<NotificationsService>;

  const mockEmpresa = {
    id: 'empresa-123',
    slug: 'barbearia-teste',
    nome: 'Barbearia Teste',
    plano: 'BRONZE' as const,
  };

  const mockServico = {
    id: 'servico-123',
    nome: 'Corte de Cabelo',
    descricao: 'Corte masculino',
    duracaoMinutos: 30,
    preco: '50.00',
    valorGarantia: '25.00',
  };

  const mockCliente = {
    id: 'cliente-123',
    nome: 'João Silva',
    email: 'joao@example.com',
    telefone: '11999999999',
  };

  const mockSession = {
    id: 'session-123',
    clienteId: 'cliente-123',
    empresaId: 'empresa-123',
    empresaSlug: 'barbearia-teste',
    servicoId: 'servico-123',
    servicoNome: 'Corte de Cabelo',
    servicoPreco: 50,
    funcionarioId: null,
    funcionarioNome: null,
    dataHoraInicio: new Date('2026-05-25T10:00:00Z'),
    dataHoraFim: new Date('2026-05-25T10:30:00Z'),
    status: BookingStatus.RASCUNHO,
    valorGarantia: null,
    pixQrCode: null,
    pixQrCodeBase64: null,
    pixExpiracao: null,
    pixTxId: null,
    agendamentoErpId: null,
    cancelToken: 'cancel-token-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: {
            bookingSession: {
              create: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: ErpClientService,
          useValue: {
            getEmpresaBySlug: jest.fn(),
            getServicos: jest.fn(),
            getProfissionais: jest.fn(),
            verificarDisponibilidade: jest.fn(),
            criarAgendamento: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            publishBookingConfirmado: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    prisma = module.get(PrismaService);
    erpClient = module.get(ErpClientService);
    notifications = module.get(NotificationsService);
  });

  describe('createSession', () => {
    beforeEach(() => {
      (erpClient.getEmpresaBySlug as jest.Mock).mockResolvedValue(mockEmpresa);
      (erpClient.getServicos as jest.Mock).mockResolvedValue([mockServico]);
      (prisma.bookingSession.create as jest.Mock).mockResolvedValue(mockSession);
    });

    it('deve criar sessão com sucesso', async () => {
      const result = await service.createSession('barbearia-teste', mockCliente, {
        servicoId: 'servico-123',
        dataHoraInicio: '2026-05-25T10:00:00Z',
      });

      expect(result.sessionId).toBe('session-123');
      expect(result.status).toBe(BookingStatus.RASCUNHO);
      expect(result.resumo.servico).toBe('Corte de Cabelo');
      expect(result.resumo.profissional).toBe('Qualquer disponível');
    });

    it('deve lançar erro se serviço não existir', async () => {
      await expect(
        service.createSession('barbearia-teste', mockCliente, {
          servicoId: 'servico-inexistente',
          dataHoraInicio: '2026-05-25T10:00:00Z',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve calcular garantia=null para plano BRONZE', async () => {
      await service.createSession('barbearia-teste', mockCliente, {
        servicoId: 'servico-123',
        dataHoraInicio: '2026-05-25T10:00:00Z',
      });

      expect(prisma.bookingSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            valorGarantia: null,
          }),
        }),
      );
    });

    it('deve calcular garantia=50% para plano PLATINUM', async () => {
      (erpClient.getEmpresaBySlug as jest.Mock).mockResolvedValue({
        ...mockEmpresa,
        plano: 'PLATINUM',
      });

      await service.createSession('barbearia-teste', mockCliente, {
        servicoId: 'servico-123',
        dataHoraInicio: '2026-05-25T10:00:00Z',
      });

      expect(prisma.bookingSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            valorGarantia: 25,
          }),
        }),
      );
    });
  });

  describe('getSession', () => {
    it('deve retornar sessão existente', async () => {
      (prisma.bookingSession.findFirst as jest.Mock).mockResolvedValue(mockSession);

      const result = await service.getSession('session-123', 'cliente-123');

      expect(result.sessionId).toBe('session-123');
      expect(result.pix).toBeNull();
    });

    it('deve lançar erro se sessão não existir', async () => {
      (prisma.bookingSession.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getSession('session-inexistente', 'cliente-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('confirmSession', () => {
    const sessionWithCliente = {
      ...mockSession,
      cliente: {
        id: 'cliente-123',
        nome: 'João Silva',
        email: 'joao@example.com',
        telefone: '11999999999',
        googleId: 'google-123',
        fotoPerfil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    beforeEach(() => {
      (prisma.bookingSession.findFirst as jest.Mock).mockResolvedValue(sessionWithCliente);
      (erpClient.getEmpresaBySlug as jest.Mock).mockResolvedValue(mockEmpresa);
      (erpClient.verificarDisponibilidade as jest.Mock).mockResolvedValue(true);
      (erpClient.criarAgendamento as jest.Mock).mockResolvedValue({ id: 'agendamento-123' });
      (prisma.bookingSession.update as jest.Mock).mockResolvedValue({
        ...mockSession,
        status: BookingStatus.CONFIRMADO,
      });
    });

    it('deve confirmar sessão com sucesso', async () => {
      const result = await service.confirmSession('session-123', 'cliente-123', 'barbearia-teste');

      expect(result.status).toBe(BookingStatus.CONFIRMADO);
      expect(notifications.publishBookingConfirmado).toHaveBeenCalled();
    });

    it('deve lançar erro se sessão não estiver em RASCUNHO', async () => {
      (prisma.bookingSession.findFirst as jest.Mock).mockResolvedValue({
        ...sessionWithCliente,
        status: BookingStatus.CONFIRMADO,
      });

      await expect(
        service.confirmSession('session-123', 'cliente-123', 'barbearia-teste'),
      ).rejects.toThrow(ConflictException);
    });

    it('deve lançar erro se plano requer pagamento', async () => {
      (erpClient.getEmpresaBySlug as jest.Mock).mockResolvedValue({
        ...mockEmpresa,
        plano: 'PLATINUM',
      });

      await expect(
        service.confirmSession('session-123', 'cliente-123', 'barbearia-teste'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se horário não disponível', async () => {
      (erpClient.verificarDisponibilidade as jest.Mock).mockResolvedValue(false);

      await expect(
        service.confirmSession('session-123', 'cliente-123', 'barbearia-teste'),
      ).rejects.toThrow(ConflictException);
    });
  });
});
