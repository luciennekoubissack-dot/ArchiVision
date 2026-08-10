import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
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

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  organisationNom!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  organisationDescription?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  secteur?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  taille?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  pays?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  logoUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(4000)
  vision?: string;

  @IsString()
  @IsOptional()
  @MaxLength(4000)
  problemesResoudre?: string;

  // ── Premier utilisateur (Administrateur) ─────────────────────────────────

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  // ── Amorçage optionnel du référentiel (étapes 2 à 7 de l'assistant) ──────
  // Toutes ces listes sont facultatives : l'utilisateur peut passer une étape.

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ObjectifItemDto)
  objectifs?: ObjectifItemDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PartiePrenanteItemDto)
  partiesPrenantes?: PartiePrenanteItemDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BpmnProcessusItemDto)
  bpmnProcessus?: BpmnProcessusItemDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CapaciteItemDto)
  capacitesMetier?: CapaciteItemDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ActeurItemDto)
  acteurs?: ActeurItemDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DataEntityItemDto)
  dataEntities?: DataEntityItemDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ApplicationItemDto)
  applications?: ApplicationItemDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TechComponentItemDto)
  techComponents?: TechComponentItemDto[];
}
