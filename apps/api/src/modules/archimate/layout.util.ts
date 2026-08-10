import { TypeElement } from '@prisma/client';

export interface LayoutElement {
  id: string;
  type: TypeElement;
}

export interface LayoutPosition {
  x: number;
  y: number;
  cx: number;
  cy: number;
}

export interface GridLayoutOptions {
  boxWidth: number;
  boxHeight: number;
  gapX: number;
  gapY: number;
  margin: number;
}

export interface GridLayoutResult {
  positions: Map<string, LayoutPosition>;
  width: number;
  height: number;
}

/** Layout en grille : une ligne par type de `rowOrder`, éléments centrés sur chaque ligne. */
export function computeGridLayout(
  elements: LayoutElement[],
  rowOrder: TypeElement[],
  opts: GridLayoutOptions,
): GridLayoutResult {
  const { boxWidth, boxHeight, gapX, gapY, margin } = opts;

  const byRow = new Map<TypeElement, LayoutElement[]>();
  for (const type of rowOrder) byRow.set(type, []);
  for (const element of elements) {
    byRow.get(element.type)?.push(element);
  }

  const maxPerRow = Math.max(...rowOrder.map((type) => byRow.get(type)!.length), 1);
  const width = margin * 2 + maxPerRow * boxWidth + (maxPerRow - 1) * gapX;
  const activeRows = rowOrder.filter((type) => byRow.get(type)!.length > 0);
  const height = margin * 2 + activeRows.length * boxHeight + Math.max(activeRows.length - 1, 0) * gapY;

  const positions = new Map<string, LayoutPosition>();
  let rowIndex = 0;
  for (const type of rowOrder) {
    const rowElements = byRow.get(type)!;
    if (rowElements.length === 0) continue;
    const rowWidth = rowElements.length * boxWidth + (rowElements.length - 1) * gapX;
    const rowStartX = margin + (width - margin * 2 - rowWidth) / 2;
    const y = margin + rowIndex * (boxHeight + gapY);
    rowElements.forEach((element, i) => {
      const x = rowStartX + i * (boxWidth + gapX);
      positions.set(element.id, { x, y, cx: x + boxWidth / 2, cy: y + boxHeight / 2 });
    });
    rowIndex += 1;
  }

  return { positions, width, height };
}
