import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePositionDto {
  @ApiProperty({ description: "Position horizontale de l'élément sur le canevas." })
  @IsNumber()
  positionX!: number;

  @ApiProperty({ description: "Position verticale de l'élément sur le canevas." })
  @IsNumber()
  positionY!: number;
}
