import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCapaciteDto {
  @ApiProperty({ description: 'Nom de la capacité métier.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: 'Description de la capacité métier.' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}
