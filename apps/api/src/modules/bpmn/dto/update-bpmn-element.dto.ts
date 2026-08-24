import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { DeclencheurEvenement, StatutElement, TypeBpmn, TypeTache } from '@prisma/client';

export class UpdateBpmnElementDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @IsEnum(TypeBpmn)
  @IsOptional()
  type?: TypeBpmn;

  @IsEnum(DeclencheurEvenement)
  @IsOptional()
  declencheur?: DeclencheurEvenement;

  @IsEnum(TypeTache)
  @IsOptional()
  typeTache?: TypeTache;

  @IsEnum(StatutElement)
  @IsOptional()
  statut?: StatutElement;

  @IsNumber()
  @IsOptional()
  positionX?: number;

  @IsNumber()
  @IsOptional()
  positionY?: number;
}
