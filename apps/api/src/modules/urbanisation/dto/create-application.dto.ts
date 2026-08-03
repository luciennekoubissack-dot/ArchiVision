import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Criticite } from '@prisma/client';

export class CreateApplicationDto {
  @IsUUID()
  organisationId!: string;

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
}
