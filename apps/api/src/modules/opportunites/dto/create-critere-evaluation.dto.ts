import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCritereEvaluationDto {
  @ApiProperty({ description: "Nom du critere d'evaluation" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: "Description du critere d'evaluation" })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}
