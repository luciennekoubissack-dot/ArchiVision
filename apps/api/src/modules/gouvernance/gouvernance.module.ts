import { Module } from '@nestjs/common';
import { PolitiqueController } from './politique.controller';
import { PolitiqueService } from './politique.service';
import { ChangementController } from './changement.controller';
import { ChangementService } from './changement.service';
import { ConformiteController } from './conformite.controller';
import { ConformiteService } from './conformite.service';

@Module({
  controllers: [PolitiqueController, ChangementController, ConformiteController],
  providers: [PolitiqueService, ChangementService, ConformiteService],
})
export class GouvernanceModule {}
