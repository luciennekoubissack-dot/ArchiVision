import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutElement } from '@prisma/client';

/** Référence légère vers un objectif, utilisée pour les liens AS-IS ↔ TO-BE (analyse des écarts). */
export class ObjectifRefEntity {
  @ApiProperty({ description: "Identifiant de l'objectif." })
  id!: string;

  @ApiProperty({ description: "Nom de l'objectif." })
  nom!: string;

  @ApiProperty({ enum: StatutElement, description: "Statut de l'objectif." })
  statut!: StatutElement;
}

/** Objectif stratégique d'une organisation. */
export class ObjectifEntity {
  @ApiProperty({ description: "Identifiant de l'objectif." })
  id!: string;

  @ApiProperty({ description: "Nom de l'objectif." })
  nom!: string;

  @ApiPropertyOptional({ description: "Description de l'objectif.", nullable: true, type: String })
  description?: string | null;

  @ApiPropertyOptional({ description: "Sous-objectif rattaché.", nullable: true, type: String })
  sousObjectif?: string | null;

  @ApiProperty({
    enum: StatutElement,
    description: "Statut de l'objectif pour l'analyse des écarts (AS_IS, TO_BE ou LES_DEUX).",
  })
  statut!: StatutElement;

  @ApiPropertyOptional({ description: "Identifiant de l'objectif AS-IS dont cet objectif TO-BE est l'évolution.", nullable: true, type: String })
  objectifAsIsId?: string | null;

  @ApiPropertyOptional({ type: () => ObjectifRefEntity, description: "Objectif AS-IS dont cet objectif TO-BE est l'évolution.", nullable: true })
  objectifAsIs?: ObjectifRefEntity | null;

  @ApiPropertyOptional({ type: () => [ObjectifRefEntity], description: "Objectifs TO-BE qui sont l'évolution de cet objectif AS-IS." })
  objectifsToBe?: ObjectifRefEntity[];

  @ApiProperty({ description: "Identifiant de l'organisation propriétaire." })
  organisationId!: string;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière modification.', type: String, format: 'date-time' })
  updatedAt!: Date;
}
