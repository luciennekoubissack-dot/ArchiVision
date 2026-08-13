import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateApplicationServiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
