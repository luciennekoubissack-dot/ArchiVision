import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkObjectifsDto {
  @ApiProperty({
    type: [String],
    description:
      "Liste complète des identifiants d'objectifs stratégiques visés par ce processus (remplace la liste existante).",
  })
  @IsArray()
  @IsUUID('4', { each: true })
  objectifIds!: string[];
}
