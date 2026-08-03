import { Module } from '@nestjs/common';
import { UrbanisationController } from './urbanisation.controller';
import { UrbanisationService } from './urbanisation.service';

@Module({
  controllers: [UrbanisationController],
  providers: [UrbanisationService],
  exports: [UrbanisationService],
})
export class UrbanisationModule {}
