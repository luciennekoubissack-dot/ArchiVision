import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategorieExigence, StatutElement, TypeElement, TypeRelation } from '@prisma/client';

/** Référence minimale vers un élément ArchiMate (id, nom, type), utilisée quand
 * un endpoint inclut un élément lié sans renvoyer l'objet complet. */
export class ElementRefEntity {
  @ApiProperty({ description: "Identifiant de l'élément ArchiMate." })
  id!: string;

  @ApiProperty({ description: "Nom de l'élément ArchiMate." })
  nom!: string;

  @ApiProperty({ enum: TypeElement, description: "Type de l'élément ArchiMate." })
  type!: TypeElement;
}

/** Référence minimale vers une capacité métier (id, nom). */
export class CapaciteRefEntity {
  @ApiProperty({ description: 'Identifiant de la capacité métier.' })
  id!: string;

  @ApiProperty({ description: 'Nom de la capacité métier.' })
  nom!: string;
}

/** Compteur des relations d'un élément ArchiMate, tel que renvoyé par le
 * `_count` Prisma sur la liste des éléments. */
export class RelationCountEntity {
  @ApiProperty({ description: "Nombre de relations où l'élément est la source." })
  relationsSource!: number;

  @ApiProperty({ description: "Nombre de relations où l'élément est la cible." })
  relationsTarget!: number;
}

/** Relation où l'élément courant est la source : seule la cible est incluse
 * (la source correspond à l'élément lui-même). */
export class RelationSourceEntity {
  @ApiProperty({ description: 'Identifiant de la relation.' })
  id!: string;

  @ApiProperty({ enum: TypeRelation, description: 'Type de la relation ArchiMate.' })
  type!: TypeRelation;

  @ApiProperty({ description: "Identifiant de l'élément source." })
  sourceId!: string;

  @ApiProperty({ description: "Identifiant de l'élément cible." })
  targetId!: string;

  @ApiProperty({ description: 'Date de création de la relation.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: () => ElementRefEntity, description: 'Élément cible de la relation.' })
  target!: ElementRefEntity;
}

/** Relation où l'élément courant est la cible : seule la source est incluse
 * (la cible correspond à l'élément lui-même). */
export class RelationTargetEntity {
  @ApiProperty({ description: 'Identifiant de la relation.' })
  id!: string;

  @ApiProperty({ enum: TypeRelation, description: 'Type de la relation ArchiMate.' })
  type!: TypeRelation;

  @ApiProperty({ description: "Identifiant de l'élément source." })
  sourceId!: string;

  @ApiProperty({ description: "Identifiant de l'élément cible." })
  targetId!: string;

  @ApiProperty({ description: 'Date de création de la relation.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: () => ElementRefEntity, description: 'Élément source de la relation.' })
  source!: ElementRefEntity;
}

/** Élément ArchiMate (couche Motivation ou Métier). Les champs `capacite`,
 * `_count`, `relationsSource` et `relationsTarget` ne sont présents que sur
 * les endpoints qui les incluent explicitement (liste ou détail). */
export class ElementArchimateEntity {
  @ApiProperty({ description: "Identifiant de l'élément ArchiMate." })
  id!: string;

  @ApiProperty({ description: "Nom de l'élément ArchiMate." })
  nom!: string;

  @ApiProperty({ enum: TypeElement, description: "Type de l'élément ArchiMate." })
  type!: TypeElement;

  @ApiPropertyOptional({ description: "Description de l'élément ArchiMate.", nullable: true, type: String })
  description?: string | null;

  @ApiPropertyOptional({
    enum: CategorieExigence,
    description: "Sous-catégorie de l'exigence, pertinente uniquement quand type = EXIGENCE.",
    nullable: true,
  })
  categorieExigence?: CategorieExigence | null;

  @ApiProperty({ enum: StatutElement, description: "Statut de l'élément (AS_IS, TO_BE ou LES_DEUX)." })
  statut!: StatutElement;

  @ApiPropertyOptional({ description: 'Position horizontale manuelle sur le canevas.', nullable: true, type: Number })
  positionX?: number | null;

  @ApiPropertyOptional({ description: 'Position verticale manuelle sur le canevas.', nullable: true, type: Number })
  positionY?: number | null;

  @ApiPropertyOptional({ description: 'Largeur manuelle sur le canevas.', nullable: true, type: Number })
  width?: number | null;

  @ApiPropertyOptional({ description: 'Hauteur manuelle sur le canevas.', nullable: true, type: Number })
  height?: number | null;

  @ApiProperty({ description: "Identifiant de l'organisation propriétaire." })
  organisationId!: string;

  @ApiPropertyOptional({ description: 'Identifiant de la capacité métier associée.', nullable: true, type: String })
  capaciteMetierId?: string | null;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière modification.', type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: () => CapaciteRefEntity, description: 'Capacité métier associée à cet élément.', nullable: true })
  capacite?: CapaciteRefEntity | null;

  @ApiPropertyOptional({ type: () => RelationCountEntity, description: "Compteur des relations de l'élément." })
  _count?: RelationCountEntity;

  @ApiPropertyOptional({ type: () => RelationSourceEntity, isArray: true, description: "Relations où cet élément est la source." })
  relationsSource?: RelationSourceEntity[];

  @ApiPropertyOptional({ type: () => RelationTargetEntity, isArray: true, description: "Relations où cet élément est la cible." })
  relationsTarget?: RelationTargetEntity[];
}
