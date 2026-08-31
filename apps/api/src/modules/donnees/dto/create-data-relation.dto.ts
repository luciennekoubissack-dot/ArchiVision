import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { TypeCardinalite } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDataRelationDto {
  @ApiProperty({ description: "Identifiant de l'entite source" })
  @IsUUID()
  @IsNotEmpty()
  sourceId!: string;

  @ApiProperty({ description: "Identifiant de l'entite cible" })
  @IsUUID()
  @IsNotEmpty()
  targetId!: string;

  @ApiProperty({ enum: TypeCardinalite, description: 'Cardinalite de la relation' })
  @IsEnum(TypeCardinalite)
  cardinalite!: TypeCardinalite;

  @ApiPropertyOptional({ description: 'Libelle de la relation' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  label?: string;
}
