import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ description: "Adresse e-mail du compte dont le mot de passe est oublié." })
  @IsEmail()
  email!: string;
}
