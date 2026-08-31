import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Réponse à une enquête de satisfaction ou d'évaluation. */
export class EnqueteReponseEntity {
  @ApiProperty({ description: 'Identifiant de la réponse.' })
  id!: string;

  @ApiProperty({ description: 'Nom ou identifiant du répondant.' })
  repondant!: string;

  @ApiProperty({ description: 'Score attribué par le répondant, de 1 à 5.' })
  score!: number;

  @ApiPropertyOptional({ description: 'Commentaire libre du répondant.', nullable: true, type: String })
  commentaire?: string | null;

  @ApiProperty({ description: "Identifiant de l'organisation propriétaire." })
  organisationId!: string;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;
}
