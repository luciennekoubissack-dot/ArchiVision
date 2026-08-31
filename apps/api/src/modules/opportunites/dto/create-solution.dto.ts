import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { StatutSolution } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSolutionDto {
  @ApiProperty({ description: 'Nom de la solution' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: 'Description de la solution' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: StatutSolution, description: 'Statut de la solution' })
  @IsEnum(StatutSolution)
  @IsOptional()
  statut?: StatutSolution;

  @ApiPropertyOptional({ description: 'Plan de mise en oeuvre de la solution' })
  @IsString()
  @IsOptional()
  @MaxLength(4000)
  planMiseOeuvre?: string;
}
