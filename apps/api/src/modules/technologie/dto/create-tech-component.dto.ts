import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { TypeTechComponent } from '@prisma/client';

export class CreateTechComponentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsEnum(TypeTechComponent)
  type!: TypeTechComponent;

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
