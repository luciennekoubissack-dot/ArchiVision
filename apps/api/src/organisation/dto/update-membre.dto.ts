import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RoleUtilisateur } from '@prisma/client';

export class UpdateMembreDto {
  @ApiPropertyOptional({ enum: RoleUtilisateur, description: 'Rôle attribué au membre.' })
  @IsEnum(RoleUtilisateur)
  @IsOptional()
  role?: RoleUtilisateur;

  @ApiPropertyOptional({ description: 'Identifiant du service auquel rattacher le membre, ou null pour le détacher.', type: String, nullable: true })
  @IsUUID()
  @IsOptional()
  serviceId?: string | null;

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
