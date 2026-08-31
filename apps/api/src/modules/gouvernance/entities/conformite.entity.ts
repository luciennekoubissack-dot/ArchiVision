import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutConformite } from '@prisma/client';

/** Référence minimale vers une politique, telle que sélectionnée dans la matrice de conformité. */
export class PolitiqueRefEntity {
  @ApiProperty({ description: 'Identifiant de la politique de gouvernance.' })
  id!: string;

  @ApiProperty({ description: 'Nom de la politique de gouvernance.' })
  nom!: string;
}

/** Référence minimale vers une solution, telle que sélectionnée dans la matrice de conformité. */
export class SolutionRefEntity {
  @ApiProperty({ description: 'Identifiant de la solution.' })
  id!: string;

  @ApiProperty({ description: 'Nom de la solution.' })
  nom!: string;
}

/**
 * Ligne de la matrice de conformité pour une solution donnée : retournée par
 * les endpoints déjà positionnés sur une solution (GET et PATCH d'une
 * solution précise), elle n'inclut donc que la politique associée.
 */
export class ConformiteBySolutionEntity {
  @ApiProperty({ description: 'Identifiant de la conformité.' })
  id!: string;

  @ApiProperty({ description: 'Identifiant de la solution évaluée.' })
  solutionId!: string;

  @ApiProperty({ description: 'Identifiant de la politique de gouvernance évaluée.' })
  politiqueId!: string;

  @ApiProperty({ enum: StatutConformite, description: 'Statut de conformité à la politique.' })
  statut!: StatutConformite;

  @ApiPropertyOptional({ description: 'Commentaire associé au statut de conformité.', nullable: true, type: String })
  commentaire?: string | null;

  @ApiProperty({ type: () => PolitiqueRefEntity, description: 'Politique de gouvernance évaluée.' })
  politique!: PolitiqueRefEntity;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour.', type: String, format: 'date-time' })
  updatedAt!: Date;
}

/**
 * Ligne de la matrice de conformité toutes solutions confondues (endpoint de
 * listing global) : inclut à la fois la solution et la politique associées.
 */
export class ConformiteEntity {
  @ApiProperty({ description: 'Identifiant de la conformité.' })
  id!: string;

  @ApiProperty({ description: 'Identifiant de la solution évaluée.' })
  solutionId!: string;

  @ApiProperty({ description: 'Identifiant de la politique de gouvernance évaluée.' })
  politiqueId!: string;

  @ApiProperty({ enum: StatutConformite, description: 'Statut de conformité à la politique.' })
  statut!: StatutConformite;

  @ApiPropertyOptional({ description: 'Commentaire associé au statut de conformité.', nullable: true, type: String })
  commentaire?: string | null;

  @ApiProperty({ type: () => SolutionRefEntity, description: 'Solution évaluée.' })
  solution!: SolutionRefEntity;

  @ApiProperty({ type: () => PolitiqueRefEntity, description: 'Politique de gouvernance évaluée.' })
  politique!: PolitiqueRefEntity;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour.', type: String, format: 'date-time' })
  updatedAt!: Date;
}
