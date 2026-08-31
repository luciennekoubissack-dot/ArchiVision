import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Objectif stratégique d'une organisation. */
export class ObjectifEntity {
  @ApiProperty({ description: "Identifiant de l'objectif." })
  id!: string;

  @ApiProperty({ description: "Nom de l'objectif." })
  nom!: string;

  @ApiPropertyOptional({ description: "Description de l'objectif.", nullable: true, type: String })
  description?: string | null;

  @ApiPropertyOptional({ description: "Sous-objectif rattaché.", nullable: true, type: String })
  sousObjectif?: string | null;

  @ApiProperty({ description: "Identifiant de l'organisation propriétaire." })
  organisationId!: string;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière modification.', type: String, format: 'date-time' })
  updatedAt!: Date;
}
