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
exports.CatalogController = void 0;
const common_1 = require("@nestjs/common");
const erp_client_service_1 = require("../erp-client/erp-client.service");
let CatalogController = class CatalogController {
    erpClient;
    constructor(erpClient) {
        this.erpClient = erpClient;
    }
    async getEmpresa(slug) {
        return this.erpClient.getEmpresaPublic(slug);
    }
    async getServicos(slug) {
        return this.erpClient.getServicos(slug);
    }
    async getProfissionais(slug, servicoId) {
        return this.erpClient.getProfissionais(slug, servicoId);
    }
    async getDisponibilidade(slug, servicoId, data, funcionarioId) {
        return this.erpClient.getDisponibilidade(slug, servicoId, data, funcionarioId);
    }
};
exports.CatalogController = CatalogController;
__decorate([
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getEmpresa", null);
__decorate([
    (0, common_1.Get)(':slug/servicos'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getServicos", null);
__decorate([
    (0, common_1.Get)(':slug/profissionais'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('servicoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getProfissionais", null);
__decorate([
    (0, common_1.Get)(':slug/disponibilidade'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('servicoId')),
    __param(2, (0, common_1.Query)('data')),
    __param(3, (0, common_1.Query)('funcionarioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getDisponibilidade", null);
exports.CatalogController = CatalogController = __decorate([
    (0, common_1.Controller)('catalog'),
    __metadata("design:paramtypes", [erp_client_service_1.ErpClientService])
], CatalogController);
//# sourceMappingURL=catalog.controller.js.map