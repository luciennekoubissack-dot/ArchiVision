import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  avatarUrl?: string;
}
