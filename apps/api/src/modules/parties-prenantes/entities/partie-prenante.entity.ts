import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PartiePrenanteEntity {
  @ApiProperty({ description: "Identifiant de la partie prenante." })
  id!: string;

  @ApiProperty({ description: "Nom de la partie prenante." })
  nom!: string;

  @ApiPropertyOptional({ description: "Rôle de la partie prenante.", nullable: true, type: String })
  role?: string | null;

  @ApiProperty({ description: "Identifiant de l'organisation propriétaire de la partie prenante." })
  organisationId!: string;

  @ApiProperty({ description: "Date de création de la partie prenante.", type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: "Date de dernière modification de la partie prenante.", type: String, format: 'date-time' })
  updatedAt!: Date;
}
