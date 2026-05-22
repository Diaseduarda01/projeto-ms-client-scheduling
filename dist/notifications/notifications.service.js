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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqplib = __importStar(require("amqplib"));
let NotificationsService = NotificationsService_1 = class NotificationsService {
    configService;
    logger = new common_1.Logger(NotificationsService_1.name);
    connection = null;
    channel = null;
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        await this.connect();
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    async connect() {
        const url = this.configService.get('RABBITMQ_URL');
        if (!url) {
            this.logger.warn('RABBITMQ_URL não configurada, notificações desabilitadas');
            return;
        }
        try {
            this.connection = await amqplib.connect(url);
            this.channel = await this.connection.createChannel();
            await this.channel.assertExchange('booking', 'topic', { durable: true });
            await this.channel.assertQueue('notificacao.booking_confirmado', { durable: true });
            await this.channel.assertQueue('notificacao.booking_expirado', { durable: true });
            await this.channel.assertQueue('notificacao.booking_cancelado', { durable: true });
            await this.channel.bindQueue('notificacao.booking_confirmado', 'booking', 'booking.confirmado');
            await this.channel.bindQueue('notificacao.booking_expirado', 'booking', 'booking.expirado');
            await this.channel.bindQueue('notificacao.booking_cancelado', 'booking', 'booking.cancelado');
            this.logger.log('Conectado ao RabbitMQ');
        }
        catch (error) {
            this.logger.error('Erro ao conectar ao RabbitMQ', error);
        }
    }
    async disconnect() {
        try {
            await this.channel?.close();
            await this.connection?.close();
        }
        catch (error) {
            this.logger.error('Erro ao desconectar do RabbitMQ', error);
        }
    }
    async publishBookingConfirmado(event) {
        await this.publish('booking.confirmado', event);
    }
    async publishBookingExpirado(event) {
        await this.publish('booking.expirado', event);
    }
    async publishBookingCancelado(event) {
        await this.publish('booking.cancelado', event);
    }
    async publish(routingKey, event) {
        if (!this.channel) {
            this.logger.warn(`Canal não disponível, evento ${routingKey} não publicado`);
            return;
        }
        try {
            this.channel.publish('booking', routingKey, Buffer.from(JSON.stringify(event)), { persistent: true });
            this.logger.debug(`Evento ${routingKey} publicado`);
        }
        catch (error) {
            this.logger.error(`Erro ao publicar evento ${routingKey}`, error);
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map