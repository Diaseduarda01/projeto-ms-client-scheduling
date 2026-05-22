"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma.service");
const erp_client_service_1 = require("../erp-client/erp-client.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
let PaymentService = PaymentService_1 = class PaymentService {
    prisma;
    erpClient;
    configService;
    notifications;
    logger = new common_1.Logger(PaymentService_1.name);
    constructor(prisma, erpClient, configService, notifications) {
        this.prisma = prisma;
        this.erpClient = erpClient;
        this.configService = configService;
        this.notifications = notifications;
    }
    async generatePix(sessionId, clienteId) {
        const session = await this.prisma.bookingSession.findFirst({
            where: { id: sessionId, clienteId },
            include: { cliente: true },
        });
        if (!session) {
            throw new common_1.NotFoundException('Sessão não encontrada');
        }
        if (session.status !== client_1.BookingStatus.RASCUNHO) {
            throw new common_1.ConflictException('Sessão não está em rascunho');
        }
        if (!session.valorGarantia) {
            throw new common_1.BadRequestException('Esta sessão não requer pagamento');
        }
        const disponivel = await this.erpClient.verificarDisponibilidade(session.empresaId, session.servicoId, session.funcionarioId, session.dataHoraInicio.toISOString(), session.dataHoraFim.toISOString());
        if (!disponivel) {
            throw new common_1.ConflictException('Horário não está mais disponível');
        }
        const ttlSegundos = this.configService.get('PIX_TTL_SEGUNDOS', 900);
        const financeiroUrl = this.configService.get('FINANCEIRO_API_URL');
        const financeiroKey = this.configService.get('FINANCEIRO_INTERNAL_API_KEY');
        const pixResponse = await axios_1.default.post(`${financeiroUrl}/cobrancas`, {
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
        }, {
            headers: { 'X-Internal-Api-Key': financeiroKey },
        });
        const expiracao = new Date(Date.now() + ttlSegundos * 1000);
        const updated = await this.prisma.bookingSession.update({
            where: { id: sessionId },
            data: {
                status: client_1.BookingStatus.AGUARDANDO_PAGAMENTO,
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
    async processWebhook(cobrancaId, status, signature, rawBody) {
        const webhookSecret = this.configService.get('ABACATEPAY_WEBHOOK_SECRET');
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret || '')
            .update(rawBody)
            .digest('hex');
        if (signature !== expectedSignature) {
            throw new common_1.BadRequestException('Assinatura inválida');
        }
        const session = await this.prisma.bookingSession.findFirst({
            where: { pixCobrancaId: cobrancaId },
            include: { cliente: true },
        });
        if (!session) {
            this.logger.warn(`Sessão não encontrada para cobrança: ${cobrancaId}`);
            return { processed: false, reason: 'session_not_found' };
        }
        if (session.status === client_1.BookingStatus.CONFIRMADO) {
            return { processed: true, reason: 'already_confirmed' };
        }
        if (status === 'PAID') {
            const disponivel = await this.erpClient.verificarDisponibilidade(session.empresaId, session.servicoId, session.funcionarioId, session.dataHoraInicio.toISOString(), session.dataHoraFim.toISOString());
            if (!disponivel) {
                await this.prisma.bookingSession.update({
                    where: { id: session.id },
                    data: { status: client_1.BookingStatus.CANCELADO },
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
                    status: client_1.BookingStatus.CONFIRMADO,
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
                data: { status: client_1.BookingStatus.EXPIRADO },
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
    async expireSessions() {
        const now = new Date();
        const expired = await this.prisma.bookingSession.updateMany({
            where: {
                status: client_1.BookingStatus.AGUARDANDO_PAGAMENTO,
                expiraEm: { lt: now },
            },
            data: { status: client_1.BookingStatus.EXPIRADO },
        });
        if (expired.count > 0) {
            this.logger.log(`Expiradas ${expired.count} sessões de agendamento`);
        }
    }
};
exports.PaymentService = PaymentService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentService.prototype, "expireSessions", null);
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        erp_client_service_1.ErpClientService,
        config_1.ConfigService,
        notifications_service_1.NotificationsService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map