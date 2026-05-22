import {
  Controller,
  Post,
  Param,
  Body,
  Headers,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

@Controller()
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('book/:slug/sessao/:sessionId/pix')
  @UseGuards(JwtAuthGuard)
  async generatePix(
    @Param('sessionId') sessionId: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.paymentService.generatePix(sessionId, user.id);
  }

  @Post('webhook/pagamento')
  async handleWebhook(
    @Body() payload: WebhookPayloadDto,
    @Headers('x-abacatepay-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody?.toString() || JSON.stringify(payload);
    return this.paymentService.processWebhook(
      payload.cobrancaId,
      payload.status,
      signature,
      rawBody,
    );
  }
}
