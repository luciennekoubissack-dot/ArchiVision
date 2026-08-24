import { Module } from '@nestjs/common';
import { EnqueteReponseController } from './enquete-reponse.controller';
import { EnqueteReponseService } from './enquete-reponse.service';

@Module({
  controllers: [EnqueteReponseController],
  providers: [EnqueteReponseService],
})
export class EvaluationModule {}
