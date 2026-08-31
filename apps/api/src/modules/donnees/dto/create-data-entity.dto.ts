import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDataEntityDto {
  @ApiProperty({ description: "Nom de l'entite de donnees" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: "Description de l'entite de donnees" })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: "Proprietaire de l'entite de donnees" })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  proprietaire?: string;

  @ApiPropertyOptional({ description: 'Position horizontale sur le canevas' })
  @IsNumber()
  @IsOptional()
  positionX?: number;

  @ApiPropertyOptional({ description: 'Position verticale sur le canevas' })
  @IsNumber()
  @IsOptional()
  positionY?: number;
}
