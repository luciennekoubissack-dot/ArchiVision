import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateZoneDto {
  @ApiPropertyOptional({ description: "Nouveau nom de la zone d'urbanisation." })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @ApiPropertyOptional({ description: "Identifiant de la zone parente, ou null pour retirer le rattachement.", type: String, nullable: true })
  @IsUUID()
  @IsOptional()
  parentId?: string | null;
}
