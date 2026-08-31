import { ApiProperty } from '@nestjs/swagger';

/**
 * Deploiement d'une application sur un composant technique, tel que renvoye
 * par la creation d'un deploiement (sans l'application imbriquee).
 */
export class TechDeploiementEntity {
  @ApiProperty({ description: "Identifiant de l'application deployee." })
  applicationId!: string;

  @ApiProperty({ description: 'Identifiant du composant technologique cible.' })
  techComponentId!: string;
}
