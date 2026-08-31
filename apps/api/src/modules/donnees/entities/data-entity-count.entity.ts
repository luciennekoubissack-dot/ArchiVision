import { ApiProperty } from '@nestjs/swagger';

/** Compteur de relations Prisma (`_count`) renvoye sur la liste paginee des entites de donnees. */
export class DataEntityCountEntity {
  @ApiProperty({ description: "Nombre d'attributs de l'entite de donnees." })
  attributs!: number;
}
