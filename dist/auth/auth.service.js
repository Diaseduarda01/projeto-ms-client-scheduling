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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async findOrCreateCliente(profile) {
        let cliente = await this.prisma.cliente.findUnique({
            where: { googleId: profile.googleId },
        });
        if (!cliente) {
            cliente = await this.prisma.cliente.create({
                data: {
                    googleId: profile.googleId,
                    email: profile.email,
                    nome: profile.nome,
                    fotoPerfil: profile.fotoPerfil,
                },
            });
        }
        return {
            id: cliente.id,
            nome: cliente.nome,
            email: cliente.email,
            fotoPerfil: cliente.fotoPerfil,
            telefone: cliente.telefone,
            precisaOnboarding: !cliente.telefone,
        };
    }
    generateToken(cliente) {
        const payload = {
            sub: cliente.id,
            email: cliente.email,
        };
        return this.jwtService.sign(payload);
    }
    getCookieOptions() {
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        const domain = this.configService.get('COOKIE_DOMAIN');
        return {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            ...(domain && { domain }),
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map