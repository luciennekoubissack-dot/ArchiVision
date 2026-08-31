import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { StatutElement, TypeTechComponent } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTechComponentDto {
  @ApiPropertyOptional({ description: 'Nom du composant technologique' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @ApiPropertyOptional({ enum: TypeTechComponent, description: 'Type du composant technologique' })
  @IsEnum(TypeTechComponent)
  @IsOptional()
  type?: TypeTechComponent;

  @ApiPropertyOptional({ description: 'Description du composant technologique' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: StatutElement, description: 'Statut du composant technologique' })
  @IsEnum(StatutElement)
  @IsOptional()
  statut?: StatutElement;

  @ApiPropertyOptional({ description: 'Position horizontale sur le canevas' })
  @IsNumber()
  @IsOptional()
  positionX?: number;

  @ApiPropertyOptional({ description: 'Position verticale sur le canevas' })
  @IsNumber()
  @IsOptional()
  positionY?: number;
}
