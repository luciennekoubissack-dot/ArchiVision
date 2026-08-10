import { Module } from '@nestjs/common';
import { DonneesController } from './donnees.controller';
import { DonneesService } from './donnees.service';

@Module({
  controllers: [DonneesController],
  providers: [DonneesService],
})
export class DonneesModule {}
