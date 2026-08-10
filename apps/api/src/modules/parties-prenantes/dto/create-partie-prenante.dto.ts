import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePartiePrenanteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  role?: string;
}
