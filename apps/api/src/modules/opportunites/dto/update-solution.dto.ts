import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { AvancementSolution, StatutSolution } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSolutionDto {
  @ApiPropertyOptional({ description: 'Nom de la solution' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

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

  @ApiPropertyOptional({ enum: AvancementSolution, description: "Avancement de la mise en oeuvre de la solution" })
  @IsEnum(AvancementSolution)
  @IsOptional()
  avancement?: AvancementSolution;

  @ApiPropertyOptional({ description: 'Commentaire de suivi de la solution' })
  @IsString()
  @IsOptional()
  @MaxLength(4000)
  commentaireSuivi?: string;
}
