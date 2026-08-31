import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateObjectifDto {
  @ApiProperty({ description: 'Nom de l\'objectif.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: 'Description de l\'objectif.' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Sous-objectif rattaché.' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  sousObjectif?: string;
}
