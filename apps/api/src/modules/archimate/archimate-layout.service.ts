import { Injectable } from '@nestjs/common';
import { ArchimateService } from './archimate.service';
import { computeGridLayout } from './layout.util';
import { ROW_ORDER } from './archimate-view.service';

const BOX_WIDTH = 170;
const BOX_HEIGHT = 56;
const GAP_X = 50;
const GAP_Y = 90;
const MARGIN = 40;

export interface GenerateLayoutResult {
  elements: unknown[];
  elementCount: number;
}

/** Calcule un auto-layout en grille (identique à la vue SVG) et le persiste
 * sur `ElementArchimate.positionX/positionY`, pour alimenter le canevas. */
@Injectable()
export class ArchimateLayoutService {
  constructor(private readonly archimateService: ArchimateService) {}

  async generateAndPersist(organisationId: string): Promise<GenerateLayoutResult> {
    const result = await this.archimateService.findAllElements(organisationId);
    // Sans pagination demandée, findAllElements renvoie toujours un tableau
    // complet ; ce garde satisfait le typage (voir paginateFindMany).
    const elements = Array.isArray(result) ? result : result.items;

    if (elements.length === 0) {
      return { elements: [], elementCount: 0 };
    }

    const { positions } = computeGridLayout(elements, ROW_ORDER, {
      boxWidth: BOX_WIDTH,
      boxHeight: BOX_HEIGHT,
      gapX: GAP_X,
      gapY: GAP_Y,
      margin: MARGIN,
    });

    const items = elements.map((element) => {
      const pos = positions.get(element.id)!;
      return { id: element.id, positionX: pos.x, positionY: pos.y };
    });

    const updated = await this.archimateService.updateElementPositionsBatch(organisationId, items);
    return { elements: updated, elementCount: updated.length };
  }
}
