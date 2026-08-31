import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutChangement } from '@prisma/client';

export class DemandeChangementEntity {
  @ApiProperty({ description: 'Identifiant de la demande de changement.' })
  id!: string;

  @ApiProperty({ description: 'Titre de la demande de changement.' })
  titre!: string;

  @ApiPropertyOptional({ description: 'Description de la demande de changement.', nullable: true, type: String })
  description?: string | null;

  @ApiProperty({ enum: StatutChangement, description: 'Statut de la demande de changement.' })
  statut!: StatutChangement;

  @ApiProperty({ description: "Identifiant de l'organisation propriétaire de la demande." })
  organisationId!: string;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour.', type: String, format: 'date-time' })
  updatedAt!: Date;
}

export class ChangementStatsEntity {
  @ApiProperty({ description: "Nombre total de demandes de changement de l'organisation." })
  total!: number;

  @ApiProperty({ description: 'Nombre de demandes en cours (statut Proposé ou Approuvé).' })
  enCours!: number;
}
