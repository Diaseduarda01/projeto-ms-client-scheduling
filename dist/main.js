"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
    });
    app.use((0, cookie_parser_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({
        origin: true,
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('ms-client-scheduling')
        .setDescription('API de agendamento para clientes finais')
        .setVersion('1.0')
        .addCookieAuth('access_token')
        .addTag('auth', 'Autenticação Google OAuth')
        .addTag('catalog', 'Catálogo de serviços e profissionais')
        .addTag('booking', 'Agendamento e sessões')
        .addTag('clientes', 'Área do cliente')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 3003);
    await app.listen(port);
    console.log(`ms-client-scheduling running on port ${port}`);
    console.log(`Swagger available at http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map