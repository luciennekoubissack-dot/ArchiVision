import { Injectable } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { computeFlowGrid } from '../../common/diagram-layout.util';
import { DiagramLayoutResultEntity } from '../../common/entities/diagram-layout.entity';

const GRID = { boxWidth: 260, boxHeight: 170, gapX: 80, gapY: 90, margin: 40, maxPerRow: 4 };

/**
 * Dispose automatiquement les applications du diagramme de composants en grille
 * et persiste `Application.positionX/positionY`. Les échanges applicatifs déjà
 * saisis sont tracés tels quels par l'éditeur.
 */
@Injectable()
export class ApplicationsLayoutService {
  constructor(private readonly prisma: PrismaService) {}

  async generateAndPersist(organisationId: string): Promise<DiagramLayoutResultEntity> {
    const applications = await this.prisma.application.findMany({
      where: { organisationId },
      orderBy: { nom: 'asc' },
      select: { id: true },
    });

    if (applications.length === 0) {
      return { elements: [], count: 0 };
    }

    const positions = computeFlowGrid(
      applications.map((a) => a.id),
      GRID,
    );

    await this.prisma.$transaction(
      applications.map((a) =>
        this.prisma.application.update({
          where: { id: a.id },
          data: { positionX: positions.get(a.id)!.x, positionY: positions.get(a.id)!.y },
        }),
      ),
    );

    return {
      elements: applications.map((a) => ({
        id: a.id,
        positionX: positions.get(a.id)!.x,
        positionY: positions.get(a.id)!.y,
      })),
      count: applications.length,
    };
  }
}
