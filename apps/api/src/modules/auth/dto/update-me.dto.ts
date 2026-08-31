import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMeDto {
  @ApiPropertyOptional({ description: 'Nom affiché de l\'utilisateur.' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nom?: string;

  @ApiPropertyOptional({ description: 'URL de l\'avatar de l\'utilisateur.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  avatarUrl?: string;
}
