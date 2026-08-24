import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateVisionCanvasDto {
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  targetGroup?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  needs?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  product?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  businessGoals?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  competitors?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  revenueStreams?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  costFactors?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  channels?: string;
}
