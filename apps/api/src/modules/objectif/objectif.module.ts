import { Module } from '@nestjs/common';
import { ObjectifController } from './objectif.controller';
import { ObjectifService } from './objectif.service';

@Module({
  controllers: [ObjectifController],
  providers: [ObjectifService],
})
export class ObjectifModule {}
