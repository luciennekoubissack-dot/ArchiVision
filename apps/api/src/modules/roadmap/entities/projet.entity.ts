import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrioriteProjet, StatutProjet } from '@prisma/client';

export class ProjetEntity {
  @ApiProperty({ description: 'Identifiant du projet.' })
  id!: string;

  @ApiProperty({ description: 'Nom du projet.' })
  nom!: string;

  @ApiPropertyOptional({ description: 'Description du projet.', nullable: true, type: String })
  description?: string | null;

  @ApiProperty({ enum: PrioriteProjet, description: 'Priorite du projet.' })
  priorite!: PrioriteProjet;

  @ApiPropertyOptional({ description: 'Cout estime du projet.', nullable: true, type: String })
  coutEstime?: string | null;

  @ApiPropertyOptional({ description: 'Date de debut du projet.', type: String, format: 'date', nullable: true })
  dateDebut?: Date | null;

  @ApiPropertyOptional({ description: 'Date de fin du projet.', type: String, format: 'date', nullable: true })
  dateFin?: Date | null;

  @ApiProperty({ enum: StatutProjet, description: 'Statut du projet.' })
  statut!: StatutProjet;

  @ApiProperty({ description: "Identifiant de l'organisation proprietaire." })
  organisationId!: string;

  @ApiProperty({ description: 'Date de creation.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de derniere mise a jour.', type: String, format: 'date-time' })
  updatedAt!: Date;
}
