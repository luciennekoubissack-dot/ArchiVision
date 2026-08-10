import { Module } from '@nestjs/common';
import { TechnologieController } from './technologie.controller';
import { TechnologieService } from './technologie.service';

@Module({
  controllers: [TechnologieController],
  providers: [TechnologieService],
})
export class TechnologieModule {}
