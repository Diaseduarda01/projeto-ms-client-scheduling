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
exports.BookingController = void 0;
const common_1 = require("@nestjs/common");
const booking_service_1 = require("./booking.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const create_booking_dto_1 = require("./dto/create-booking.dto");
let BookingController = class BookingController {
    bookingService;
    constructor(bookingService) {
        this.bookingService = bookingService;
    }
    async createSession(slug, dto, req) {
        const user = req.user;
        return this.bookingService.createSession(slug, user, dto);
    }
    async getSession(sessionId, req) {
        const user = req.user;
        return this.bookingService.getSession(sessionId, user.id);
    }
    async confirmSession(slug, sessionId, req) {
        const user = req.user;
        return this.bookingService.confirmSession(sessionId, user.id, slug);
    }
};
exports.BookingController = BookingController;
__decorate([
    (0, common_1.Post)(':slug/sessao'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_booking_dto_1.CreateBookingDto, Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)(':slug/sessao/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getSession", null);
__decorate([
    (0, common_1.Post)(':slug/sessao/:sessionId/confirmar'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "confirmSession", null);
exports.BookingController = BookingController = __decorate([
    (0, common_1.Controller)('book'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [booking_service_1.BookingService])
], BookingController);
//# sourceMappingURL=booking.controller.js.map