/**
 * Layouts en grille génériques pour disposer automatiquement les éléments d'un
 * diagramme (données, applications, technologie, architecture applicative) sur
 * `positionX/positionY`. Déterministe, sans dépendance à un enum métier
 * particulier (contrairement à `archimate/layout.util.ts`).
 */

export interface GridLayoutOptions {
  boxWidth: number;
  boxHeight: number;
  gapX: number;
  gapY: number;
  margin: number;
  /** Nombre max d'éléments par ligne avant retour à la ligne. */
  maxPerRow: number;
}

export interface XY {
  x: number;
  y: number;
}

/**
 * Grille simple : remplit de gauche à droite, passe à la ligne au bout de
 * `maxPerRow` éléments. Ordre d'entrée conservé.
 */
export function computeFlowGrid(ids: string[], opts: GridLayoutOptions): Map<string, XY> {
  const { boxWidth, boxHeight, gapX, gapY, margin, maxPerRow } = opts;
  const perRow = Math.max(1, maxPerRow);
  const positions = new Map<string, XY>();

  ids.forEach((id, index) => {
    const col = index % perRow;
    const row = Math.floor(index / perRow);
    positions.set(id, {
      x: margin + col * (boxWidth + gapX),
      y: margin + row * (boxHeight + gapY),
    });
  });

  return positions;
}

/**
 * Grille en couloirs : une ligne par valeur de `laneOrder` (les couloirs vides
 * sont ignorés), éléments d'un couloir disposés de gauche à droite et centrés
 * sur la largeur totale. Les éléments dont le `lane` n'est pas dans `laneOrder`
 * sont ignorés.
 */
export function computeLaneGrid<L extends string>(
  items: { id: string; lane: L }[],
  laneOrder: readonly L[],
  opts: GridLayoutOptions,
): Map<string, XY> {
  const { boxWidth, boxHeight, gapX, gapY, margin } = opts;
  const positions = new Map<string, XY>();

  const byLane = new Map<L, string[]>();
  for (const lane of laneOrder) byLane.set(lane, []);
  for (const item of items) byLane.get(item.lane)?.push(item.id);

  const activeLanes = laneOrder.filter((lane) => (byLane.get(lane)?.length ?? 0) > 0);
  const maxInLane = Math.max(1, ...activeLanes.map((lane) => byLane.get(lane)!.length));
  const totalWidth = maxInLane * boxWidth + (maxInLane - 1) * gapX;

  activeLanes.forEach((lane, laneIndex) => {
    const laneIds = byLane.get(lane)!;
    const laneWidth = laneIds.length * boxWidth + (laneIds.length - 1) * gapX;
    const startX = margin + (totalWidth - laneWidth) / 2;
    const y = margin + laneIndex * (boxHeight + gapY);
    laneIds.forEach((id, i) => {
      positions.set(id, { x: startX + i * (boxWidth + gapX), y });
    });
  });

  return positions;
}
