import { Injectable } from '@nestjs/common';
import { ElementKind, TypeElement, TypeRelation } from '@prisma/client';
import { PrismaService } from '@archivision/infrastructure';
import { ArchimateService } from './archimate.service';
import { computeGridLayout } from './layout.util';

const BOX_WIDTH = 170;
const BOX_HEIGHT = 56;
const GAP_X = 50;
const GAP_Y = 90;
const MARGIN = 40;

/** Couche Motivation en premier (au-dessus), puis couche Métier. */
export const ROW_ORDER: string[] = [
  TypeElement.VISION,
  TypeElement.OBJECTIF_ARCHIMATE,
  TypeElement.PRINCIPE,
  TypeElement.EXIGENCE,
  TypeElement.ACTEUR_METIER,
  TypeElement.ROLE_METIER,
  TypeElement.PROCESSUS_METIER,
  TypeElement.SERVICE_METIER,
  TypeElement.OBJET_METIER,
  'DATA_ENTITY',
  'APPLICATION',
  'TECH_COMPONENT',
];

const MOTIVATION_TYPES = new Set<string>([
  TypeElement.VISION,
  TypeElement.OBJECTIF_ARCHIMATE,
  TypeElement.PRINCIPE,
  TypeElement.EXIGENCE,
]);

/**
 * Palette de couches inspirée de la convention ArchiMate : la Motivation et
 * le Métier sont jaunes, avec une nuance différente pour rester lisibles dans
 * une vue combinée. Les autres couches ne sont pas encore modélisées ici.
 */
