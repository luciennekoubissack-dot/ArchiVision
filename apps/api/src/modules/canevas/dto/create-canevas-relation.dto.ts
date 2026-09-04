import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ElementKind, TypeRelation } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCanevasRelationDto {
  @ApiProperty({ enum: TypeRelation, description: 'Type de relation entre les deux éléments du canevas.' })
  @IsEnum(TypeRelation)
  type!: TypeRelation;

  @ApiPropertyOptional({ description: 'Annotation libre (ex. type de lien réseau pour le diagramme de déploiement : "VPN", "HTTPS", "Fibre"…).' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({ enum: ElementKind, description: "Nature de l'élément source (type de brique du canevas)." })
  @IsEnum(ElementKind)
  sourceKind!: ElementKind;

  @ApiProperty({ description: "Identifiant de l'élément source." })
  @IsString()
  @IsNotEmpty()
  sourceId!: string;

  @ApiProperty({ enum: ElementKind, description: "Nature de l'élément cible (type de brique du canevas)." })
  @IsEnum(ElementKind)
  targetKind!: ElementKind;

  @ApiProperty({ description: "Identifiant de l'élément cible." })
  @IsString()
  @IsNotEmpty()
  targetId!: string;
}
