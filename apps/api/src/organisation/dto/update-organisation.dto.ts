import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOrganisationDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  logoUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  secteur?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  taille?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  pays?: string;
}
