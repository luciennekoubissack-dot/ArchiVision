import { Module } from '@nestjs/common';
import { ArchimateController } from './archimate.controller';
import { ArchimateService } from './archimate.service';

@Module({
  controllers: [ArchimateController],
  providers: [ArchimateService],
  exports: [ArchimateService],
})
export class ArchimateModule {}
