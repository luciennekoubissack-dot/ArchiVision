import { Injectable } from '@nestjs/common';
import { TypeElementArchiApplicative } from '@prisma/client';
import { PrismaService } from '@archivision/infrastructure';
import { computeLaneGrid } from '../../common/diagram-layout.util';
import { DiagramLayoutResultEntity } from '../../common/entities/diagram-layout.entity';

/** Ordre des couloirs (haut vers bas), une ligne par type d'élément. */
const LANE_ORDER: readonly TypeElementArchiApplicative[] = [
  'UTILISATEUR_INTERNE',
  'UTILISATEUR_EXTERNE',
  'APPLICATION',
  'SYSTEME_EXTERNE',
  'BASE_DE_DONNEES',
  'INFRASTRUCTURE',
  'SECURITE',
];

// computeLaneGrid dispose chaque couloir sur une seule ligne ; maxPerRow est
// requis par le type mais non utilisé ici.
const GRID = { boxWidth: 200, boxHeight: 90, gapX: 50, gapY: 90, margin: 40, maxPerRow: 6 };

/**
 * Dispose automatiquement les éléments d'architecture applicative en couloirs
 * par type (même logique visuelle que la vue SVG générée) et persiste
 * `ArchiApplicativeElement.positionX/positionY`. Les flux déjà saisis sont
 * tracés tels quels par l'éditeur.
 */
@Injectable()
export class ArchitectureApplicativeLayoutService {
  constructor(private readonly prisma: PrismaService) {}

  async generateAndPersist(organisationId: string): Promise<DiagramLayoutResultEntity> {
    const elements = await this.prisma.archiApplicativeElement.findMany({
      where: { organisationId },
      orderBy: [{ type: 'asc' }, { nom: 'asc' }],
      select: { id: true, type: true },
    });

    if (elements.length === 0) {
      return { elements: [], count: 0 };
    }

    const positions = computeLaneGrid(
      elements.map((e) => ({ id: e.id, lane: e.type })),
      LANE_ORDER,
      GRID,
    );

    await this.prisma.$transaction(
      elements.map((e) =>
        this.prisma.archiApplicativeElement.update({
          where: { id: e.id },
          data: { positionX: positions.get(e.id)!.x, positionY: positions.get(e.id)!.y },
        }),
      ),
    );

    return {
      elements: elements.map((e) => ({
        id: e.id,
        positionX: positions.get(e.id)!.x,
        positionY: positions.get(e.id)!.y,
      })),
      count: elements.length,
    };
  }
}
