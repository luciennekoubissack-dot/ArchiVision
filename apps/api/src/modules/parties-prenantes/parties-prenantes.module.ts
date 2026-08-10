import { Module } from '@nestjs/common';
import { PartiesPrenantesController } from './parties-prenantes.controller';
import { PartiesPrenantesService } from './parties-prenantes.service';

@Module({
  controllers: [PartiesPrenantesController],
  providers: [PartiesPrenantesService],
})
export class PartiesPrenantesModule {}
