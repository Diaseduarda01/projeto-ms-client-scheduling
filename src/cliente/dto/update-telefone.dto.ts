import { IsString, Matches, IsNotEmpty } from 'class-validator';

export class UpdateTelefoneDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,11}$/, {
    message: 'Telefone deve conter 10 ou 11 dígitos numéricos',
  })
  telefone: string;
}
