import { Module } from '@nestjs/common';
import { BpmnController } from './bpmn.controller';
import { BpmnService } from './bpmn.service';

@Module({
  controllers: [BpmnController],
  providers: [BpmnService],
})
export class BpmnModule {}
