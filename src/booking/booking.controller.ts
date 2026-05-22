import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { BookingService } from './booking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('book')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @Post(':slug/sessao')
  async createSession(
    @Param('slug') slug: string,
    @Body() dto: CreateBookingDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.bookingService.createSession(slug, user, dto);
  }

  @Get(':slug/sessao/:sessionId')
  async getSession(
    @Param('sessionId') sessionId: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.bookingService.getSession(sessionId, user.id);
  }

  @Post(':slug/sessao/:sessionId/confirmar')
  async confirmSession(
    @Param('slug') slug: string,
    @Param('sessionId') sessionId: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.bookingService.confirmSession(sessionId, user.id, slug);
  }
}
