import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { TypeElementArchiApplicative } from '@prisma/client';

export class UpdateArchiApplicativeElementDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @IsEnum(TypeElementArchiApplicative)
  @IsOptional()
  type?: TypeElementArchiApplicative;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsNumber()
  @IsOptional()
  positionX?: number;

  @IsNumber()
  @IsOptional()
  positionY?: number;
}
