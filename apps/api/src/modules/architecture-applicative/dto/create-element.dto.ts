import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeElementArchiApplicative } from '@prisma/client';

export class CreateArchiApplicativeElementDto {
  @ApiProperty({ description: "Nom de l'élément d'architecture applicative." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiProperty({ enum: TypeElementArchiApplicative, description: "Type de l'élément d'architecture applicative." })
  @IsEnum(TypeElementArchiApplicative)
  type!: TypeElementArchiApplicative;

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
