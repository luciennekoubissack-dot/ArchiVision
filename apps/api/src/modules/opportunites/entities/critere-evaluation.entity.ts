import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CritereEvaluationEntity {
  @ApiProperty({ description: "Identifiant du critère d'évaluation." })
  id!: string;

  @ApiProperty({ description: "Nom du critère d'évaluation." })
  nom!: string;

  @ApiPropertyOptional({ description: "Description du critère d'évaluation.", nullable: true, type: String })
  description?: string | null;

  @ApiProperty({ description: "Identifiant de l'organisation propriétaire du critère." })
  organisationId!: string;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour.', type: String, format: 'date-time' })
  updatedAt!: Date;
}
