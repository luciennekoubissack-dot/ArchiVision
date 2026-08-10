import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDataAttributeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  type!: string;
}
