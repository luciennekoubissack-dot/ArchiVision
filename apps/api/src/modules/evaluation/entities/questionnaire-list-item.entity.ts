import { ApiProperty } from '@nestjs/swagger';
import { QuestionnaireEntity } from './questionnaire.entity';

/** Compteur `_count` de Prisma pour un questionnaire. */
export class QuestionnaireCountEntity {
  @ApiProperty({ description: 'Nombre de questions du questionnaire.' })
  questions!: number;
}

/** Questionnaire tel que renvoyé dans la liste, avec le compteur de ses questions. */
export class QuestionnaireListItemEntity extends QuestionnaireEntity {
  @ApiProperty({ type: () => QuestionnaireCountEntity, description: 'Compteurs du questionnaire.' })
  _count!: QuestionnaireCountEntity;
}
