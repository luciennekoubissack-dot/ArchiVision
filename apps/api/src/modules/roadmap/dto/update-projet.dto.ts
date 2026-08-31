import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrioriteProjet, StatutProjet } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProjetDto {
  @ApiPropertyOptional({ description: 'Nom du projet' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @ApiPropertyOptional({ description: 'Description du projet' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: PrioriteProjet, description: 'Priorite du projet' })
  @IsEnum(PrioriteProjet)
  @IsOptional()
  priorite?: PrioriteProjet;

  @ApiPropertyOptional({ description: 'Cout estime du projet' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  coutEstime?: string;

  @ApiPropertyOptional({ description: 'Date de debut du projet', format: 'date' })
  @IsDateString()
  @IsOptional()
  dateDebut?: string;

  @ApiPropertyOptional({ description: 'Date de fin du projet', format: 'date' })
  @IsDateString()
  @IsOptional()
  dateFin?: string;

  @ApiPropertyOptional({ enum: StatutProjet, description: 'Statut du projet' })
  @IsEnum(StatutProjet)
  @IsOptional()
  statut?: StatutProjet;
}
