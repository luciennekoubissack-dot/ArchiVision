import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { TypeZone } from '@prisma/client';

export class CreateZoneDto {
  @IsEnum(TypeZone)
  type!: TypeZone;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}
