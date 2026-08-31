import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleUtilisateur } from '@prisma/client';

/** Profil de l'utilisateur courant (`GET /auth/me`, `PATCH /auth/me`). */
export class MeEntity {
  @ApiProperty({ description: "Identifiant de l'utilisateur." })
  id!: string;

  @ApiProperty({ description: "Adresse e-mail de l'utilisateur." })
  email!: string;

  @ApiProperty({ description: "Nom de l'utilisateur." })
  nom!: string;

  @ApiPropertyOptional({ description: "URL de l'avatar de l'utilisateur.", nullable: true, type: String })
  avatarUrl?: string | null;

  @ApiProperty({ enum: RoleUtilisateur, description: "Rôle de l'utilisateur." })
  role!: RoleUtilisateur;

  @ApiProperty({ description: 'Date de création du compte.', type: String, format: 'date-time' })
  createdAt!: Date;
}
