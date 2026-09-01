import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutElement } from '@prisma/client';

export class CreateObjectifDto {
  @ApiProperty({ description: 'Nom de l\'objectif.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: 'Description de l\'objectif.' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Sous-objectif rattaché.' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  sousObjectif?: string;

  @ApiPropertyOptional({
    enum: StatutElement,
    default: StatutElement.LES_DEUX,
    description: "Statut de l'objectif pour l'analyse des écarts (AS_IS, TO_BE ou LES_DEUX).",
  })
  @IsEnum(StatutElement)
  @IsOptional()
  statut?: StatutElement;

  @ApiPropertyOptional({
    description: "Identifiant de l'objectif AS-IS dont cet objectif TO-BE est l'évolution (uniquement si statut = TO_BE).",
  })
  @IsUUID()
  @IsOptional()
  objectifAsIsId?: string;
}
