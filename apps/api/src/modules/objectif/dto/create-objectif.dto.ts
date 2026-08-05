import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateObjectifDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}
