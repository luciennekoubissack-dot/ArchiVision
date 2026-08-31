import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { StatutChangement } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChangementDto {
  @ApiProperty({ description: 'Titre de la demande de changement' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titre!: string;

  @ApiPropertyOptional({ description: 'Description de la demande de changement' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: StatutChangement, description: 'Statut de la demande de changement' })
  @IsEnum(StatutChangement)
  @IsOptional()
  statut?: StatutChangement;
}
