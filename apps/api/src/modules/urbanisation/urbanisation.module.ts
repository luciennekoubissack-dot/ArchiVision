import { Module } from '@nestjs/common';
import { UrbanisationController } from './urbanisation.controller';
import { UrbanisationService } from './urbanisation.service';
import { UrbanisationViewService } from './urbanisation-view.service';

@Module({
  controllers: [UrbanisationController],
  providers: [UrbanisationService, UrbanisationViewService],
  exports: [UrbanisationService],
})
export class UrbanisationModule {}
