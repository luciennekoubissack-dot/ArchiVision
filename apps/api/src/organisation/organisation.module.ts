import { Module } from '@nestjs/common';
import { OrganisationController } from './organisation.controller';
import { OrganisationService } from './organisation.service';
import { MembresController } from './membres.controller';
import { MembresService } from './membres.service';
import { CompletudService } from './completude.service';

@Module({
  controllers: [OrganisationController, MembresController],
  providers: [OrganisationService, MembresService, CompletudService],
})
export class OrganisationModule {}
