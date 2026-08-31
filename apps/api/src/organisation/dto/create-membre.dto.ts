import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleUtilisateur } from '@prisma/client';

export class CreateMembreDto {
  @ApiProperty({ description: 'Adresse email du membre.' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Mot de passe, minimum 8 caractères.' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ description: 'Nom complet du membre.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiProperty({ enum: RoleUtilisateur, description: 'Rôle attribué au membre.' })
  @IsEnum(RoleUtilisateur)
  role!: RoleUtilisateur;

  @ApiPropertyOptional({ description: 'Identifiant du service auquel rattacher le membre.' })
  @IsUUID()
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Poste occupé par le membre.' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  poste?: string;

  @ApiPropertyOptional({ description: 'Coordonnées de contact du membre.' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  contact?: string;
}
