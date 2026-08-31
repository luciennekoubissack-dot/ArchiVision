import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { TypeZone } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateZoneDto {
  @ApiProperty({ enum: TypeZone, description: "Type de la zone d'urbanisation." })
  @IsEnum(TypeZone)
  type!: TypeZone;

  @ApiProperty({ description: "Nom de la zone d'urbanisation." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: "Identifiant de la zone parente." })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
