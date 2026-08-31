import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TypeElement, TypeTechComponent } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/// Éléments optionnels que l'assistant d'inscription peut pré-remplir pour une
/// organisation (étapes 2 à 7). Formes reprises des DTO de création de chaque
/// module (objectif, parties-prenantes, bpmn, archimate, donnees, urbanisation,
/// technologie) — pas de position/relations ici, ce sera édité plus tard dans
/// les vrais modules.

export class ObjectifItemDto {
  @ApiProperty({ description: 'Nom de l\'objectif.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: 'Description de l\'objectif.' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}

export class PartiePrenanteItemDto {
  @ApiProperty({ description: 'Nom de la partie prenante.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: 'Rôle de la partie prenante.' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  role?: string;
}

export class BpmnProcessusItemDto {
  @ApiProperty({ description: 'Nom du processus BPMN.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: 'Description du processus BPMN.' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}

export class CapaciteItemDto {
  @ApiProperty({ description: 'Nom de la capacité métier.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: 'Description de la capacité métier.' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}

/// `type` restreint à ACTEUR_METIER (postes) ou ROLE_METIER (fonctions) côté
/// assistant d'inscription — les 3 autres valeurs de TypeElement ne font pas
/// sens avant que l'organisation n'ait de processus/services modélisés.
export class ActeurItemDto {
  @ApiProperty({ description: 'Nom de l\'acteur.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiProperty({ enum: TypeElement, description: 'Type de l\'acteur, limité à ACTEUR_METIER ou ROLE_METIER.' })
  @IsEnum(TypeElement)
  type!: TypeElement;
}

export class DataEntityItemDto {
  @ApiProperty({ description: 'Nom de l\'entité de données.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: 'Description de l\'entité de données.' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}

export class ApplicationItemDto {
  @ApiProperty({ description: 'Nom de l\'application.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: 'Description de l\'application.' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}

export class TechComponentItemDto {
  @ApiProperty({ description: 'Nom du composant technologique.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiProperty({ enum: TypeTechComponent, description: 'Type du composant technologique.' })
  @IsEnum(TypeTechComponent)
  type!: TypeTechComponent;

  @ApiPropertyOptional({ description: 'Description du composant technologique.' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}
