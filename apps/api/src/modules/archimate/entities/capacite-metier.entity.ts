import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ElementArchimateEntity } from './element-archimate.entity';

/** Compteur des éléments rattachés à une capacité métier, tel que renvoyé par
 * le `_count` Prisma sur la liste des capacités. */
export class ElementCountEntity {
  @ApiProperty({ description: 'Nombre d\'éléments ArchiMate rattachés à cette capacité.' })
  elements!: number;
}

/** Capacité métier. Le champ `elements` n'est présent que sur le détail
 * (récupération par identifiant) ; le champ `_count` n'est présent que sur la
 * liste paginée. */
export class CapaciteMetierEntity {
  @ApiProperty({ description: 'Identifiant de la capacité métier.' })
  id!: string;

  @ApiProperty({ description: 'Nom de la capacité métier.' })
  nom!: string;

  @ApiPropertyOptional({ description: 'Description de la capacité métier.', nullable: true, type: String })
  description?: string | null;

  @ApiProperty({ description: "Identifiant de l'organisation propriétaire." })
  organisationId!: string;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière modification.', type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({
    type: () => ElementArchimateEntity,
    isArray: true,
    description: 'Éléments ArchiMate rattachés à cette capacité, triés par nom.',
  })
  elements?: ElementArchimateEntity[];

  @ApiPropertyOptional({ type: () => ElementCountEntity, description: 'Compteur des éléments rattachés à cette capacité.' })
  _count?: ElementCountEntity;
}
