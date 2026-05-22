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
exports.ClienteService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let ClienteService = class ClienteService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateTelefone(clienteId, telefone) {
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
    async getAgendamentos(clienteId) {
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
    async findById(id) {
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
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        return cliente;
    }
};
exports.ClienteService = ClienteService;
exports.ClienteService = ClienteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClienteService);
//# sourceMappingURL=cliente.service.js.map