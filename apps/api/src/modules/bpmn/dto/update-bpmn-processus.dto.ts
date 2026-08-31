import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TypeProcessus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBpmnProcessusDto {
  @ApiPropertyOptional({ description: 'Nom du processus BPMN' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @ApiPropertyOptional({ description: 'Description du processus BPMN' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: TypeProcessus, description: 'Type du processus BPMN' })
  @IsEnum(TypeProcessus)
  @IsOptional()
  type?: TypeProcessus;

  @ApiPropertyOptional({ description: 'Contenu XML du diagramme BPMN' })
  @IsString()
  @IsOptional()
  bpmnXml?: string;
}
