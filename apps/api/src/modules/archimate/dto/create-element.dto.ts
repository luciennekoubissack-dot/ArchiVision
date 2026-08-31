import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CategorieExigence, TypeElement } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateElementDto {
  @ApiProperty({ enum: TypeElement, description: "Type de l'élément ArchiMate." })
  @IsEnum(TypeElement)
  type!: TypeElement;

  @ApiProperty({ description: "Nom de l'élément ArchiMate." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: "Description de l'élément ArchiMate." })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: CategorieExigence, description: "Catégorie de l'exigence, applicable lorsque l'élément est une exigence." })
  @IsEnum(CategorieExigence)
  @IsOptional()
  categorieExigence?: CategorieExigence;

  @ApiPropertyOptional({ description: 'Identifiant de la capacité métier associée.' })
  @IsUUID()
  @IsOptional()
  capaciteMetierId?: string;

  @ApiPropertyOptional({ description: "Position horizontale de l'élément sur le canevas." })
  @IsNumber()
  @IsOptional()
  positionX?: number;

  @ApiPropertyOptional({ description: "Position verticale de l'élément sur le canevas." })
  @IsNumber()
  @IsOptional()
  positionY?: number;
}
