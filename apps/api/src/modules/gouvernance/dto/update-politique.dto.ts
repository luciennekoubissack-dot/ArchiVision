import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePolitiqueDto {
  @ApiPropertyOptional({ description: 'Nom de la politique de gouvernance' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @ApiPropertyOptional({ description: 'Description de la politique de gouvernance' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}
