import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationEntity } from './application.entity';

/**
 * Échange applicatif (diagramme de composants UML), tel que renvoyé par les endpoints
 * du sous-chemin `/applications-echanges`. Contrairement aux échanges imbriqués dans le
 * détail d'une application (qui ne référencent que l'autre côté par id/nom), la liste
 * complète des échanges renvoie l'application source et l'application cible en entier.
 */
export class EchangeEntity {
  @ApiProperty({ description: "Identifiant de l'échange." })
  id!: string;

  @ApiProperty({ description: "Identifiant de l'application source." })
  sourceId!: string;

  @ApiProperty({ description: "Identifiant de l'application cible." })
  targetId!: string;

  @ApiPropertyOptional({ description: "Description de l'échange.", nullable: true, type: String })
  description?: string | null;

  @ApiPropertyOptional({ description: "Protocole utilisé pour l'échange.", nullable: true, type: String })
  protocole?: string | null;

  @ApiProperty({ description: "Date de création de l'échange.", type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: () => ApplicationEntity, description: "Application source de l'échange." })
  source!: ApplicationEntity;

  @ApiProperty({ type: () => ApplicationEntity, description: "Application cible de l'échange." })
  target!: ApplicationEntity;
}
