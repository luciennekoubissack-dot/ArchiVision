import { IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateApplicationDto {
  @ApiPropertyOptional({ description: "Identifiant de l'application AS-IS dont cette application TO-BE est l'évolution." })
  @IsUUID()
  @IsOptional()
  asIsId?: string;
  @ApiPropertyOptional({ description: "Nouveau nom de l'application." })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @ApiPropertyOptional({ description: "Nouvelle description de l'application." })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: "Nouvelle position horizontale de l'application sur le canevas." })
  @IsNumber()
  @IsOptional()
  positionX?: number;

  @ApiPropertyOptional({ description: "Nouvelle position verticale de l'application sur le canevas." })
  @IsNumber()
  @IsOptional()
  positionY?: number;
}
