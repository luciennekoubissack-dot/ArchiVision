import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleUtilisateur, StatutInvitation } from '@prisma/client';

/** Invitation telle que renvoyée à l'ADMINISTRATEUR : jamais le `tokenHash`,
 * qui ne sert qu'à valider le lien reçu par e-mail. */
export class InvitationEntity {
  @ApiProperty({ description: "Identifiant de l'invitation." })
  id!: string;

  @ApiProperty({ description: "Adresse e-mail invitée." })
  email!: string;

  @ApiProperty({ enum: RoleUtilisateur, description: "Rôle attribué à l'acceptation." })
  role!: RoleUtilisateur;

  @ApiProperty({ enum: StatutInvitation, description: "Statut de l'invitation." })
  statut!: StatutInvitation;

  @ApiPropertyOptional({ description: "Service de rattachement prévu.", nullable: true, type: String })
  serviceId?: string | null;

  @ApiPropertyOptional({ description: "Poste prévu.", nullable: true, type: String })
  poste?: string | null;

  @ApiPropertyOptional({ description: "Contact prévu.", nullable: true, type: String })
  contact?: string | null;

  @ApiPropertyOptional({ description: "Nom de l'administrateur qui a envoyé l'invitation.", nullable: true, type: String })
  invitedByNom?: string | null;

  @ApiProperty({ description: "Date d'expiration du lien.", type: String, format: 'date-time' })
  expiresAt!: Date;

  @ApiProperty({ description: "Date de création de l'invitation.", type: String, format: 'date-time' })
  createdAt!: Date;
}
