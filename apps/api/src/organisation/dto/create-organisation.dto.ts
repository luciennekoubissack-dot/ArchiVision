import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganisationDto {
  @ApiProperty({ description: "Nom de l'organisation." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

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
}
