import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma.service';
import { ErpClientService } from '../erp-client/erp-client.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingStatus } from '@prisma/client';
import axios from 'axios';
import * as crypto from 'crypto';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: jest.Mocked<PrismaService>;
  let erpClient: jest.Mocked<ErpClientService>;
  let configService: jest.Mocked<ConfigService>;
  let notifications: jest.Mocked<NotificationsService>;

  const mockCliente = {
    id: 'cliente-123',
    nome: 'João Silva',
    email: 'joao@example.com',
    telefone: '11999999999',
    googleId: 'google-123',
    fotoPerfil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSession = {
    id: 'session-123',
    clienteId: 'cliente-123',
    empresaId: 'empresa-123',
    empresaSlug: 'barbearia-teste',
    servicoId: 'servico-123',
    servicoNome: 'Corte de Cabelo',
    servicoPreco: { toNumber: () => 50 },
    funcionarioId: null,
    funcionarioNome: null,
    dataHoraInicio: new Date('2026-05-25T10:00:00Z'),
    dataHoraFim: new Date('2026-05-25T10:30:00Z'),
    status: BookingStatus.RASCUNHO,
    valorGarantia: { toNumber: () => 25, toString: () => '25.00' },
    pixQrCode: null,
    pixQrCodeBase64: null,
    pixExpiracao: null,
    pixCobrancaId: null,
    pixTxId: null,
    expiraEm: null,
    agendamentoErpId: null,
    cancelToken: 'cancel-token-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    cliente: mockCliente,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PrismaService,
          useValue: {
            bookingSession: {
              findFirst: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
        {
          provide: ErpClientService,
          useValue: {
            verificarDisponibilidade: jest.fn(),
            criarAgendamento: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                PIX_TTL_SEGUNDOS: 900,
                FINANCEIRO_API_URL: 'http://ms-financeiro:3004',
                FINANCEIRO_INTERNAL_API_KEY: 'test-key',
                ABACATEPAY_WEBHOOK_SECRET: 'webhook-secret',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            publishBookingConfirmado: jest.fn(),
            publishBookingExpirado: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    prisma = module.get(PrismaService);
    erpClient = module.get(ErpClientService);
    configService = module.get(ConfigService);
    notifications = module.get(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePix', () => {
    beforeEach(() => {
      (prisma.bookingSession.findFirst as jest.Mock).mockResolvedValue(mockSession);
      (erpClient.verificarDisponibilidade as jest.Mock).mockResolvedValue(true);
      mockedAxios.post.mockResolvedValue({
        data: {
          cobrancaId: 'cobranca-123',
          pixQrCode: '00020126...',
          pixQrCodeBase64: 'data:image/png;base64,...',
          expiracao: '2026-05-25T10:15:00Z',
        },
      });
      (prisma.bookingSession.update as jest.Mock).mockResolvedValue({
        ...mockSession,
        status: BookingStatus.AGUARDANDO_PAGAMENTO,
        pixQrCode: '00020126...',
        pixQrCodeBase64: 'data:image/png;base64,...',
      });
    });

    it('deve gerar Pix com sucesso', async () => {
      const result = await service.generatePix('session-123', 'cliente-123');

      expect(result.status).toBe(BookingStatus.AGUARDANDO_PAGAMENTO);
      expect(result.pix.qrCode).toBe('00020126...');
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('deve lançar erro se sessão não existir', async () => {
      (prisma.bookingSession.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.generatePix('session-123', 'cliente-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar erro se sessão não estiver em RASCUNHO', async () => {
      (prisma.bookingSession.findFirst as jest.Mock).mockResolvedValue({
        ...mockSession,
        status: BookingStatus.CONFIRMADO,
      });

      await expect(service.generatePix('session-123', 'cliente-123')).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve lançar erro se sessão não requer pagamento', async () => {
      (prisma.bookingSession.findFirst as jest.Mock).mockResolvedValue({
        ...mockSession,
        valorGarantia: null,
      });

      await expect(service.generatePix('session-123', 'cliente-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar erro se horário não disponível', async () => {
      (erpClient.verificarDisponibilidade as jest.Mock).mockResolvedValue(false);

      await expect(service.generatePix('session-123', 'cliente-123')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('processWebhook', () => {
    const webhookSecret = 'webhook-secret';
    const rawBody = JSON.stringify({ cobrancaId: 'cobranca-123', status: 'PAID' });
    const validSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    beforeEach(() => {
      (prisma.bookingSession.findFirst as jest.Mock).mockResolvedValue({
        ...mockSession,
        status: BookingStatus.AGUARDANDO_PAGAMENTO,
        pixCobrancaId: 'cobranca-123',
      });
      (erpClient.verificarDisponibilidade as jest.Mock).mockResolvedValue(true);
      (erpClient.criarAgendamento as jest.Mock).mockResolvedValue({ id: 'agendamento-123' });
      (prisma.bookingSession.update as jest.Mock).mockResolvedValue({
        ...mockSession,
        status: BookingStatus.CONFIRMADO,
      });
    });

    it('deve processar pagamento PAID com sucesso', async () => {
      const result = await service.processWebhook('cobranca-123', 'PAID', validSignature, rawBody);

      expect(result.processed).toBe(true);
      expect(result.reason).toBe('confirmed');
      expect(notifications.publishBookingConfirmado).toHaveBeenCalled();
    });

    it('deve rejeitar assinatura inválida', async () => {
      await expect(
        service.processWebhook('cobranca-123', 'PAID', 'invalid-signature', rawBody),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve retornar session_not_found se sessão não existir', async () => {
      (prisma.bookingSession.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.processWebhook('cobranca-123', 'PAID', validSignature, rawBody);

      expect(result.processed).toBe(false);
      expect(result.reason).toBe('session_not_found');
    });

    it('deve retornar already_confirmed se já confirmado', async () => {
      (prisma.bookingSession.findFirst as jest.Mock).mockResolvedValue({
        ...mockSession,
        status: BookingStatus.CONFIRMADO,
      });

      const result = await service.processWebhook('cobranca-123', 'PAID', validSignature, rawBody);

      expect(result.processed).toBe(true);
      expect(result.reason).toBe('already_confirmed');
    });

    it('deve processar EXPIRED corretamente', async () => {
      const result = await service.processWebhook(
        'cobranca-123',
        'EXPIRED',
        validSignature,
        rawBody,
      );

      expect(result.processed).toBe(true);
      expect(result.reason).toBe('expired');
      expect(notifications.publishBookingExpirado).toHaveBeenCalled();
    });

    it('deve cancelar se slot não disponível após pagamento', async () => {
      (erpClient.verificarDisponibilidade as jest.Mock).mockResolvedValue(false);

      const result = await service.processWebhook('cobranca-123', 'PAID', validSignature, rawBody);

      expect(result.processed).toBe(true);
      expect(result.reason).toBe('slot_unavailable');
      expect(result.refund).toBe(true);
    });
  });

  describe('expireSessions', () => {
    it('deve expirar sessões pendentes', async () => {
      (prisma.bookingSession.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      await service.expireSessions();

      expect(prisma.bookingSession.updateMany).toHaveBeenCalledWith({
        where: {
          status: BookingStatus.AGUARDANDO_PAGAMENTO,
          expiraEm: { lt: expect.any(Date) },
        },
        data: { status: BookingStatus.EXPIRADO },
      });
    });
  });
});
