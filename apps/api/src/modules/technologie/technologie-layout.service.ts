import { Injectable } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { computeFlowGrid } from '../../common/diagram-layout.util';
import { DiagramLayoutResultEntity } from '../../common/entities/diagram-layout.entity';

// Boîtes larges : chaque nœud de déploiement porte ses artefacts d'applications.
const GRID = { boxWidth: 300, boxHeight: 220, gapX: 70, gapY: 80, margin: 40, maxPerRow: 3 };

/**
 * Dispose automatiquement les composants technologiques du diagramme de
 * déploiement en grille et persiste `TechComponent.positionX/positionY`. Les
 * artefacts (applications déployées) suivent leur nœud dans l'éditeur.
 */
@Injectable()
export class TechnologieLayoutService {
  constructor(private readonly prisma: PrismaService) {}

  async generateAndPersist(organisationId: string): Promise<DiagramLayoutResultEntity> {
    const components = await this.prisma.techComponent.findMany({
      where: { organisationId },
      orderBy: [{ type: 'asc' }, { nom: 'asc' }],
      select: { id: true },
    });

    if (components.length === 0) {
      return { elements: [], count: 0 };
    }

    const positions = computeFlowGrid(
      components.map((c) => c.id),
      GRID,
    );

    await this.prisma.$transaction(
      components.map((c) =>
        this.prisma.techComponent.update({
          where: { id: c.id },
          data: { positionX: positions.get(c.id)!.x, positionY: positions.get(c.id)!.y },
        }),
      ),
    );

    return {
      elements: components.map((c) => ({
        id: c.id,
        positionX: positions.get(c.id)!.x,
        positionY: positions.get(c.id)!.y,
      })),
      count: components.length,
    };
  }
}
