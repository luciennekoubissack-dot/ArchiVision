import { ApiProperty } from '@nestjs/swagger';
import { TechDeploiementEntity } from './tech-deploiement.entity';
import { ApplicationRefEntity } from './application-ref.entity';

/** Deploiement avec l'application imbriquee, tel que renvoye dans la liste des deploiements d'un composant technologique. */
export class TechDeploiementDetailEntity extends TechDeploiementEntity {
  @ApiProperty({ description: 'Application deployee.', type: () => ApplicationRefEntity })
  application!: ApplicationRefEntity;
}
