import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeFluxArchiApplicative } from '@prisma/client';
import { ArchiApplicativeElementEntity } from './archi-applicative-element.entity';

/** Flux entre deux éléments d'architecture applicative, tel que renvoyé à la
 * création ou à la suppression (sans les éléments source et cible complets). */
export class ArchiApplicativeFluxEntity {
  @ApiProperty({ description: 'Identifiant du flux.' })
  id!: string;

  @ApiProperty({ description: "Identifiant de l'élément source du flux." })
  sourceId!: string;

  @ApiProperty({ description: "Identifiant de l'élément cible du flux." })
  targetId!: string;

  @ApiProperty({ enum: TypeFluxArchiApplicative, description: 'Type du flux entre les deux éléments.' })
  type!: TypeFluxArchiApplicative;

  @ApiPropertyOptional({ description: 'Libellé affiché sur le flux.', nullable: true, type: String })
  label?: string | null;

  @ApiProperty({ description: 'Date de création du flux.', type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Flux avec les éléments source et cible complets, tel que renvoyé par la
 * liste des flux de l'organisation. */
export class ArchiApplicativeFluxWithElementsEntity extends ArchiApplicativeFluxEntity {
  @ApiProperty({ type: () => ArchiApplicativeElementEntity, description: 'Élément source du flux.' })
  source!: ArchiApplicativeElementEntity;

  @ApiProperty({ type: () => ArchiApplicativeElementEntity, description: 'Élément cible du flux.' })
  target!: ArchiApplicativeElementEntity;
}
