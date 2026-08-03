import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateZoneDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string | null;
}
