import { Injectable } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { computeFlowGrid } from '../../common/diagram-layout.util';
import { DiagramLayoutResultEntity } from '../../common/entities/diagram-layout.entity';
import { inferForeignKeyRelations } from './donnees-relations.util';

const GRID = { boxWidth: 240, boxHeight: 150, gapX: 60, gapY: 70, margin: 40, maxPerRow: 4 };

/**
 * Dispose automatiquement les entités de données en grille et persiste
 * `DataEntity.positionX/positionY`. Déduit en plus les relations manquantes à
 * partir des attributs de type clé étrangère (voir `donnees-relations.util`).
 */
@Injectable()
export class DonneesLayoutService {
  constructor(private readonly prisma: PrismaService) {}

  async generateAndPersist(organisationId: string): Promise<DiagramLayoutResultEntity> {
    const entities = await this.prisma.dataEntity.findMany({
      where: { organisationId },
      orderBy: { nom: 'asc' },
      include: { attributs: { select: { nom: true } } },
    });

    if (entities.length === 0) {
      return { elements: [], count: 0, relationsInfereesCount: 0 };
    }

    const positions = computeFlowGrid(
      entities.map((e) => e.id),
      GRID,
    );

    const existing = await this.prisma.dataRelation.findMany({
      where: { source: { organisationId } },
      select: { sourceId: true, targetId: true },
    });
    const inferred = inferForeignKeyRelations(
      entities.map((e) => ({ id: e.id, nom: e.nom, attributs: e.attributs })),
      existing,
    );

    await this.prisma.$transaction([
      ...entities.map((e) =>
        this.prisma.dataEntity.update({
          where: { id: e.id },
          data: { positionX: positions.get(e.id)!.x, positionY: positions.get(e.id)!.y },
        }),
      ),
      ...inferred.map((r) =>
        this.prisma.dataRelation.create({
          data: {
            sourceId: r.sourceId,
            targetId: r.targetId,
            cardinalite: r.cardinalite,
            label: r.label,
          },
        }),
      ),
    ]);

    return {
      elements: entities.map((e) => ({
        id: e.id,
        positionX: positions.get(e.id)!.x,
        positionY: positions.get(e.id)!.y,
      })),
      count: entities.length,
      relationsInfereesCount: inferred.length,
    };
  }
}
