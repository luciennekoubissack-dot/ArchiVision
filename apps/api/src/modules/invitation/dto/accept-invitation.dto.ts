import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({ description: "Jeton reçu dans le lien d'invitation." })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ description: "Nom complet du nouveau membre." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiProperty({ description: "Mot de passe choisi, 8 caractères minimum." })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
