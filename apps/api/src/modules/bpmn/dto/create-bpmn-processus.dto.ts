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

  @ApiPropertyOptional({ enum: TypeProcessus, description: 'Type du processus BPMN' })
  @IsEnum(TypeProcessus)
  @IsOptional()
  type?: TypeProcessus;
}
