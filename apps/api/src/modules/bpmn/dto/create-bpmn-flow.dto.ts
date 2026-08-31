import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBpmnFlowDto {
  @ApiProperty({ description: "Identifiant de l'element source du flux" })
  @IsUUID()
  @IsNotEmpty()
  sourceId!: string;

  @ApiProperty({ description: "Identifiant de l'element cible du flux" })
  @IsUUID()
  @IsNotEmpty()
  targetId!: string;

  @ApiPropertyOptional({ description: 'Libelle affiche sur le flux' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  label?: string;
}
