"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const erp_client_service_1 = require("../erp-client/erp-client.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
let BookingService = class BookingService {
    prisma;
    erpClient;
    notifications;
    constructor(prisma, erpClient, notifications) {
        this.prisma = prisma;
        this.erpClient = erpClient;
        this.notifications = notifications;
    }
    async createSession(slug, cliente, dto) {
        const empresa = await this.erpClient.getEmpresaBySlug(slug);
        const servicos = await this.erpClient.getServicos(slug);
        const servico = servicos.find((s) => s.id === dto.servicoId);
        if (!servico) {
            throw new common_1.NotFoundException('Serviço não encontrado');
        }
        let funcionarioNome = null;
        if (dto.funcionarioId) {
            const profissionais = await this.erpClient.getProfissionais(slug, dto.servicoId);
            const profissional = profissionais.find((p) => p.id === dto.funcionarioId);
            if (!profissional) {
                throw new common_1.NotFoundException('Profissional não encontrado');
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
                status: client_1.BookingStatus.RASCUNHO,
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
    async getSession(sessionId, clienteId) {
        const session = await this.prisma.bookingSession.findFirst({
            where: { id: sessionId, clienteId },
        });
        if (!session) {
            throw new common_1.NotFoundException('Sessão não encontrada');
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
            cancelToken: session.status === client_1.BookingStatus.CONFIRMADO ? session.cancelToken : null,
        };
    }
    async confirmSession(sessionId, clienteId, slug) {
        const session = await this.prisma.bookingSession.findFirst({
            where: { id: sessionId, clienteId },
            include: { cliente: true },
        });
        if (!session) {
            throw new common_1.NotFoundException('Sessão não encontrada');
        }
        if (session.status !== client_1.BookingStatus.RASCUNHO) {
            throw new common_1.ConflictException('Sessão não pode ser confirmada');
        }
        const empresa = await this.erpClient.getEmpresaBySlug(slug);
        if (empresa.plano !== 'BASIC' && empresa.plano !== 'BRONZE') {
            throw new common_1.BadRequestException('Este plano requer pagamento antecipado');
        }
        const disponivel = await this.erpClient.verificarDisponibilidade(session.empresaId, session.servicoId, session.funcionarioId, session.dataHoraInicio.toISOString(), session.dataHoraFim.toISOString());
        if (!disponivel) {
            throw new common_1.ConflictException('Horário não está mais disponível');
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
        return {
            sessionId: updated.id,
            status: updated.status,
            cancelToken: updated.cancelToken,
        };
    }
    calcularGarantia(servico, plano) {
        if (plano === 'BASIC' || plano === 'BRONZE') {
            return null;
        }
        return Number(servico.preco) * 0.5;
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        erp_client_service_1.ErpClientService,
        notifications_service_1.NotificationsService])
], BookingService);
//# sourceMappingURL=booking.service.js.map