import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Canevas de vision stratégique de l'organisation (façon Business Model Canvas). */
export class VisionCanvasEntity {
  @ApiProperty({ description: 'Identifiant du vision canvas.' })
  id!: string;

  @ApiProperty({ description: "Identifiant de l'organisation propriétaire." })
  organisationId!: string;

  @ApiPropertyOptional({ description: 'Groupe cible du produit.', nullable: true, type: String })
  targetGroup?: string | null;

  @ApiPropertyOptional({ description: 'Besoins adressés par le produit.', nullable: true, type: String })
  needs?: string | null;

  @ApiPropertyOptional({ description: 'Description du produit.', nullable: true, type: String })
  product?: string | null;

  @ApiPropertyOptional({ description: 'Objectifs métier visés par le produit.', nullable: true, type: String })
  businessGoals?: string | null;

  @ApiPropertyOptional({ description: 'Concurrents identifiés.', nullable: true, type: String })
  competitors?: string | null;

  @ApiPropertyOptional({ description: 'Sources de revenus envisagées.', nullable: true, type: String })
  revenueStreams?: string | null;

  @ApiPropertyOptional({ description: 'Facteurs de coût associés.', nullable: true, type: String })
  costFactors?: string | null;

  @ApiPropertyOptional({ description: 'Canaux de distribution ou de communication.', nullable: true, type: String })
  channels?: string | null;

  @ApiProperty({ description: 'Date de dernière mise à jour.', type: String, format: 'date-time' })
  updatedAt!: Date;
}
