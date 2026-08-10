import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { TypeCardinalite } from '@prisma/client';

export class CreateDataRelationDto {
  @IsUUID()
  @IsNotEmpty()
  sourceId!: string;

  @IsUUID()
  @IsNotEmpty()
  targetId!: string;

  @IsEnum(TypeCardinalite)
  cardinalite!: TypeCardinalite;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  label?: string;
}
