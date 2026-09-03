import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleUtilisateur } from '@prisma/client';

/** Rôles qu'un ADMINISTRATEUR peut attribuer à un membre de son organisation
 * (SUPERADMIN exclu : c'est un rôle plateforme, jamais rattaché à un tenant). */
const ROLES_ATTRIBUABLES = [RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE];

export class CreateInvitationDto {
  @ApiProperty({ description: "Adresse e-mail de la personne invitée." })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ROLES_ATTRIBUABLES, description: "Rôle attribué à la personne une fois l'invitation acceptée." })
  @IsIn(ROLES_ATTRIBUABLES)
  role!: 'ADMINISTRATEUR' | 'ARCHITECTE';

  @ApiPropertyOptional({ description: "Identifiant du service auquel rattacher le futur membre." })
  @IsUUID()
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({ description: "Poste occupé par le futur membre." })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  poste?: string;

  @ApiPropertyOptional({ description: "Coordonnées de contact du futur membre." })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  contact?: string;
}
