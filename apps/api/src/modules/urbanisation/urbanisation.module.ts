import { Module } from '@nestjs/common';
import { UrbanisationController } from './urbanisation.controller';
import { UrbanisationService } from './urbanisation.service';
import { UrbanisationViewService } from './urbanisation-view.service';
import { ApplicationsLayoutService } from './applications-layout.service';

@Module({
  controllers: [UrbanisationController],
  providers: [UrbanisationService, UrbanisationViewService, ApplicationsLayoutService],
  exports: [UrbanisationService],
})
export class UrbanisationModule {}
