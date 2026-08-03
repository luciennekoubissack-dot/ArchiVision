import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCapaciteDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}
