import { Module } from '@nestjs/common';
import { DonneesController } from './donnees.controller';
import { DonneesService } from './donnees.service';
import { DonneesLayoutService } from './donnees-layout.service';

@Module({
  controllers: [DonneesController],
  providers: [DonneesService, DonneesLayoutService],
})
export class DonneesModule {}
