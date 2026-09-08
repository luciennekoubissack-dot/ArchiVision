import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({ description: "Nom de l'application." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiPropertyOptional({ description: "Description de l'application." })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

    @ApiPropertyOptional({ description: "Identifiant de l'application AS-IS dont cette application TO-BE est l'évolution." })
    @IsUUID()
    @IsOptional()
    asIsId?: string;
  @ApiPropertyOptional({ description: "Position horizontale de l'application sur le canevas." })
  @IsNumber()
  @IsOptional()
  positionX?: number;

  @ApiPropertyOptional({ description: "Position verticale de l'application sur le canevas." })
  @IsNumber()
  @IsOptional()
  positionY?: number;
}
