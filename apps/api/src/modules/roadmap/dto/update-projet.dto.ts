import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrioriteProjet, StatutProjet } from '@prisma/client';

export class UpdateProjetDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(PrioriteProjet)
  @IsOptional()
  priorite?: PrioriteProjet;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  coutEstime?: string;

  @IsDateString()
  @IsOptional()
  dateDebut?: string;

  @IsDateString()
  @IsOptional()
  dateFin?: string;

  @IsEnum(StatutProjet)
  @IsOptional()
  statut?: StatutProjet;
}
