import { Module } from '@nestjs/common';
import { TechnologieController } from './technologie.controller';
import { TechnologieService } from './technologie.service';
import { TechnologieLayoutService } from './technologie-layout.service';

@Module({
  controllers: [TechnologieController],
  providers: [TechnologieService, TechnologieLayoutService],
})
export class TechnologieModule {}
