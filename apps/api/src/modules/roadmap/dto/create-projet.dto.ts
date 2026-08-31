import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrioriteProjet } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjetDto {
  @ApiProperty({ description: 'Nom du projet' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

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
}
