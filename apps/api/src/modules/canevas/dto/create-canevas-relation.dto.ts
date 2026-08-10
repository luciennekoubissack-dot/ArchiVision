import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ElementKind, TypeRelation } from '@prisma/client';

export class CreateCanevasRelationDto {
  @IsEnum(TypeRelation)
  type!: TypeRelation;

  @IsEnum(ElementKind)
  sourceKind!: ElementKind;

  @IsString()
  @IsNotEmpty()
  sourceId!: string;

  @IsEnum(ElementKind)
  targetKind!: ElementKind;

  @IsString()
  @IsNotEmpty()
  targetId!: string;
}
