import { ApiProperty } from '@nestjs/swagger';
import { DomaineEcart } from '@prisma/client';

export class SolutionGapEntity {
  @ApiProperty({ description: 'Identifiant du lien.' })
  id!: string;

  @ApiProperty({ description: 'Identifiant de la solution.' })
  solutionId!: string;

  @ApiProperty({ enum: DomaineEcart, description: "Domaine architectural de l'écart." })
  domaine!: DomaineEcart;

  @ApiProperty({ description: "Identifiant de l'élément d'origine." })
  elementId!: string;

  @ApiProperty({ description: "Nom de l'élément d'origine, recopié au moment du lien." })
  elementNom!: string;

  @ApiProperty({ description: 'Date de création du lien.', type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Référence légère vers une solution, utilisée dans la liste globale des écarts adressés (toutes solutions confondues). */
export class SolutionGapRefEntity {
  @ApiProperty({ description: 'Identifiant de la solution.' })
  id!: string;

  @ApiProperty({ description: 'Nom de la solution.' })
  nom!: string;
}

export class SolutionGapWithSolutionEntity extends SolutionGapEntity {
  @ApiProperty({ type: () => SolutionGapRefEntity, description: 'Solution qui adresse cet écart.' })
  solution!: SolutionGapRefEntity;
}
