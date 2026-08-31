import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDataAttributeDto {
  @ApiProperty({ description: "Nom de l'attribut" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @ApiProperty({ description: "Type de donnee de l'attribut" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  type!: string;
}
