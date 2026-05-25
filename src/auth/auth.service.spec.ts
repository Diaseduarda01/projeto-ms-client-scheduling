import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockCliente = {
    id: 'cliente-123',
    googleId: 'google-456',
    email: 'test@example.com',
    nome: 'Test User',
    fotoPerfil: 'https://example.com/photo.jpg',
    telefone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            cliente: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  describe('findOrCreateCliente', () => {
    const googleProfile = {
      googleId: 'google-456',
      email: 'test@example.com',
      nome: 'Test User',
      fotoPerfil: 'https://example.com/photo.jpg',
    };

    it('deve retornar cliente existente', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(mockCliente);

      const result = await service.findOrCreateCliente(googleProfile);

      expect(prisma.cliente.findUnique).toHaveBeenCalledWith({
        where: { googleId: 'google-456' },
      });
      expect(prisma.cliente.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        id: 'cliente-123',
        nome: 'Test User',
        email: 'test@example.com',
        fotoPerfil: 'https://example.com/photo.jpg',
        telefone: null,
        precisaOnboarding: true,
      });
    });

    it('deve criar novo cliente se não existir', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.create as jest.Mock).mockResolvedValue(mockCliente);

      const result = await service.findOrCreateCliente(googleProfile);

      expect(prisma.cliente.create).toHaveBeenCalledWith({
        data: {
          googleId: 'google-456',
          email: 'test@example.com',
          nome: 'Test User',
          fotoPerfil: 'https://example.com/photo.jpg',
        },
      });
      expect(result.precisaOnboarding).toBe(true);
    });

    it('deve retornar precisaOnboarding=false se cliente tem telefone', async () => {
      const clienteComTelefone = { ...mockCliente, telefone: '11999999999' };
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(clienteComTelefone);

      const result = await service.findOrCreateCliente(googleProfile);

      expect(result.precisaOnboarding).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('deve gerar token JWT com payload correto', () => {
      const cliente = {
        id: 'cliente-123',
        nome: 'Test User',
        email: 'test@example.com',
        fotoPerfil: null,
        telefone: null,
        precisaOnboarding: true,
      };

      (jwtService.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = service.generateToken(cliente);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'cliente-123',
        email: 'test@example.com',
      });
      expect(result).toBe('mock-jwt-token');
    });
  });

  describe('getCookieOptions', () => {
    it('deve retornar secure=false em development', () => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        return undefined;
      });

      const options = service.getCookieOptions();

      expect(options.secure).toBe(false);
      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe('lax');
    });

    it('deve retornar secure=true em production', () => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        return undefined;
      });

      const options = service.getCookieOptions();

      expect(options.secure).toBe(true);
    });

    it('deve incluir domain quando configurado', () => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'COOKIE_DOMAIN') return '.example.com';
        return undefined;
      });

      const options = service.getCookieOptions();

      expect(options.domain).toBe('.example.com');
    });
  });
});
