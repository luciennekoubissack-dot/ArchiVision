import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
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

    @ApiPropertyOptional({ description: "Identifiant de l'entité de données AS-IS dont cette entité TO-BE est l'évolution." })
    @IsUUID()
    @IsOptional()
    asIsId?: string;
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
