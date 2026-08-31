import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCapaciteDto {
  @ApiPropertyOptional({ description: 'Nom de la capacité métier.' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @ApiPropertyOptional({ description: 'Description de la capacité métier.' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}
