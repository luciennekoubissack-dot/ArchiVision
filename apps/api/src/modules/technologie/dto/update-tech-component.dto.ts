import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { StatutElement, TypeTechComponent } from '@prisma/client';

export class UpdateTechComponentDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @IsEnum(TypeTechComponent)
  @IsOptional()
  type?: TypeTechComponent;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

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
