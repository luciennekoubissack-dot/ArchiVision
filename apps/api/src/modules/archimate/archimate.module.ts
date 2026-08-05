import { Module } from '@nestjs/common';
import { ArchimateController } from './archimate.controller';
import { ArchimateService } from './archimate.service';
import { ArchimateViewService } from './archimate-view.service';

@Module({
  controllers: [ArchimateController],
  providers: [ArchimateService, ArchimateViewService],
  exports: [ArchimateService],
})
export class ArchimateModule {}
