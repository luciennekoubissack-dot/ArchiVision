import { Module } from '@nestjs/common';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { ServiceViewService } from './service-view.service';

@Module({
  controllers: [ServiceController],
  providers: [ServiceService, ServiceViewService],
})
export class ServiceModule {}
