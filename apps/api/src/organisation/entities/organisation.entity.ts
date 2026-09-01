import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutOrganisation } from '@prisma/client';

/** Profil de l'organisation, tel que renvoyé par la consultation et la mise à
 * jour de l'organisation courante (sans les relations). */
export class OrganisationEntity {
  @ApiProperty({ description: "Identifiant de l'organisation." })
  id!: string;

  @ApiProperty({ description: "Nom de l'organisation." })
  nom!: string;

  @ApiPropertyOptional({ description: "Description de l'organisation.", nullable: true, type: String })
  description?: string | null;

  @ApiPropertyOptional({ description: "URL du logo de l'organisation.", nullable: true, type: String })
  logoUrl?: string | null;

  @ApiPropertyOptional({ description: "Secteur d'activité de l'organisation.", nullable: true, type: String })
  secteur?: string | null;

  @ApiPropertyOptional({ description: "Taille de l'organisation.", nullable: true, type: String })
  taille?: string | null;

  @ApiPropertyOptional({ description: "Pays de l'organisation.", nullable: true, type: String })
  pays?: string | null;

  @ApiPropertyOptional({ description: "Ville du siège social de l'organisation.", nullable: true, type: String })
  ville?: string | null;

  @ApiProperty({ enum: StatutOrganisation, description: "Statut de validation de l'organisation." })
  statut!: StatutOrganisation;

  @ApiPropertyOptional({ description: "Vision stratégique de l'organisation.", nullable: true, type: String })
  vision?: string | null;

  @ApiPropertyOptional({ description: "Problèmes que l'organisation cherche à résoudre.", nullable: true, type: String })
  problemesResoudre?: string | null;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière modification.', type: String, format: 'date-time' })
  updatedAt!: Date;
}
