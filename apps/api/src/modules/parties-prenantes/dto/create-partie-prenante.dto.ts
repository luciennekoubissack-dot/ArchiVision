import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePartiePrenanteDto {
  @ApiProperty({ description: "Nom de la partie prenante." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: "Rôle de la partie prenante." })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  role?: string;
}
