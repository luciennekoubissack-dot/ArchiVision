import { IsArray, IsNumber, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PositionItemDto {
  @IsUUID()
  id!: string;

  @IsNumber()
  positionX!: number;

  @IsNumber()
  positionY!: number;
}

export class UpdatePositionsBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PositionItemDto)
  items!: PositionItemDto[];
}
