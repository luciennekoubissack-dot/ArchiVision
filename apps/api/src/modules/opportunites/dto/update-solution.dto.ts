import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { AvancementSolution, StatutSolution } from '@prisma/client';

export class UpdateSolutionDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

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

  @IsEnum(AvancementSolution)
  @IsOptional()
  avancement?: AvancementSolution;

  @IsString()
  @IsOptional()
  @MaxLength(4000)
  commentaireSuivi?: string;
}
