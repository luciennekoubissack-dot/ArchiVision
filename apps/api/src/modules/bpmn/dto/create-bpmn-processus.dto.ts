import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TypeProcessus } from '@prisma/client';

export class CreateBpmnProcessusDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(TypeProcessus)
  @IsOptional()
  type?: TypeProcessus;
}
