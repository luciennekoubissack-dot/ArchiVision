import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TypeProcessus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBpmnProcessusDto {
  @ApiProperty({ description: 'Nom du processus BPMN' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: 'Description du processus BPMN' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description:
      "Étapes du processus en langage naturel, une par ligne. Si renseigné à la création, une proposition de diagramme (éléments + flux) est générée automatiquement.",
  })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  etapes?: string;

  @ApiPropertyOptional({ enum: TypeProcessus, description: 'Type du processus BPMN' })
  @IsEnum(TypeProcessus)
  @IsOptional()
  type?: TypeProcessus;
}
