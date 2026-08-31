import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationServiceDto {
  @ApiProperty({ description: "Nom du service applicatif." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: "Description du service applicatif." })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
