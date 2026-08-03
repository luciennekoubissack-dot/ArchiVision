import { IsEnum, IsUUID } from 'class-validator';
import { TypeRelation } from '@prisma/client';

export class CreateRelationDto {
  @IsEnum(TypeRelation)
  type!: TypeRelation;

  @IsUUID()
  sourceId!: string;

  @IsUUID()
  targetId!: string;
}
