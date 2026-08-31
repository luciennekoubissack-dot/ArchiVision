import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeFluxArchiApplicative } from '@prisma/client';

export class CreateArchiApplicativeFluxDto {
  @ApiProperty({ description: "Identifiant de l'élément source du flux." })
  @IsUUID()
  @IsNotEmpty()
  sourceId!: string;

  @ApiProperty({ description: "Identifiant de l'élément cible du flux." })
  @IsUUID()
  @IsNotEmpty()
  targetId!: string;

  @ApiPropertyOptional({ enum: TypeFluxArchiApplicative, description: 'Type du flux entre les deux éléments.' })
  @IsEnum(TypeFluxArchiApplicative)
  @IsOptional()
  type?: TypeFluxArchiApplicative;

  @ApiPropertyOptional({ description: 'Libellé affiché sur le flux.' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  label?: string;
}
