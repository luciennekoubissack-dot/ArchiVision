import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { Criticite } from '@prisma/client';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(Criticite)
  @IsOptional()
  criticite?: Criticite;

  @IsNumber()
  @IsOptional()
  positionX?: number;

  @IsNumber()
  @IsOptional()
  positionY?: number;
}
