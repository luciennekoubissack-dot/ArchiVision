import { IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutConformite } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConformiteItemDto {
  @ApiProperty({ description: 'Identifiant de la politique de gouvernance' })
  @IsUUID()
  politiqueId!: string;

  @ApiProperty({ enum: StatutConformite, description: 'Statut de conformite a la politique' })
  @IsEnum(StatutConformite)
  statut!: StatutConformite;

  @ApiPropertyOptional({ description: 'Commentaire associe au statut de conformite' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  commentaire?: string;
}

export class UpdateConformitesDto {
  @ApiProperty({ type: () => [ConformiteItemDto], description: 'Liste des conformites a mettre a jour' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConformiteItemDto)
  items!: ConformiteItemDto[];
}
