import { Module } from '@nestjs/common';
import { ArchimateController } from './archimate.controller';
import { ArchimateService } from './archimate.service';
import { ArchimateViewService } from './archimate-view.service';
import { ArchimateLayoutService } from './archimate-layout.service';

@Module({
  controllers: [ArchimateController],
  providers: [ArchimateService, ArchimateViewService, ArchimateLayoutService],
  exports: [ArchimateService],
})
export class ArchimateModule {}
