import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEchangeDto {
  @ApiProperty({ description: "Identifiant de l'application source de l'échange." })
  @IsUUID()
  @IsNotEmpty()
  sourceId!: string;

  @ApiProperty({ description: "Identifiant de l'application cible de l'échange." })
  @IsUUID()
  @IsNotEmpty()
  targetId!: string;

  @ApiPropertyOptional({ description: "Description de l'échange applicatif." })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: "Protocole utilisé pour l'échange." })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  protocole?: string;
}
