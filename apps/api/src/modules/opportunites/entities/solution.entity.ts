import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvancementSolution, StatutSolution } from '@prisma/client';
import { EvaluationScoreEntity } from './evaluation-score.entity';
import { SolutionGapEntity } from './solution-gap.entity';

export class SolutionEntity {
  @ApiProperty({ description: 'Identifiant de la solution.' })
  id!: string;

  @ApiProperty({ description: 'Nom de la solution.' })
  nom!: string;

  @ApiPropertyOptional({ description: 'Description de la solution.', nullable: true, type: String })
  description?: string | null;

  @ApiProperty({ enum: StatutSolution, description: 'Statut de la solution.' })
  statut!: StatutSolution;

  @ApiPropertyOptional({ description: 'Plan de mise en oeuvre de la solution.', nullable: true, type: String })
  planMiseOeuvre?: string | null;

  @ApiProperty({ enum: AvancementSolution, description: "Avancement de la mise en oeuvre de la solution." })
  avancement!: AvancementSolution;

  @ApiPropertyOptional({ description: 'Commentaire de suivi de la solution.', nullable: true, type: String })
  commentaireSuivi?: string | null;

  @ApiProperty({ description: "Identifiant de l'organisation propriétaire de la solution." })
  organisationId!: string;

  @ApiProperty({
    type: () => [EvaluationScoreEntity],
    description:
      "Scores d'évaluation de la solution (le critère détaillé n'est inclus que pour le détail d'une solution).",
  })
  scores!: EvaluationScoreEntity[];

  @ApiProperty({
    type: () => [SolutionGapEntity],
    description: "Écarts (Analyse des écarts) que cette solution est censée combler.",
  })
  gaps!: SolutionGapEntity[];

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour.', type: String, format: 'date-time' })
  updatedAt!: Date;
}
