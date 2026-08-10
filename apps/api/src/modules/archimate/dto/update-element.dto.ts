import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { TypeElement } from '@prisma/client';

export class UpdateElementDto {
  @IsEnum(TypeElement)
  @IsOptional()
  type?: TypeElement;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsUUID()
  @IsOptional()
  capaciteMetierId?: string | null;

  @IsNumber()
  @IsOptional()
  positionX?: number;

  @IsNumber()
  @IsOptional()
  positionY?: number;
}
