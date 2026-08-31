import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePolitiqueDto {
  @ApiProperty({ description: 'Nom de la politique de gouvernance' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: 'Description de la politique de gouvernance' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}
