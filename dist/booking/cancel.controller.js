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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const erp_client_service_1 = require("../erp-client/erp-client.service");
const notifications_service_1 = require("../notifications/notifications.service");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
let CancelController = class CancelController {
    prisma;
    erpClient;
    notifications;
    configService;
    constructor(prisma, erpClient, notifications, configService) {
        this.prisma = prisma;
        this.erpClient = erpClient;
        this.notifications = notifications;
        this.configService = configService;
    }
    async cancelByToken(cancelToken) {
        const session = await this.prisma.bookingSession.findUnique({
            where: { cancelToken },
            include: { cliente: true },
        });
        if (!session) {
            throw new common_1.NotFoundException('Agendamento não encontrado');
        }
        if (session.status !== client_1.BookingStatus.CONFIRMADO) {
            throw new common_1.ConflictException('Agendamento não pode ser cancelado');
        }
        const antecedenciaHoras = this.configService.get('CANCELAMENTO_ANTECEDENCIA_HORAS', 2);
        const limiteCancelamento = new Date(session.dataHoraInicio.getTime() - antecedenciaHoras * 60 * 60 * 1000);
        if (new Date() > limiteCancelamento) {
            throw new common_1.ConflictException(`Cancelamento permitido até ${antecedenciaHoras}h antes do horário`);
        }
        if (session.agendamentoErpId) {
            await this.erpClient.cancelarAgendamento(session.agendamentoErpId);
        }
        await this.prisma.bookingSession.update({
            where: { id: session.id },
            data: { status: client_1.BookingStatus.CANCELADO },
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
};
exports.CancelController = CancelController;
__decorate([
    (0, common_1.Delete)('cancelar/:cancelToken'),
    __param(0, (0, common_1.Param)('cancelToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CancelController.prototype, "cancelByToken", null);
exports.CancelController = CancelController = __decorate([
    (0, common_1.Controller)('book'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        erp_client_service_1.ErpClientService,
        notifications_service_1.NotificationsService,
        config_1.ConfigService])
], CancelController);
//# sourceMappingURL=cancel.controller.js.map