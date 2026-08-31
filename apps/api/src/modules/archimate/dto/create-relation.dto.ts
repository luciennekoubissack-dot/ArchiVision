import { IsEnum, IsUUID } from 'class-validator';
import { TypeRelation } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRelationDto {
  @ApiProperty({ enum: TypeRelation, description: 'Type de relation ArchiMate.' })
  @IsEnum(TypeRelation)
  type!: TypeRelation;

  @ApiProperty({ description: "Identifiant de l'élément source de la relation." })
  @IsUUID()
  sourceId!: string;

  @ApiProperty({ description: "Identifiant de l'élément cible de la relation." })
  @IsUUID()
  targetId!: string;
}
