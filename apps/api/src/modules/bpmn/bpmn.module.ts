import { Module } from '@nestjs/common';
import { BpmnController } from './bpmn.controller';
import { BpmnService } from './bpmn.service';
import { BpmnViewService } from './bpmn-view.service';

@Module({
  controllers: [BpmnController],
  providers: [BpmnService, BpmnViewService],
})
export class BpmnModule {}
