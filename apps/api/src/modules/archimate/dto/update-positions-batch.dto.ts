import { IsArray, IsNumber, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PositionItemDto {
  @ApiProperty({ description: "Identifiant de l'élément dont la position est mise à jour." })
  @IsUUID()
  id!: string;

  @ApiProperty({ description: "Position horizontale de l'élément sur le canevas." })
  @IsNumber()
  positionX!: number;

  @ApiProperty({ description: "Position verticale de l'élément sur le canevas." })
  @IsNumber()
  positionY!: number;
}

export class UpdatePositionsBatchDto {
  @ApiProperty({ type: () => [PositionItemDto], description: 'Liste des positions à mettre à jour par lot.' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PositionItemDto)
  items!: PositionItemDto[];
}
