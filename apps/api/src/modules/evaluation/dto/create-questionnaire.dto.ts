import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TypeQuestion } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuestionDto {
  @ApiProperty({ description: "Intitulé de la question" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  intitule!: string;

  @ApiProperty({ enum: TypeQuestion, description: 'Nature de la question' })
  @IsEnum(TypeQuestion)
  type!: TypeQuestion;

  @ApiPropertyOptional({
    type: [String],
    description: 'Choix proposés — requis (au moins 2) pour CHOIX_MULTIPLE, ignoré sinon.',
  })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional({ description: 'Borne haute de la note (NOTE_MAX uniquement), 1 à 100.' })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  noteMax?: number;
}

export class CreateQuestionnaireDto {
  @ApiProperty({ description: 'Titre du questionnaire' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titre!: string;

  @ApiPropertyOptional({ description: 'Description ou consignes affichées en tête du formulaire.' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ type: () => [QuestionDto], description: 'Liste ordonnée des questions.' })
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions!: QuestionDto[];
}
