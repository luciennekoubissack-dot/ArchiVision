import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { DeclencheurEvenement, StatutElement, TypeBpmn, TypeTache } from '@prisma/client';

export class CreateBpmnElementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsEnum(TypeBpmn)
  type!: TypeBpmn;

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
