import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ClienteService } from './cliente.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateTelefoneDto } from './dto/update-telefone.dto';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClienteController {
  constructor(private clienteService: ClienteService) {}

  @Get('me')
  async getProfile(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    const cliente = await this.clienteService.findById(user.id);

    return {
      ...cliente,
      precisaOnboarding: !cliente.telefone,
    };
  }

  @Patch('me/telefone')
  async updateTelefone(
    @Req() req: Request,
    @Body() dto: UpdateTelefoneDto,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.clienteService.updateTelefone(user.id, dto.telefone);
  }

  @Get('me/agendamentos')
  async getAgendamentos(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.clienteService.getAgendamentos(user.id);
  }
}
