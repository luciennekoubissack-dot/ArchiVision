import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CritereEvaluationEntity } from './critere-evaluation.entity';

export class EvaluationScoreEntity {
  @ApiProperty({ description: "Identifiant du score d'évaluation." })
  id!: string;

  @ApiProperty({ description: 'Identifiant de la solution notée.' })
  solutionId!: string;

  @ApiProperty({ description: "Identifiant du critère d'évaluation noté." })
  critereId!: string;

  @ApiProperty({ description: 'Score attribué au critère.', minimum: 0, maximum: 5 })
  score!: number;

  @ApiPropertyOptional({ description: 'Commentaire associé au score.', nullable: true, type: String })
  commentaire?: string | null;

  @ApiPropertyOptional({
    description:
      "Critère d'évaluation associé, inclus uniquement lorsque le score est retourné dans le détail d'une solution.",
    type: () => CritereEvaluationEntity,
  })
  critere?: CritereEvaluationEntity;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour.', type: String, format: 'date-time' })
  updatedAt!: Date;
}
