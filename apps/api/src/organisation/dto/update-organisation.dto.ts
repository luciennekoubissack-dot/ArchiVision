import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrganisationDto {
  @ApiPropertyOptional({ description: "Nom de l'organisation." })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @ApiPropertyOptional({ description: "Description de l'organisation." })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: "URL du logo de l'organisation." })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  logoUrl?: string;

  @ApiPropertyOptional({ description: "Secteur d'activité de l'organisation." })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  secteur?: string;

  @ApiPropertyOptional({ description: "Taille de l'organisation." })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  taille?: string;

  @ApiPropertyOptional({ description: "Pays de l'organisation." })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  pays?: string;

  @ApiPropertyOptional({ description: "Vision stratégique de l'organisation." })
  @IsString()
  @IsOptional()
  @MaxLength(4000)
  vision?: string;

  @ApiPropertyOptional({ description: "Problèmes que l'organisation cherche à résoudre." })
  @IsString()
  @IsOptional()
  @MaxLength(4000)
  problemesResoudre?: string;
}
