import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrioriteProjet } from '@prisma/client';

export class CreateProjetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

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
}
