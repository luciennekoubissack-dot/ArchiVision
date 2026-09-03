import { ArrayMaxSize, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionDto } from './create-questionnaire.dto';

export class UpdateQuestionnaireDto {
  @ApiPropertyOptional({ description: 'Titre du questionnaire' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  titre?: string;

  @ApiPropertyOptional({ description: 'Description ou consignes.' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({
    type: () => [QuestionDto],
    description: 'Si fourni, remplace intégralement la liste des questions.',
  })
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  @IsOptional()
  questions?: QuestionDto[];
}
