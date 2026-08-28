import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateApplicationDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

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
