import { Injectable } from '@nestjs/common';
import { TypeElement, TypeRelation } from '@prisma/client';
import { ArchimateService } from './archimate.service';
import { computeGridLayout } from './layout.util';

const BOX_WIDTH = 170;
const BOX_HEIGHT = 56;
const GAP_X = 50;
const GAP_Y = 90;
const MARGIN = 40;

/** Couche Motivation en premier (au-dessus), puis couche Métier. */
export const ROW_ORDER: TypeElement[] = [
  TypeElement.VISION,
  TypeElement.OBJECTIF_ARCHIMATE,
  TypeElement.PRINCIPE,
  TypeElement.EXIGENCE,
  TypeElement.ACTEUR_METIER,
  TypeElement.ROLE_METIER,
  TypeElement.PROCESSUS_METIER,
  TypeElement.SERVICE_METIER,
  TypeElement.OBJET_METIER,
];

const TYPE_LABEL: Record<TypeElement, string> = {
  VISION: 'Vision',
  OBJECTIF_ARCHIMATE: "Objectif d'architecture",
  PRINCIPE: 'Principe',
  EXIGENCE: 'Exigence',
  ACTEUR_METIER: 'Acteur métier',
  ROLE_METIER: 'Rôle métier',
  PROCESSUS_METIER: 'Processus métier',
  SERVICE_METIER: 'Service métier',
  OBJET_METIER: 'Objet métier',
};

const MOTIVATION_TYPES = new Set<TypeElement>([
  TypeElement.VISION,
  TypeElement.OBJECTIF_ARCHIMATE,
  TypeElement.PRINCIPE,
  TypeElement.EXIGENCE,
]);

/** Jaune ArchiMate pour la couche Métier, lavande pour la couche Motivation. */
const TYPE_COLOR = (type: TypeElement): { fill: string; stroke: string; text: string } =>
  MOTIVATION_TYPES.has(type)
    ? { fill: '#E6E6FA', stroke: '#7A6FBE', text: '#4A4177' }
    : { fill: '#FFFFB3', stroke: '#C6A700', text: '#7A6400' };

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

    return this.render(elements, relations, 'Aucun élément ArchiMate pour cette organisation.');
  }

  private render(elements: ElementLike[], relations: RelationLike[], emptyMessage: string): ArchimateViewResult {
    if (elements.length === 0) {
      return {
        svg: this.buildEmptySvg(emptyMessage),
        elementCount: 0,
        relationCount: relations.length,
      };
    }

    const { positions, width, height } = computeGridLayout(elements, ROW_ORDER, {
      boxWidth: BOX_WIDTH,
      boxHeight: BOX_HEIGHT,
      gapX: GAP_X,
      gapY: GAP_Y,
      margin: MARGIN,
    });

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
    const color = TYPE_COLOR(element.type);
    const shape = this.renderShape(element.type, x, y, color);
    const pictogram = this.renderPictogram(element.type, x, y, color.stroke);
    const labelX = pictogram ? x + 22 : x + 8;
    return `<g>
  ${shape}
  ${pictogram}
  <text x="${labelX}" y="${y + 16}" font-size="9" fill="${color.text}">${this.escape(TYPE_LABEL[element.type])}</text>
  <text x="${x + BOX_WIDTH / 2}" y="${y + BOX_HEIGHT / 2 + 12}" font-size="12" text-anchor="middle" fill="#1a1a1a">${this.escape(this.truncate(element.nom, 28))}</text>
</g>`;
  }

  /** Forme de la boîte selon le type — pilule pour un service, coin coupé pour une exigence, rectangle sinon. */
  private renderShape(type: TypeElement, x: number, y: number, color: { fill: string; stroke: string }): string {
    if (type === TypeElement.SERVICE_METIER) {
      return `<rect x="${x}" y="${y}" width="${BOX_WIDTH}" height="${BOX_HEIGHT}" rx="${BOX_HEIGHT / 2}" fill="${color.fill}" stroke="${color.stroke}" stroke-width="1.5" />`;
    }
    if (type === TypeElement.EXIGENCE) {
      const cut = 10;
      const w = BOX_WIDTH;
      const h = BOX_HEIGHT;
      return `<path d="M${x},${y} L${x + w - cut},${y} L${x + w},${y + cut} L${x + w},${y + h} L${x},${y + h} Z" fill="${color.fill}" stroke="${color.stroke}" stroke-width="1.5" stroke-linejoin="round" />`;
    }
    return `<rect x="${x}" y="${y}" width="${BOX_WIDTH}" height="${BOX_HEIGHT}" rx="4" fill="${color.fill}" stroke="${color.stroke}" stroke-width="1.5" />`;
  }

  /** Petit pictogramme distinctif en haut à gauche de la boîte, façon notation ArchiMate officielle. */
  private renderPictogram(type: TypeElement, x: number, y: number, stroke: string): string {
    const cx = x + 12;
    const cy = y + 10;
    switch (type) {
      case TypeElement.ACTEUR_METIER:
        return `<circle cx="${cx}" cy="${cy - 2.5}" r="2.3" fill="none" stroke="${stroke}" stroke-width="1.1" />
  <path d="M${cx - 4},${cy + 5} Q${cx},${cy - 0.5} ${cx + 4},${cy + 5}" fill="none" stroke="${stroke}" stroke-width="1.1" stroke-linecap="round" />`;
      case TypeElement.ROLE_METIER:
        return `<circle cx="${cx}" cy="${cy}" r="4" fill="none" stroke="${stroke}" stroke-width="1.1" />
  <circle cx="${cx}" cy="${cy}" r="1.3" fill="${stroke}" />`;
      case TypeElement.PROCESSUS_METIER:
        return `<path d="M${cx - 3},${cy - 4} L${cx + 3},${cy} L${cx - 3},${cy + 4}" fill="none" stroke="${stroke}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />`;
      default:
        return '';
    }
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
