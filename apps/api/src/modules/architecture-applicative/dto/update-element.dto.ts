import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TypeElementArchiApplicative } from '@prisma/client';

export class UpdateArchiApplicativeElementDto {
  @ApiPropertyOptional({ description: "Nom de l'élément d'architecture applicative." })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @ApiPropertyOptional({ enum: TypeElementArchiApplicative, description: "Type de l'élément d'architecture applicative." })
  @IsEnum(TypeElementArchiApplicative)
  @IsOptional()
  type?: TypeElementArchiApplicative;

  @ApiPropertyOptional({ description: "Description détaillée de l'élément." })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Position horizontale sur le canevas.' })
  @IsNumber()
  @IsOptional()
  positionX?: number;

  @ApiPropertyOptional({ description: 'Position verticale sur le canevas.' })
  @IsNumber()
  @IsOptional()
  positionY?: number;
}
