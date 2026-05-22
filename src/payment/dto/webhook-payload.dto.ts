import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class WebhookPayloadDto {
  @IsString()
  @IsNotEmpty()
  cobrancaId: string;

  @IsString()
  @IsIn(['PAID', 'EXPIRED', 'CANCELLED'])
  status: 'PAID' | 'EXPIRED' | 'CANCELLED';

  @IsString()
  @IsNotEmpty()
  pixEndToEndId: string;
}
