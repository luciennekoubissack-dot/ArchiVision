import { Module } from '@nestjs/common';
import { EnqueteReponseController } from './enquete-reponse.controller';
import { EnqueteReponseService } from './enquete-reponse.service';
import { QuestionnaireController } from './questionnaire.controller';
import { QuestionnaireService } from './questionnaire.service';

@Module({
  controllers: [EnqueteReponseController, QuestionnaireController],
  providers: [EnqueteReponseService, QuestionnaireService],
})
export class EvaluationModule {}
