import { ApiProperty } from '@nestjs/swagger';
import { QuestionnaireEntity } from './questionnaire.entity';
import { QuestionEntity } from './question.entity';

/** Questionnaire avec la liste ordonnée de ses questions. */
export class QuestionnaireDetailEntity extends QuestionnaireEntity {
  @ApiProperty({ type: () => [QuestionEntity], description: 'Questions du questionnaire, triées par `ordre`.' })
  questions!: QuestionEntity[];
}
