import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnqueteReponseItemDto {
  @ApiProperty({ description: 'Nom ou identifiant du repondant' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  repondant!: string;

  @ApiProperty({ description: 'Score attribue par le repondant, de 1 a 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @ApiPropertyOptional({ description: 'Commentaire libre du repondant' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  commentaire?: string;
}

export class ImportEnqueteDto {
  @ApiProperty({ type: () => [EnqueteReponseItemDto], description: 'Liste des reponses a importer' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnqueteReponseItemDto)
  items!: EnqueteReponseItemDto[];
}
