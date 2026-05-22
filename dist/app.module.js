"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const serve_static_1 = require("@nestjs/serve-static");
const throttler_1 = require("@nestjs/throttler");
const path_1 = require("path");
const health_module_1 = require("./health/health.module");
const erp_client_module_1 = require("./erp-client/erp-client.module");
const auth_module_1 = require("./auth/auth.module");
const cliente_module_1 = require("./cliente/cliente.module");
const catalog_module_1 = require("./catalog/catalog.module");
const booking_module_1 = require("./booking/booking.module");
const payment_module_1 = require("./payment/payment.module");
const notifications_module_1 = require("./notifications/notifications.module");
const prisma_service_1 = require("./prisma.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '.env.example'],
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'client', 'dist'),
                exclude: ['/api{/*path}', '/auth{/*path}', '/health', '/catalog{/*path}', '/book{/*path}', '/clientes{/*path}', '/webhook{/*path}'],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    name: 'short',
                    ttl: 1000,
                    limit: 3,
                },
                {
                    name: 'medium',
                    ttl: 10000,
                    limit: 20,
                },
                {
                    name: 'long',
                    ttl: 60000,
                    limit: 60,
                },
            ]),
            health_module_1.HealthModule,
            erp_client_module_1.ErpClientModule,
            auth_module_1.AuthModule,
            cliente_module_1.ClienteModule,
            catalog_module_1.CatalogModule,
            booking_module_1.BookingModule,
            payment_module_1.PaymentModule,
            notifications_module_1.NotificationsModule,
        ],
        providers: [prisma_service_1.PrismaService],
        exports: [prisma_service_1.PrismaService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map