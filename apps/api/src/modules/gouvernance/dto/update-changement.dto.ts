import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { StatutChangement } from '@prisma/client';

export class UpdateChangementDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  titre?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(StatutChangement)
  @IsOptional()
  statut?: StatutChangement;
}