const TYPE_COLOR = (type: string): { fill: string; stroke: string; text: string } => {
  if (MOTIVATION_TYPES.has(type)) return { fill: '#FFF2CC', stroke: '#C9A227', text: '#5C4700' };
  if (type === 'DATA_ENTITY') return { fill: '#E8F1FB', stroke: '#4A78A8', text: '#234568' };
  if (type === 'APPLICATION') return { fill: '#DCEBFA', stroke: '#3D78B5', text: '#1E4D7A' };
  if (type === 'TECH_COMPONENT') return { fill: '#E2F0D9', stroke: '#548235', text: '#31521F' };
  return { fill: '#FFF8E1', stroke: '#D4A017', text: '#5C4A00' };
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
  type: string;
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
  constructor(
    private readonly archimateService: ArchimateService,
    private readonly prisma: PrismaService,
  ) {}

  async generate(organisationId: string): Promise<ArchimateViewResult> {
    const [archimateElements, archimateRelations, dataEntities, applications, techComponents, canevasRelations] = await Promise.all([
      this.archimateService.findAllElements(organisationId) as unknown as ElementLike[],
      this.archimateService.findAllRelations(organisationId) as unknown as RelationLike[],
      this.prisma.dataEntity.findMany({ where: { organisationId }, select: { id: true, nom: true } }),
      this.prisma.application.findMany({ where: { organisationId }, select: { id: true, nom: true } }),
      this.prisma.techComponent.findMany({ where: { organisationId }, select: { id: true, nom: true } }),
      this.prisma.canevasRelation.findMany({ where: { organisationId } }),
    ]);

    const elements: ElementLike[] = [
      ...archimateElements,
      ...dataEntities.map((item) => ({ ...item, type: 'DATA_ENTITY' })),
      ...applications.map((item) => ({ ...item, type: 'APPLICATION' })),
      ...techComponents.map((item) => ({ ...item, type: 'TECH_COMPONENT' })),
    ];
    const byKey = new Map<string, ElementLike>([
      ...archimateElements.map((item) => [`${ElementKind.ARCHIMATE}:${item.id}`, item] as const),
      ...dataEntities.map((item) => [`${ElementKind.DATA_ENTITY}:${item.id}`, { ...item, type: 'DATA_ENTITY' }] as const),
      ...applications.map((item) => [`${ElementKind.APPLICATION}:${item.id}`, { ...item, type: 'APPLICATION' }] as const),
      ...techComponents.map((item) => [`${ElementKind.TECH_COMPONENT}:${item.id}`, { ...item, type: 'TECH_COMPONENT' }] as const),
    ]);
    const interLayerRelations: RelationLike[] = canevasRelations.flatMap((relation) => {
      const source = byKey.get(`${relation.sourceKind}:${relation.sourceId}`);
      const target = byKey.get(`${relation.targetKind}:${relation.targetId}`);
      return source && target ? [{ id: relation.id, type: relation.type, source, target }] : [];
    });

    return this.render(elements, [...archimateRelations, ...interLayerRelations], 'Aucun élément ArchiMate ou d\'architecture pour cette organisation.');
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

    const visibleRelations = relations.filter((r) => positions.has(r.source.id) && positions.has(r.target.id));
    // Compte le rang de chaque relation parmi celles qui partagent la même paire
    // source→cible, pour les répartir en éventail plutôt que de les superposer
    // exactement (deux éléments peuvent légitimement avoir plusieurs relations,
    // ex. une association ET une réalisation).
    const pairSeen = new Map<string, number>();
    const relationsSvg = visibleRelations
      .map((relation) => {
        const key = `${relation.source.id}→${relation.target.id}`;
        const rank = pairSeen.get(key) ?? 0;
        pairSeen.set(key, rank + 1);
        return this.renderRelation(relation, positions, rank);
      })
      .join('\n');

    const legendHeight = 92;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height + legendHeight}" width="${width}" height="${height + legendHeight}" font-family="Arial, sans-serif">
${this.defs()}
${relationsSvg}
${boxesSvg}
  ${this.renderLegend(height)}
</svg>`;

    return { svg, elementCount: elements.length, relationCount: relations.length };
  }

  /**
   * Boîte façon notation ArchiMate officielle : forme + pictogramme distinctif
   * en haut à droite (convention Archi) + nom seul, centré et réparti sur
   * jusqu'à 2 lignes — sans étiquette de type séparée, pour rester fidèle au
   * gabarit de référence (archimate-template.png).
   */
  private renderBox(element: ElementLike, pos: Position): string {
    const { x, y, cx, cy } = pos;
    const color = TYPE_COLOR(element.type);
    const shape = this.renderShape(element.type, x, y, color);
    const pictogram = this.renderPictogram(element.type, x, y, color.text);
    return `<g>
  ${shape}
  ${pictogram}
  <text x="${cx}" y="${cy + 4}" font-size="11" text-anchor="middle" fill="#1a1a1a">${this.wrap(element.nom, 22, cx)}</text>
</g>`;
  }

  /** Forme de la boîte selon le type — pilule pour un service, coin coupé pour une exigence, rectangle sinon. */
  private renderShape(type: string, x: number, y: number, color: { fill: string; stroke: string }): string {
    if (type === TypeElement.SERVICE_METIER || type === 'APPLICATION') {
      return `<rect x="${x}" y="${y}" width="${BOX_WIDTH}" height="${BOX_HEIGHT}" rx="${BOX_HEIGHT / 2}" fill="${color.fill}" stroke="${color.stroke}" stroke-width="1.5" />`;
    }
    if (type === TypeElement.EXIGENCE || type === 'DATA_ENTITY') {
      const cut = 16;
      const w = BOX_WIDTH;
      const h = BOX_HEIGHT;
      return `<path d="M${x},${y} L${x + w - cut},${y} L${x + w},${y + cut} L${x + w},${y + h} L${x},${y + h} Z" fill="${color.fill}" stroke="${color.stroke}" stroke-width="1.5" stroke-linejoin="round" />`;
    }
    if (type === TypeElement.OBJET_METIER || type === 'TECH_COMPONENT') {
      return `<rect x="${x}" y="${y}" width="${BOX_WIDTH}" height="${BOX_HEIGHT}" rx="2" fill="${color.fill}" stroke="${color.stroke}" stroke-width="1.5" />`;
    }
    return `<rect x="${x}" y="${y}" width="${BOX_WIDTH}" height="${BOX_HEIGHT}" rx="4" fill="${color.fill}" stroke="${color.stroke}" stroke-width="1.5" />`;
  }

  /**
   * Petit pictogramme distinctif en haut à droite de la boîte — position
   * standard de la notation ArchiMate officielle (Archi, archimate-template.png).
   * Sans classificateur reconnu, aucun glyphe n'est dessiné (forme + couleur
   * de couche suffisent à identifier l'élément).
   */
  private renderPictogram(type: string, x: number, y: number, c: string): string {
    const icx = x + BOX_WIDTH - 11;
    const icy = y + 11;
    switch (type) {
      case TypeElement.VISION:
        return `<ellipse cx="${icx}" cy="${icy}" rx="6" ry="3.4" fill="none" stroke="${c}" stroke-width="1.1" />
  <circle cx="${icx}" cy="${icy}" r="1.6" fill="${c}" />`;
      case TypeElement.OBJECTIF_ARCHIMATE:
        return `<circle cx="${icx}" cy="${icy}" r="5" fill="none" stroke="${c}" stroke-width="1" />
  <circle cx="${icx}" cy="${icy}" r="2.6" fill="none" stroke="${c}" stroke-width="1" />
  <circle cx="${icx}" cy="${icy}" r="0.9" fill="${c}" />`;
      case TypeElement.PRINCIPE:
        return `<line x1="${icx - 4}" y1="${icy - 5}" x2="${icx - 4}" y2="${icy + 5}" stroke="${c}" stroke-width="1.1" stroke-linecap="round" />
  <path d="M${icx - 4},${icy - 5} L${icx + 4},${icy - 2.5} L${icx - 4},${icy} Z" fill="${c}" />`;
      case TypeElement.EXIGENCE: {
        const fx = x + BOX_WIDTH - 9;
        const fy = y + 8;
        return `<path d="M${fx - 6},${fy + 5} L${fx},${fy - 1} M${fx - 3},${fy - 1} L${fx},${fy - 1} L${fx},${fy + 2}" fill="none" stroke="${c}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" />`;
      }
      case TypeElement.ACTEUR_METIER:
        return `<circle cx="${icx}" cy="${icy - 4}" r="1.8" fill="none" stroke="${c}" stroke-width="1.1" />
  <line x1="${icx}" y1="${icy - 2}" x2="${icx}" y2="${icy + 3}" stroke="${c}" stroke-width="1.1" stroke-linecap="round" />
  <line x1="${icx - 3}" y1="${icy}" x2="${icx + 3}" y2="${icy}" stroke="${c}" stroke-width="1.1" stroke-linecap="round" />
  <line x1="${icx}" y1="${icy + 3}" x2="${icx - 2.5}" y2="${icy + 6}" stroke="${c}" stroke-width="1.1" stroke-linecap="round" />
  <line x1="${icx}" y1="${icy + 3}" x2="${icx + 2.5}" y2="${icy + 6}" stroke="${c}" stroke-width="1.1" stroke-linecap="round" />`;
      case TypeElement.ROLE_METIER:
        return `<circle cx="${icx}" cy="${icy - 3}" r="3" fill="none" stroke="${c}" stroke-width="1.1" />
  <line x1="${icx}" y1="${icy}" x2="${icx}" y2="${icy + 6}" stroke="${c}" stroke-width="1.1" stroke-linecap="round" />`;
      case TypeElement.PROCESSUS_METIER:
        return `<path d="M${icx - 3},${icy - 4} L${icx + 3},${icy} L${icx - 3},${icy + 4}" fill="none" stroke="${c}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />`;
      case TypeElement.SERVICE_METIER:
        return `<path d="M${icx - 4},${icy} A4,4 0 1 1 ${icx},${icy + 4}" fill="none" stroke="${c}" stroke-width="1.1" />
  <path d="M${icx - 1.5},${icy + 4.8} L${icx},${icy + 4} L${icx + 0.3},${icy + 1.8}" fill="none" stroke="${c}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" />`;
      case TypeElement.OBJET_METIER:
        return `<rect x="${icx - 5}" y="${icy - 5}" width="10" height="10" fill="none" stroke="${c}" stroke-width="1" />
  <line x1="${icx - 5}" y1="${icy - 2}" x2="${icx + 5}" y2="${icy - 2}" stroke="${c}" stroke-width="1" />`;
      case 'DATA_ENTITY':
        return `<path d="M${icx - 5},${icy - 4} Q${icx},${icy - 8} ${icx + 5},${icy - 4} L${icx + 5},${icy + 5} Q${icx},${icy + 9} ${icx - 5},${icy + 5} Z" fill="none" stroke="${c}" stroke-width="1.1" />`;
      case 'APPLICATION':
        return `<rect x="${icx - 5}" y="${icy - 5}" width="10" height="10" rx="1" fill="none" stroke="${c}" stroke-width="1.1" /><path d="M${icx - 3},${icy + 2} L${icx - 1},${icy - 1} L${icx + 1},${icy + 1} L${icx + 3},${icy - 3}" fill="none" stroke="${c}" stroke-width="1" />`;
      case 'TECH_COMPONENT':
        return `<path d="M${icx - 5},${icy - 3} L${icx},${icy - 6} L${icx + 5},${icy - 3} L${icx},${icy} Z M${icx - 5},${icy - 3} V${icy + 4} L${icx},${icy + 7} L${icx + 5},${icy + 4} V${icy - 3}" fill="none" stroke="${c}" stroke-width="1.1" />`;
      default:
        return '';
    }
  }

  /**
   * Trait de relation — pas d'étiquette de type flottante : la notation
   * ArchiMate officielle distingue chaque relation uniquement par le style
   * du trait et la pointe (cf. archimate-template.png), pas par du texte.
   * `rank` : quand plusieurs relations relient la même paire source→cible
   * (légitime, ex. une association ET une réalisation), les suivantes sont
   * dessinées en arc plutôt que superposées exactement sur la première.
   */
  private renderRelation(relation: RelationLike, positions: Map<string, Position>, rank: number): string {
    const from = positions.get(relation.source.id)!;
    const to = positions.get(relation.target.id)!;

    const start = this.rectBorderPoint(from, to);
    const end = this.rectBorderPoint(to, from);

    let strokeDash = '';
    let markerStart = '';
    let markerEnd = '';
    let startDot = '';
    switch (relation.type) {
      case TypeRelation.ASSIGNATION:
        // Assignation ArchiMate : petit disque plein à la source, flèche pleine à la cible.
        markerEnd = 'marker-end="url(#arrow)"';
        startDot = `<circle cx="${start.x}" cy="${start.y}" r="3" fill="#555" />`;
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

    const path = this.relationPath(start, end, rank);

    return `<g>
  <path d="${path}" fill="none" stroke="#555" stroke-width="1.5" ${strokeDash} ${markerStart} ${markerEnd} />
  ${startDot}
</g>`;
  }

  /** Segment droit pour la 1ère relation d'une paire, arc de cercle décalé pour les suivantes. */
  private relationPath(start: { x: number; y: number }, end: { x: number; y: number }, rank: number): string {
    if (rank === 0) {
      return `M${start.x},${start.y} L${end.x},${end.y}`;
    }
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy) || 1;
    // Normale unitaire, alternée de part et d'autre du trait à chaque rang.
    const side = rank % 2 === 1 ? 1 : -1;
    const offset = side * (14 * Math.ceil(rank / 2));
    const nx = (-dy / len) * offset;
    const ny = (dx / len) * offset;
    const cx = midX + nx;
    const cy = midY + ny;
    return `M${start.x},${start.y} Q${cx},${cy} ${end.x},${end.y}`;
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

  private renderLegend(y: number): string {
    return `<g transform="translate(40,${y + 18})">
  <text x="0" y="0" font-size="12" font-weight="bold" fill="#333">Légende ArchiMate</text>
  <rect x="0" y="12" width="16" height="12" fill="#FFF2CC" stroke="#C9A227" />
  <text x="23" y="22" font-size="10" fill="#333">Motivation</text>
  <rect x="105" y="12" width="16" height="12" fill="#FFF8E1" stroke="#D4A017" />
  <text x="128" y="22" font-size="10" fill="#333">Métier</text>
  <line x1="205" y1="18" x2="245" y2="18" stroke="#555" stroke-width="1.5" marker-end="url(#arrow)" />
  <text x="252" y="22" font-size="10" fill="#333">Assignation</text>
  <line x1="330" y1="18" x2="370" y2="18" stroke="#555" stroke-width="1.5" stroke-dasharray="6,4" marker-end="url(#hollow-triangle)" />
  <text x="377" y="22" font-size="10" fill="#333">Réalisation</text>
  <line x1="475" y1="18" x2="515" y2="18" stroke="#555" stroke-width="1.5" marker-start="url(#diamond)" />
  <text x="522" y="22" font-size="10" fill="#333">Composition</text>
  <rect x="0" y="58" width="16" height="12" fill="#E8F1FB" stroke="#4A78A8" />
  <text x="23" y="68" font-size="10" fill="#333">Données</text>
  <rect x="105" y="58" width="16" height="12" fill="#DCEBFA" stroke="#3D78B5" />
  <text x="128" y="68" font-size="10" fill="#333">Applicatif</text>
  <rect x="220" y="58" width="16" height="12" fill="#E2F0D9" stroke="#548235" />
  <text x="243" y="68" font-size="10" fill="#333">Technologique</text>
  <line x1="0" y1="42" x2="40" y2="42" stroke="#555" stroke-width="1.5" />
  <text x="47" y="46" font-size="10" fill="#333">Association</text>
</g>`;
  }

  private buildEmptySvg(message: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="400" height="120" font-family="Arial, sans-serif">
  <rect x="0" y="0" width="400" height="120" fill="#FAFAFA" stroke="#DDD" />
  <text x="200" y="60" font-size="13" text-anchor="middle" fill="#666">${this.escape(message)}</text>
</svg>`;
  }

  /** Découpe le nom en lignes tspan (max 2) pour tenir dans la boîte, centré verticalement autour de `cy`. */
  private wrap(value: string, maxCharsPerLine: number, x: number): string {
    const words = value.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > maxCharsPerLine && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    const limited = lines.slice(0, 2);
    return limited
      .map((line, i) => `<tspan x="${x}" dy="${i === 0 ? -((limited.length - 1) * 7) : 14}">${this.escape(line)}</tspan>`)
      .join('');
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
