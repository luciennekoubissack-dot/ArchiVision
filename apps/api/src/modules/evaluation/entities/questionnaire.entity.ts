import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Questionnaire d'évaluation, sans ses questions (create/update/delete, liste). */
export class QuestionnaireEntity {
  @ApiProperty({ description: 'Identifiant du questionnaire.' })
  id!: string;

  @ApiProperty({ description: 'Titre du questionnaire.' })
  titre!: string;

  @ApiPropertyOptional({ description: 'Description ou consignes.', nullable: true, type: String })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'URL du fichier de réponses téléversé, servi sous /uploads ; null si aucun.',
    nullable: true,
    type: String,
  })
  reponseFichierUrl?: string | null;

  @ApiPropertyOptional({
    description: "Nom d'origine du fichier de réponses téléversé ; null si aucun.",
    nullable: true,
    type: String,
  })
  reponseFichierNom?: string | null;

  @ApiProperty({ description: "Identifiant de l'organisation propriétaire." })
  organisationId!: string;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour.', type: String, format: 'date-time' })
  updatedAt!: Date;
}
