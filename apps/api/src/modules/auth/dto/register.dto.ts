import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ActeurItemDto,
  ApplicationItemDto,
  BpmnProcessusItemDto,
  CapaciteItemDto,
  DataEntityItemDto,
  ObjectifItemDto,
  PartiePrenanteItemDto,
  TechComponentItemDto,
} from './register-items.dto';

export class RegisterDto {
  // ── Organisation ──────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Nom de l\'organisation.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  organisationNom!: string;

  @ApiPropertyOptional({ description: 'Description de l\'organisation.' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  organisationDescription?: string;

  @ApiPropertyOptional({ description: 'Secteur d\'activité de l\'organisation.' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  secteur?: string;

  @ApiPropertyOptional({ description: 'Taille de l\'organisation.' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  taille?: string;

  @ApiPropertyOptional({ description: 'Pays de l\'organisation.' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  pays?: string;

  @ApiPropertyOptional({ description: 'URL du logo de l\'organisation.' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Vision de l\'organisation.' })
  @IsString()
  @IsOptional()
  @MaxLength(4000)
  vision?: string;

  @ApiPropertyOptional({ description: 'Problèmes que l\'organisation cherche à résoudre.' })
  @IsString()
  @IsOptional()
  @MaxLength(4000)
  problemesResoudre?: string;

  // ── Premier utilisateur (Administrateur) ─────────────────────────────────

  @ApiProperty({ description: 'Adresse e-mail du premier utilisateur, administrateur de l\'organisation.' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Mot de passe, 8 caractères minimum.' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ description: 'Nom du premier utilisateur.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  // ── Amorçage optionnel du référentiel (étapes 2 à 7 de l'assistant) ──────
  // Toutes ces listes sont facultatives : l'utilisateur peut passer une étape.

  @ApiPropertyOptional({ type: () => [ObjectifItemDto], description: 'Objectifs à pré-remplir pour l\'organisation.' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ObjectifItemDto)
  objectifs?: ObjectifItemDto[];

  @ApiPropertyOptional({ type: () => [PartiePrenanteItemDto], description: 'Parties prenantes à pré-remplir pour l\'organisation.' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PartiePrenanteItemDto)
  partiesPrenantes?: PartiePrenanteItemDto[];

  @ApiPropertyOptional({ type: () => [BpmnProcessusItemDto], description: 'Processus BPMN à pré-remplir pour l\'organisation.' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BpmnProcessusItemDto)
  bpmnProcessus?: BpmnProcessusItemDto[];

  @ApiPropertyOptional({ type: () => [CapaciteItemDto], description: 'Capacités métier à pré-remplir pour l\'organisation.' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CapaciteItemDto)
  capacitesMetier?: CapaciteItemDto[];

  @ApiPropertyOptional({ type: () => [ActeurItemDto], description: 'Acteurs à pré-remplir pour l\'organisation.' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ActeurItemDto)
  acteurs?: ActeurItemDto[];

  @ApiPropertyOptional({ type: () => [DataEntityItemDto], description: 'Entités de données à pré-remplir pour l\'organisation.' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DataEntityItemDto)
  dataEntities?: DataEntityItemDto[];

  @ApiPropertyOptional({ type: () => [ApplicationItemDto], description: 'Applications à pré-remplir pour l\'organisation.' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ApplicationItemDto)
  applications?: ApplicationItemDto[];

  @ApiPropertyOptional({ type: () => [TechComponentItemDto], description: 'Composants technologiques à pré-remplir pour l\'organisation.' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TechComponentItemDto)
  techComponents?: TechComponentItemDto[];
}
