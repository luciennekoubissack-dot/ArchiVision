import { IsArray, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScoreItemDto {
  @ApiProperty({ description: "Identifiant du critere d'evaluation" })
  @IsUUID()
  critereId!: string;

  @ApiProperty({ description: 'Score attribue au critere', minimum: 0, maximum: 5 })
  @IsInt()
  @Min(0)
  @Max(5)
  score!: number;

  @ApiPropertyOptional({ description: 'Commentaire associe au score' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  commentaire?: string;
}

export class UpdateScoresDto {
  @ApiProperty({ type: () => [ScoreItemDto], description: 'Liste des scores a mettre a jour' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreItemDto)
  items!: ScoreItemDto[];
}
