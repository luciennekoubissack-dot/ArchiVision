import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutElement, TypeTechComponent } from '@prisma/client';
import { TechDeploiementDetailEntity } from './tech-deploiement-detail.entity';

export class TechComponentEntity {
  @ApiProperty({ description: 'Identifiant du composant technologique.' })
  id!: string;

  @ApiProperty({ description: 'Nom du composant technologique.' })
  nom!: string;

  @ApiProperty({ enum: TypeTechComponent, description: 'Type du composant technologique.' })
  type!: TypeTechComponent;

  @ApiPropertyOptional({ description: 'Description du composant technologique.', nullable: true, type: String })
  description?: string | null;

  @ApiProperty({ enum: StatutElement, description: 'Statut du composant technologique.' })
  statut!: StatutElement;

  @ApiPropertyOptional({ description: 'Position horizontale sur le canevas.', nullable: true, type: Number })
  positionX?: number | null;

  @ApiPropertyOptional({ description: 'Position verticale sur le canevas.', nullable: true, type: Number })
  positionY?: number | null;

  @ApiProperty({ description: "Identifiant de l'organisation proprietaire." })
  organisationId!: string;

  @ApiProperty({ description: 'Date de creation.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de derniere mise a jour.', type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({
    description: 'Deploiements (applications deployees sur ce composant).',
    type: () => [TechDeploiementDetailEntity],
  })
  deploiements!: TechDeploiementDetailEntity[];
}
