import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Criticite } from '@prisma/client';

export class UpdateApplicationDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(Criticite)
  @IsOptional()
  criticite?: Criticite;
}
