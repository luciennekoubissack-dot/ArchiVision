import { ApiProperty } from '@nestjs/swagger';

export class DataAttributeEntity {
  @ApiProperty({ description: "Identifiant de l'attribut." })
  id!: string;

  @ApiProperty({ description: "Nom de l'attribut." })
  nom!: string;

  @ApiProperty({ description: "Type de donnee de l'attribut (texte libre, ex. 'string', 'int')." })
  type!: string;

  @ApiProperty({ description: "Identifiant de l'entite de donnees a laquelle l'attribut appartient." })
  entityId!: string;
}
