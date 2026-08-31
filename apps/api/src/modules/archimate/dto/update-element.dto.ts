import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CategorieExigence, TypeElement } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateElementDto {
  @ApiPropertyOptional({ enum: TypeElement, description: "Type de l'élément ArchiMate." })
  @IsEnum(TypeElement)
  @IsOptional()
  type?: TypeElement;

  @ApiPropertyOptional({ description: "Nom de l'élément ArchiMate." })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @ApiPropertyOptional({ description: "Description de l'élément ArchiMate." })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: CategorieExigence, description: "Catégorie de l'exigence, applicable lorsque l'élément est une exigence." })
  @IsEnum(CategorieExigence)
  @IsOptional()
  categorieExigence?: CategorieExigence;

  @ApiPropertyOptional({ description: 'Identifiant de la capacité métier associée, ou null pour la retirer.', type: String, nullable: true })
  @IsUUID()
  @IsOptional()
  capaciteMetierId?: string | null;

  @ApiPropertyOptional({ description: "Position horizontale de l'élément sur le canevas." })
  @IsNumber()
  @IsOptional()
  positionX?: number;

  @ApiPropertyOptional({ description: "Position verticale de l'élément sur le canevas." })
  @IsNumber()
  @IsOptional()
  positionY?: number;
}
