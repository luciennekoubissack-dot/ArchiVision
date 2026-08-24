import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EnqueteReponseItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  repondant!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  commentaire?: string;
}

export class ImportEnqueteDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnqueteReponseItemDto)
  items!: EnqueteReponseItemDto[];
}
