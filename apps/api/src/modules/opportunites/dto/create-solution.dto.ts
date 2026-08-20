import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { StatutSolution } from '@prisma/client';

export class CreateSolutionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(StatutSolution)
  @IsOptional()
  statut?: StatutSolution;

  @IsString()
  @IsOptional()
  @MaxLength(4000)
  planMiseOeuvre?: string;
}
