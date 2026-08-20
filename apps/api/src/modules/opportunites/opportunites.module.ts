import { Module } from '@nestjs/common';
import { SolutionController } from './solution.controller';
import { SolutionService } from './solution.service';
import { CritereEvaluationController } from './critere-evaluation.controller';
import { CritereEvaluationService } from './critere-evaluation.service';

@Module({
  controllers: [SolutionController, CritereEvaluationController],
  providers: [SolutionService, CritereEvaluationService],
})
export class OpportunitesModule {}
