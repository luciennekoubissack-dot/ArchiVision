import { Injectable } from '@nestjs/common';
import { TypeElement, TypeRelation } from '@prisma/client';
import { ArchimateService } from './archimate.service';

const BOX_WIDTH = 170;
const BOX_HEIGHT = 56;
const GAP_X = 50;
const GAP_Y = 90;
const MARGIN = 40;

const ROW_ORDER: TypeElement[] = [
  TypeElement.ACTEUR_METIER,
  TypeElement.ROLE_METIER,
  TypeElement.PROCESSUS_METIER,
  TypeElement.SERVICE_METIER,
  TypeElement.OBJET_METIER,
];

const TYPE_LABEL: Record<TypeElement, string> = {
  ACTEUR_METIER: 'Acteur métier',
  ROLE_METIER: 'Rôle métier',
  PROCESSUS_METIER: 'Processus métier',
  SERVICE_METIER: 'Service métier',
  OBJET_METIER: 'Objet métier',
};

const RELATION_LABEL: Record<TypeRelation, string> = {
  ASSIGNATION: 'assignation',
  COMPOSITION: 'composition',
  REALISATION: 'réalisation',
  ASSOCIATION: 'association',
};

interface Position {
  x: number;
  y: number;
  cx: number;
  cy: number;
}

interface ElementLike {
  id: string;
  nom: string;
  type: TypeElement;
}

interface RelationLike {
  id: string;
  type: TypeRelation;
  source: ElementLike;
  target: ElementLike;
}

export interface ArchimateViewResult {
  svg: string;
  elementCount: number;
  relationCount: number;
}

@Injectable()
export class ArchimateViewService {
  constructor(private readonly archimateService: ArchimateService) {}

  async generate(organisationId: string): Promise<ArchimateViewResult> {
    const [elements, relations] = await Promise.all([
      this.archimateService.findAllElements(organisationId) as unknown as ElementLike[],
      this.archimateService.findAllRelations(organisationId) as unknown as RelationLike[],
    ]);

    if (elements.length === 0) {
      return {
        svg: this.buildEmptySvg('Aucun élément ArchiMate pour cette organisation.'),
        elementCount: 0,
        relationCount: relations.length,
      };
    }

    const byRow = new Map<TypeElement, ElementLike[]>();
    for (const type of ROW_ORDER) byRow.set(type, []);
    for (const element of elements) {
      byRow.get(element.type)?.push(element);
    }

    const maxPerRow = Math.max(...ROW_ORDER.map((type) => byRow.get(type)!.length), 1);
    const width = MARGIN * 2 + maxPerRow * BOX_WIDTH + (maxPerRow - 1) * GAP_X;
    const activeRows = ROW_ORDER.filter((type) => byRow.get(type)!.length > 0);
    const height = MARGIN * 2 + activeRows.length * BOX_HEIGHT + (activeRows.length - 1) * GAP_Y;

    const positions = new Map<string, Position>();
    let rowIndex = 0;
    for (const type of ROW_ORDER) {
      const rowElements = byRow.get(type)!;
      if (rowElements.length === 0) continue;
      const rowWidth = rowElements.length * BOX_WIDTH + (rowElements.length - 1) * GAP_X;
      const rowStartX = MARGIN + (width - MARGIN * 2 - rowWidth) / 2;
      const y = MARGIN + rowIndex * (BOX_HEIGHT + GAP_Y);
      rowElements.forEach((element, i) => {
        const x = rowStartX + i * (BOX_WIDTH + GAP_X);
        positions.set(element.id, { x, y, cx: x + BOX_WIDTH / 2, cy: y + BOX_HEIGHT / 2 });
      });
      rowIndex += 1;
    }

    const boxesSvg = elements
      .map((element) => this.renderBox(element, positions.get(element.id)!))
      .join('\n');

    const relationsSvg = relations
      .filter((r) => positions.has(r.source.id) && positions.has(r.target.id))
      .map((relation) => this.renderRelation(relation, positions))
      .join('\n');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="Arial, sans-serif">
${this.defs()}
${relationsSvg}
${boxesSvg}
</svg>`;

    return { svg, elementCount: elements.length, relationCount: relations.length };
  }

  private renderBox(element: ElementLike, pos: Position): string {
    const { x, y } = pos;
    return `<g>
  <rect x="${x}" y="${y}" width="${BOX_WIDTH}" height="${BOX_HEIGHT}" rx="4" fill="#FFFFB3" stroke="#C6A700" stroke-width="1.5" />
  <text x="${x + 8}" y="${y + 16}" font-size="9" fill="#7A6400">${this.escape(TYPE_LABEL[element.type])}</text>
  <text x="${x + BOX_WIDTH / 2}" y="${y + BOX_HEIGHT / 2 + 12}" font-size="12" text-anchor="middle" fill="#1a1a1a">${this.escape(this.truncate(element.nom, 28))}</text>
</g>`;
  }

  private renderRelation(relation: RelationLike, positions: Map<string, Position>): string {
    const from = positions.get(relation.source.id)!;
    const to = positions.get(relation.target.id)!;

    const start = this.rectBorderPoint(from, to);
    const end = this.rectBorderPoint(to, from);
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    let strokeDash = '';
    let markerStart = '';
    let markerEnd = '';
    switch (relation.type) {
      case TypeRelation.ASSIGNATION:
        markerEnd = 'marker-end="url(#arrow)"';
        break;
      case TypeRelation.COMPOSITION:
        markerStart = 'marker-start="url(#diamond)"';
        break;
      case TypeRelation.REALISATION:
        strokeDash = 'stroke-dasharray="6,4"';
        markerEnd = 'marker-end="url(#hollow-triangle)"';
        break;
      case TypeRelation.ASSOCIATION:
        break;
    }

    return `<g>
  <line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="#555" stroke-width="1.5" ${strokeDash} ${markerStart} ${markerEnd} />
  <text x="${midX}" y="${midY - 4}" font-size="9" text-anchor="middle" fill="#555">${this.escape(RELATION_LABEL[relation.type])}</text>
</g>`;
  }

  /** Point sur le bord du rectangle centré en `from`, en direction de `to`. */
  private rectBorderPoint(from: Position, to: Position): { x: number; y: number } {
    const dx = to.cx - from.cx;
    const dy = to.cy - from.cy;
    if (dx === 0 && dy === 0) return { x: from.cx, y: from.cy };
    const halfW = BOX_WIDTH / 2;
    const halfH = BOX_HEIGHT / 2;
    const scale = Math.min(
      dx !== 0 ? Math.abs(halfW / dx) : Infinity,
      dy !== 0 ? Math.abs(halfH / dy) : Infinity,
    );
    return { x: from.cx + dx * scale, y: from.cy + dy * scale };
  }

  private defs(): string {
    return `<defs>
  <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="#555" />
  </marker>
  <marker id="hollow-triangle" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="white" stroke="#555" stroke-width="1" />
  </marker>
  <marker id="diamond" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="9" markerHeight="9" orient="auto">
    <path d="M0,5 L5,0 L10,5 L5,10 z" fill="#555" />
  </marker>
</defs>`;
  }

  private buildEmptySvg(message: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="400" height="120" font-family="Arial, sans-serif">
  <rect x="0" y="0" width="400" height="120" fill="#FAFAFA" stroke="#DDD" />
  <text x="200" y="60" font-size="13" text-anchor="middle" fill="#666">${this.escape(message)}</text>
</svg>`;
  }

  private truncate(value: string, max: number): string {
    return value.length > max ? `${value.slice(0, max - 1)}…` : value;
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
