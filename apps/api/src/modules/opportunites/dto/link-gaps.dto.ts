import { IsArray, IsEnum, IsNotEmpty, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DomaineEcart } from '@prisma/client';

export class GapLinkItemDto {
  @ApiProperty({ enum: DomaineEcart, description: "Domaine architectural de l'écart (Analyse des écarts)." })
  @IsEnum(DomaineEcart)
  domaine!: DomaineEcart;

  @ApiProperty({ description: "Identifiant de l'élément d'origine (objectif, élément ArchiMate, entité de données, application ou composant technologique selon le domaine)." })
  @IsString()
  @IsNotEmpty()
  elementId!: string;

  @ApiProperty({ description: "Nom de l'élément d'origine, recopié au moment du lien (pour affichage sans recharger sa source)." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  elementNom!: string;
}

export class LinkGapsDto {
  @ApiProperty({ type: () => [GapLinkItemDto], description: 'Liste complète des écarts adressés par cette solution (remplace la liste existante).' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GapLinkItemDto)
  items!: GapLinkItemDto[];
}
