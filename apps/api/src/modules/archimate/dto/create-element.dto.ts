import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { TypeElement } from '@prisma/client';

export class CreateElementDto {
  @IsEnum(TypeElement)
  type!: TypeElement;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsUUID()
  @IsOptional()
  capaciteMetierId?: string;

  @IsNumber()
  @IsOptional()
  positionX?: number;

  @IsNumber()
  @IsOptional()
  positionY?: number;
}
