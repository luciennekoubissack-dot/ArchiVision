import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: "Jeton reçu dans le lien de réinitialisation." })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ description: "Nouveau mot de passe, 8 caractères minimum." })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
