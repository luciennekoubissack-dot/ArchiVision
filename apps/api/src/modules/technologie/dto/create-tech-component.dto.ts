import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { TypeTechComponent } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTechComponentDto {
  @ApiProperty({ description: 'Nom du composant technologique' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiProperty({ enum: TypeTechComponent, description: 'Type du composant technologique' })
  @IsEnum(TypeTechComponent)
  type!: TypeTechComponent;

  @ApiPropertyOptional({ description: 'Description du composant technologique' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Position horizontale sur le canevas' })
  @IsNumber()
  @IsOptional()
  positionX?: number;

  @ApiPropertyOptional({ description: 'Position verticale sur le canevas' })
  @IsNumber()
  @IsOptional()
  positionY?: number;
}
