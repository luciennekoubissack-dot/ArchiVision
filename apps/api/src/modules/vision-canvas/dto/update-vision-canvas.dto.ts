import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVisionCanvasDto {
  @ApiPropertyOptional({ description: 'Groupe cible du produit' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  targetGroup?: string;

  @ApiPropertyOptional({ description: 'Besoins adresses par le produit' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  needs?: string;

  @ApiPropertyOptional({ description: 'Description du produit' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  product?: string;

  @ApiPropertyOptional({ description: "Objectifs metier vises par le produit" })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  businessGoals?: string;

  @ApiPropertyOptional({ description: 'Concurrents identifies' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  competitors?: string;

  @ApiPropertyOptional({ description: 'Sources de revenus envisagees' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  revenueStreams?: string;

  @ApiPropertyOptional({ description: 'Facteurs de cout associes' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  costFactors?: string;

  @ApiPropertyOptional({ description: 'Canaux de distribution ou de communication' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  channels?: string;
}
