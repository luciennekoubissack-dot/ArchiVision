import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { DeclencheurEvenement, StatutElement, TypeBpmn, TypeTache } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBpmnElementDto {
  @ApiPropertyOptional({ description: "Nom de l'element BPMN" })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @ApiPropertyOptional({ enum: TypeBpmn, description: "Type de l'element BPMN" })
  @IsEnum(TypeBpmn)
  @IsOptional()
  type?: TypeBpmn;

  @ApiPropertyOptional({ enum: DeclencheurEvenement, description: "Declencheur de l'evenement, applicable si l'element est un evenement" })
  @IsEnum(DeclencheurEvenement)
  @IsOptional()
  declencheur?: DeclencheurEvenement;

  @ApiPropertyOptional({ enum: TypeTache, description: "Type de tache, applicable si l'element est une tache" })
  @IsEnum(TypeTache)
  @IsOptional()
  typeTache?: TypeTache;

  @ApiPropertyOptional({ enum: StatutElement, description: "Statut d'avancement de l'element" })
  @IsEnum(StatutElement)
  @IsOptional()
  statut?: StatutElement;

  @ApiPropertyOptional({ description: 'Position horizontale de l\'element sur le canevas' })
  @IsNumber()
  @IsOptional()
  positionX?: number;

  @ApiPropertyOptional({ description: 'Position verticale de l\'element sur le canevas' })
  @IsNumber()
  @IsOptional()
  positionY?: number;
}
