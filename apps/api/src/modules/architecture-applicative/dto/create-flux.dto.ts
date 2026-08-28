import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { TypeFluxArchiApplicative } from '@prisma/client';

export class CreateArchiApplicativeFluxDto {
  @IsUUID()
  @IsNotEmpty()
  sourceId!: string;

  @IsUUID()
  @IsNotEmpty()
  targetId!: string;

  @IsEnum(TypeFluxArchiApplicative)
  @IsOptional()
  type?: TypeFluxArchiApplicative;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  label?: string;
}
