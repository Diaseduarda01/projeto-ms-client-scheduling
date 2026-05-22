import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  servicoId: string;

  @IsString()
  @IsOptional()
  funcionarioId?: string;

  @IsDateString()
  @IsNotEmpty()
  dataHoraInicio: string;
}
