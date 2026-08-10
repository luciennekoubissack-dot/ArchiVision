import { IsNumber } from 'class-validator';

export class UpdatePositionDto {
  @IsNumber()
  positionX!: number;

  @IsNumber()
  positionY!: number;
}
