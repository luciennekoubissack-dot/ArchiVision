import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeQuestion } from '@prisma/client';

/** Une question d'un questionnaire d'évaluation. */
export class QuestionEntity {
  @ApiProperty({ description: 'Identifiant de la question.' })
  id!: string;

  @ApiProperty({ description: 'Intitulé de la question.' })
  intitule!: string;

  @ApiProperty({ enum: TypeQuestion, description: 'Nature de la question.' })
  type!: TypeQuestion;

  @ApiProperty({ type: [String], description: 'Choix proposés (CHOIX_MULTIPLE) ; tableau vide sinon.' })
  options!: string[];

  @ApiPropertyOptional({ description: 'Borne haute de la note (NOTE_MAX) ; null sinon.', nullable: true, type: Number })
  noteMax?: number | null;

  @ApiProperty({ description: 'Position de la question dans le questionnaire (0 = première).' })
  ordre!: number;
}
