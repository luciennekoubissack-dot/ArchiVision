import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Criticite, TypeElement, TypeTechComponent } from '@prisma/client';

/// Éléments optionnels que l'assistant d'inscription peut pré-remplir pour une
/// organisation (étapes 2 à 7). Formes reprises des DTO de création de chaque
/// module (objectif, parties-prenantes, bpmn, archimate, donnees, urbanisation,
/// technologie) — pas de position/relations ici, ce sera édité plus tard dans
/// les vrais modules.

export class ObjectifItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}

export class PartiePrenanteItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  role?: string;
}

export class BpmnProcessusItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}

export class CapaciteItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}

/// `type` restreint à ACTEUR_METIER (postes) ou ROLE_METIER (fonctions) côté
/// assistant d'inscription — les 3 autres valeurs de TypeElement ne font pas
/// sens avant que l'organisation n'ait de processus/services modélisés.
export class ActeurItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsEnum(TypeElement)
  type!: TypeElement;
}

export class DataEntityItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}

export class ApplicationItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(Criticite)
  @IsOptional()
  criticite?: Criticite;
}

export class TechComponentItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsEnum(TypeTechComponent)
  type!: TypeTechComponent;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}
