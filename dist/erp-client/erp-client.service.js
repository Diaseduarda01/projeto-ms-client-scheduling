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
exports.ErpClientService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let ErpClientService = class ErpClientService {
    http;
    constructor(http) {
        this.http = http;
    }
    async getEmpresaBySlug(slug) {
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.http.get(`/internal/empresas/slug/${slug}`));
            return data;
        }
        catch (error) {
            if (error.response?.status === 404) {
                throw new common_1.NotFoundException(`Empresa não encontrada: ${slug}`);
            }
            throw error;
        }
    }
    async getEmpresaPublic(slug) {
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.http.get(`/public/${slug}`));
            return data;
        }
        catch (error) {
            if (error.response?.status === 404) {
                throw new common_1.NotFoundException(`Empresa não encontrada: ${slug}`);
            }
            throw error;
        }
    }
    async getServicos(slug) {
        const { data } = await (0, rxjs_1.firstValueFrom)(this.http.get(`/public/${slug}/servicos`));
        return data;
    }
    async getProfissionais(slug, servicoId) {
        const params = servicoId ? { servicoId } : {};
        const { data } = await (0, rxjs_1.firstValueFrom)(this.http.get(`/public/${slug}/profissionais`, { params }));
        return data;
    }
    async getDisponibilidade(slug, servicoId, data, funcionarioId) {
        const params = { servicoId, data };
        if (funcionarioId)
            params.funcionarioId = funcionarioId;
        const { data: result } = await (0, rxjs_1.firstValueFrom)(this.http.get(`/public/${slug}/disponibilidade`, { params }));
        return result;
    }
    async verificarDisponibilidade(empresaId, servicoId, funcionarioId, dataHoraInicio, dataHoraFim) {
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.http.get('/internal/disponibilidade', {
                params: { empresaId, servicoId, funcionarioId, dataHoraInicio, dataHoraFim },
            }));
            return data.disponivel;
        }
        catch {
            return false;
        }
    }
    async criarAgendamento(dto) {
        const { data } = await (0, rxjs_1.firstValueFrom)(this.http.post('/internal/agendamentos', dto));
        return data;
    }
    async cancelarAgendamento(agendamentoId) {
        await (0, rxjs_1.firstValueFrom)(this.http.delete(`/internal/agendamentos/${agendamentoId}`));
    }
};
exports.ErpClientService = ErpClientService;
exports.ErpClientService = ErpClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], ErpClientService);
//# sourceMappingURL=erp-client.service.js.map