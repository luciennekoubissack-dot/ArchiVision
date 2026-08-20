import { IsArray, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ScoreItemDto {
  @IsUUID()
  critereId!: string;

  @IsInt()
  @Min(0)
  @Max(5)
  score!: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  commentaire?: string;
}

export class UpdateScoresDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreItemDto)
  items!: ScoreItemDto[];
}
