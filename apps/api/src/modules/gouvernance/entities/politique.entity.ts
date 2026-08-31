import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PolitiqueEntity {
  @ApiProperty({ description: 'Identifiant de la politique de gouvernance.' })
  id!: string;

  @ApiProperty({ description: 'Nom de la politique de gouvernance.' })
  nom!: string;

  @ApiPropertyOptional({ description: 'Description de la politique de gouvernance.', nullable: true, type: String })
  description?: string | null;

  @ApiProperty({ description: "Identifiant de l'organisation propriétaire de la politique." })
  organisationId!: string;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour.', type: String, format: 'date-time' })
  updatedAt!: Date;
}
