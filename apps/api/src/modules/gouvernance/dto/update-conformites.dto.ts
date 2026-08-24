import { IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutConformite } from '@prisma/client';

export class ConformiteItemDto {
  @IsUUID()
  politiqueId!: string;

  @IsEnum(StatutConformite)
  statut!: StatutConformite;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  commentaire?: string;
}

export class UpdateConformitesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConformiteItemDto)
  items!: ConformiteItemDto[];
}
