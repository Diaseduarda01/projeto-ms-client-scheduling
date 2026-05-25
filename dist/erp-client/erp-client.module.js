"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErpClientModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const erp_client_service_1 = require("./erp-client.service");
let ErpClientModule = class ErpClientModule {
};
exports.ErpClientModule = ErpClientModule;
exports.ErpClientModule = ErpClientModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    baseURL: config.get('ERP_API_URL'),
                    headers: {
                        'x-internal-key': config.get('ERP_INTERNAL_API_KEY'),
                    },
                    timeout: 10000,
                }),
            }),
        ],
        providers: [erp_client_service_1.ErpClientService],
        exports: [erp_client_service_1.ErpClientService],
    })
], ErpClientModule);
//# sourceMappingURL=erp-client.module.js.map