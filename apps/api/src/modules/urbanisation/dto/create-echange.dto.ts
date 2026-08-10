import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateEchangeDto {
  @IsUUID()
  @IsNotEmpty()
  sourceId!: string;

  @IsUUID()
  @IsNotEmpty()
  targetId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  protocole?: string;
}
