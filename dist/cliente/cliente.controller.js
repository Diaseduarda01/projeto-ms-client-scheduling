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
exports.ClienteController = void 0;
const common_1 = require("@nestjs/common");
const cliente_service_1 = require("./cliente.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const update_telefone_dto_1 = require("./dto/update-telefone.dto");
let ClienteController = class ClienteController {
    clienteService;
    constructor(clienteService) {
        this.clienteService = clienteService;
    }
    async getProfile(req) {
        const user = req.user;
        const cliente = await this.clienteService.findById(user.id);
        return {
            ...cliente,
            precisaOnboarding: !cliente.telefone,
        };
    }
    async updateTelefone(req, dto) {
        const user = req.user;
        return this.clienteService.updateTelefone(user.id, dto.telefone);
    }
    async getAgendamentos(req) {
        const user = req.user;
        return this.clienteService.getAgendamentos(user.id);
    }
};
exports.ClienteController = ClienteController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClienteController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('me/telefone'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_telefone_dto_1.UpdateTelefoneDto]),
    __metadata("design:returntype", Promise)
], ClienteController.prototype, "updateTelefone", null);
__decorate([
    (0, common_1.Get)('me/agendamentos'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClienteController.prototype, "getAgendamentos", null);
exports.ClienteController = ClienteController = __decorate([
    (0, common_1.Controller)('clientes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [cliente_service_1.ClienteService])
], ClienteController);
//# sourceMappingURL=cliente.controller.js.map