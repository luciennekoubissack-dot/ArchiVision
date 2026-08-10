import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { StatutElement, TypeBpmn } from '@prisma/client';

export class CreateBpmnElementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsEnum(TypeBpmn)
  type!: TypeBpmn;

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
