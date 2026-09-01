import { computeFlowGrid, computeLaneGrid, GridLayoutOptions } from './diagram-layout.util';

const OPTS: GridLayoutOptions = {
  boxWidth: 100,
  boxHeight: 40,
  gapX: 20,
  gapY: 30,
  margin: 10,
  maxPerRow: 3,
};

describe('computeFlowGrid', () => {
  it('remplit de gauche à droite puis passe à la ligne', () => {
    const pos = computeFlowGrid(['a', 'b', 'c', 'd'], OPTS);
    expect(pos.get('a')).toEqual({ x: 10, y: 10 });
    expect(pos.get('b')).toEqual({ x: 130, y: 10 });
    expect(pos.get('c')).toEqual({ x: 250, y: 10 });
    expect(pos.get('d')).toEqual({ x: 10, y: 80 }); // ligne suivante
  });

  it('renvoie une map vide pour une liste vide', () => {
    expect(computeFlowGrid([], OPTS).size).toBe(0);
  });
});

describe('computeLaneGrid', () => {
  const laneOrder = ['USER', 'APP', 'DB'] as const;

  it('une ligne par couloir non vide, éléments centrés', () => {
    const pos = computeLaneGrid(
      [
        { id: 'u1', lane: 'USER' },
        { id: 'a1', lane: 'APP' },
        { id: 'a2', lane: 'APP' },
        { id: 'd1', lane: 'DB' },
      ],
      laneOrder,
      OPTS,
    );
    // couloir APP a 2 éléments => largeur totale de référence
    expect(pos.get('a1')!.y).toBe(10 + 40 + 30); // 2e ligne
    expect(pos.get('u1')!.y).toBe(10); // 1re ligne
    expect(pos.get('d1')!.y).toBe(10 + 2 * (40 + 30)); // 3e ligne
    // u1 seul est centré sur la largeur de 2 boîtes (100+20+100=220) => x = 10 + (220-100)/2 = 70
    expect(pos.get('u1')!.x).toBe(70);
  });

  it('ignore les couloirs vides et les lanes hors laneOrder', () => {
    const pos = computeLaneGrid(
      [
        { id: 'x', lane: 'INCONNU' as 'USER' },
        { id: 'd1', lane: 'DB' },
      ],
      laneOrder,
      OPTS,
    );
    expect(pos.has('x')).toBe(false);
    expect(pos.get('d1')!.y).toBe(10); // 1re (et seule) ligne active
  });
});
