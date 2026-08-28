import { Injectable } from '@nestjs/common';
import { TypeElementArchiApplicative, TypeFluxArchiApplicative } from '@prisma/client';
import { ArchitectureApplicativeService } from './architecture-applicative.service';

const BOX_W = 160;
const BOX_H = 56;
const DB_W = 110;
const DB_H = 70;
const GAP_X = 34;
const MARGIN = 30;
const LANE_HEADER_H = 26;
const LANE_PADDING = 16;
const LANE_GAP = 22;
const LEGEND_H = 70;

interface Lane {
  key: string;
  label: string;
  color: { fill: string; stroke: string };
  types: TypeElementArchiApplicative[];
}

/** Regroupement en « couches » façon diagramme d'architecture applicative de référence : chaque couche a sa propre bande colorée, comme les zones Administration/Client/Application/Datamining du gabarit fourni. */
const LANES: Lane[] = [
  { key: 'utilisateurs', label: 'Utilisateurs', color: { fill: '#FCE8EC', stroke: '#C0244F' }, types: ['UTILISATEUR_INTERNE', 'UTILISATEUR_EXTERNE'] },
  { key: 'applicatif', label: 'Composants applicatifs', color: { fill: '#E3F2FD', stroke: '#1565C0' }, types: ['APPLICATION'] },
  { key: 'donnees', label: 'Données', color: { fill: '#E0F7FA', stroke: '#00838F' }, types: ['BASE_DE_DONNEES'] },
  { key: 'externe', label: 'Systèmes externes', color: { fill: '#FFF8E1', stroke: '#D4A017' }, types: ['SYSTEME_EXTERNE'] },
  { key: 'infra', label: 'Infrastructure & sécurité', color: { fill: '#E8F5E9', stroke: '#2E7D32' }, types: ['INFRASTRUCTURE', 'SECURITE'] },
];

const TYPE_COLOR: Record<TypeElementArchiApplicative, { fill: string; stroke: string; dashed: boolean }> = {
  UTILISATEUR_INTERNE: { fill: '#F3D9E0', stroke: '#C0244F', dashed: false },
  UTILISATEUR_EXTERNE: { fill: '#F3D9E0', stroke: '#C0244F', dashed: true },
  APPLICATION: { fill: '#BBDEFB', stroke: '#1565C0', dashed: false },
  BASE_DE_DONNEES: { fill: '#B2EBF2', stroke: '#00838F', dashed: false },
  SYSTEME_EXTERNE: { fill: '#FFECB3', stroke: '#D4A017', dashed: true },
  INFRASTRUCTURE: { fill: '#C8E6C9', stroke: '#2E7D32', dashed: false },
  SECURITE: { fill: '#FFCDD2', stroke: '#C62828', dashed: false },
};

const TYPE_LABEL: Record<TypeElementArchiApplicative, string> = {
  UTILISATEUR_INTERNE: 'Utilisateur interne',
  UTILISATEUR_EXTERNE: 'Utilisateur externe',
  APPLICATION: 'Composant applicatif',
  BASE_DE_DONNEES: 'Base de données',
  SYSTEME_EXTERNE: 'Système externe',
  INFRASTRUCTURE: 'Infrastructure',
  SECURITE: 'Sécurité',
};

const FLUX_STYLE: Record<TypeFluxArchiApplicative, { color: string; dashed: boolean }> = {
  API: { color: '#1565C0', dashed: false },
  DONNEES: { color: '#2E7D32', dashed: false },
  AUTHENTIFICATION: { color: '#C62828', dashed: true },
  RESEAU: { color: '#616161', dashed: false },
};

const FLUX_LABEL: Record<TypeFluxArchiApplicative, string> = {
  API: 'API',
  DONNEES: 'Données',
  AUTHENTIFICATION: 'Authentification',
  RESEAU: 'Réseau',
};

interface Position {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ElementLike {
  id: string;
  nom: string;
  type: TypeElementArchiApplicative;
}

interface FluxLike {
  id: string;
  type: TypeFluxArchiApplicative;
  label?: string | null;
  sourceId: string;
  targetId: string;
}

export interface ArchitectureApplicativeViewResult {
  svg: string;
  elementCount: number;
  fluxCount: number;
}

@Injectable()
export class ArchitectureApplicativeViewService {
  constructor(private readonly service: ArchitectureApplicativeService) {}

  async generate(organisationId: string): Promise<ArchitectureApplicativeViewResult> {
    const [elements, fluxAll] = await Promise.all([
      this.service.findAllElements(organisationId) as unknown as ElementLike[],
      this.service.findAllFlux(organisationId) as unknown as FluxLike[],
    ]);

    if (elements.length === 0) {
      return {
        svg: this.buildEmptySvg("Aucun élément d'architecture applicative pour cette organisation."),
        elementCount: 0,
        fluxCount: 0,
      };
    }

    const byType = new Map<TypeElementArchiApplicative, ElementLike[]>();
    for (const el of elements) {
      if (!byType.has(el.type)) byType.set(el.type, []);
      byType.get(el.type)!.push(el);
    }

    const activeLanes = LANES.filter((lane) => lane.types.some((t) => (byType.get(t)?.length ?? 0) > 0));

    const positions = new Map<string, Position>();
    let maxWidth = MARGIN * 2;
    let cursorY = MARGIN;
    const laneRects: { lane: Lane; y: number; h: number }[] = [];

    for (const lane of activeLanes) {
      const laneElements = lane.types.flatMap((t) => byType.get(t) ?? []);
      let cursorX = MARGIN + LANE_PADDING;
      const rowY = cursorY + LANE_HEADER_H + LANE_PADDING;
      let rowMaxH = 0;
      for (const el of laneElements) {
        const size = this.shapeSize(el.type);
        positions.set(el.id, { x: cursorX, y: rowY + (size.h < BOX_H ? (BOX_H - size.h) / 2 : 0), w: size.w, h: size.h });
        cursorX += size.w + GAP_X;
        rowMaxH = Math.max(rowMaxH, size.h);
      }
      const laneH = LANE_HEADER_H + LANE_PADDING * 2 + Math.max(rowMaxH, BOX_H);
      laneRects.push({ lane, y: cursorY, h: laneH });
      maxWidth = Math.max(maxWidth, cursorX + LANE_PADDING);
      cursorY += laneH + LANE_GAP;
    }

    const width = maxWidth;
    const height = cursorY - LANE_GAP + MARGIN + LEGEND_H;

    const lanesSvg = laneRects
      .map(({ lane, y, h }) => this.renderLane(lane, y, h, width))
      .join('\n');

    const visibleFlux = fluxAll.filter((f) => positions.has(f.sourceId) && positions.has(f.targetId));
    const fluxSvg = visibleFlux.map((f) => this.renderFlux(f, positions)).join('\n');

    const boxesSvg = elements
      .filter((el) => positions.has(el.id))
      .map((el) => this.renderElement(el, positions.get(el.id)!))
      .join('\n');

    const legendSvg = this.renderLegend(width, height - LEGEND_H + 10);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="Arial, sans-serif">
${this.defs()}
${lanesSvg}
${fluxSvg}
${boxesSvg}
${legendSvg}
</svg>`;

    return { svg, elementCount: elements.length, fluxCount: visibleFlux.length };
  }

  private shapeSize(type: TypeElementArchiApplicative): { w: number; h: number } {
    return type === 'BASE_DE_DONNEES' ? { w: DB_W, h: DB_H } : { w: BOX_W, h: BOX_H };
  }

  private renderLane(lane: Lane, y: number, h: number, width: number): string {
    const laneW = width - MARGIN * 2;
    return `<g>
  <rect x="${MARGIN}" y="${y}" width="${laneW}" height="${h}" rx="8" fill="#FAFBFC" stroke="${lane.color.stroke}" stroke-width="1" stroke-dasharray="2,3" />
  <rect x="${MARGIN}" y="${y}" width="${laneW}" height="${LANE_HEADER_H}" rx="8" fill="${lane.color.fill}" stroke="${lane.color.stroke}" stroke-width="1" />
  <rect x="${MARGIN}" y="${y + LANE_HEADER_H - 8}" width="${laneW}" height="8" fill="${lane.color.fill}" />
  <text x="${MARGIN + 10}" y="${y + 17}" font-size="12" font-weight="bold" fill="${lane.color.stroke}">${this.escape(lane.label)}</text>
</g>`;
  }

  private renderElement(element: ElementLike, pos: Position): string {
    const { x, y, w, h } = pos;
    const color = TYPE_COLOR[element.type];
    const dash = color.dashed ? ' stroke-dasharray="5,3"' : '';

    if (element.type === 'BASE_DE_DONNEES') {
      const cx = x + w / 2;
      const ellipseRy = 8;
      return `<g>
  <path d="M${x},${y + ellipseRy} L${x},${y + h - ellipseRy} A${w / 2},${ellipseRy} 0 0 0 ${x + w},${y + h - ellipseRy} L${x + w},${y + ellipseRy}" fill="${color.fill}" stroke="${color.stroke}" stroke-width="1.5" />
  <ellipse cx="${cx}" cy="${y + ellipseRy}" rx="${w / 2}" ry="${ellipseRy}" fill="${color.fill}" stroke="${color.stroke}" stroke-width="1.5" />
  <text x="${cx}" y="${y + h + 16}" font-size="10.5" text-anchor="middle" fill="#1a1a1a">${this.wrap(element.nom, 18, cx)}</text>
</g>`;
    }

    const pictogram = this.renderPictogram(element.type, x, y, color.stroke);
    return `<g>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${color.fill}" stroke="${color.stroke}" stroke-width="1.5"${dash} />
  ${pictogram}
  <text x="${x + w / 2}" y="${y + h / 2 + 4}" font-size="11" text-anchor="middle" fill="#1a1a1a">${this.wrap(element.nom, 18, x + w / 2)}</text>
</g>`;
  }

  /** Pictogramme distinctif en haut à droite, même convention que le diagramme ArchiMate. */
  private renderPictogram(type: TypeElementArchiApplicative, x: number, y: number, c: string): string {
    const icx = x + BOX_W - 12;
    const icy = y + 12;
    switch (type) {
      case 'UTILISATEUR_INTERNE':
      case 'UTILISATEUR_EXTERNE':
        return `<circle cx="${icx}" cy="${icy - 4}" r="2" fill="none" stroke="${c}" stroke-width="1.1" />
  <path d="M${icx - 4},${icy + 5} Q${icx},${icy - 1} ${icx + 4},${icy + 5}" fill="none" stroke="${c}" stroke-width="1.1" stroke-linecap="round" />`;
      case 'APPLICATION':
        return `<rect x="${icx - 6}" y="${icy - 6}" width="12" height="3" rx="1" fill="${c}" />
  <rect x="${icx - 6}" y="${icy - 1.5}" width="12" height="3" rx="1" fill="${c}" />
  <rect x="${icx - 6}" y="${icy + 3}" width="8" height="3" rx="1" fill="${c}" />`;
      case 'SYSTEME_EXTERNE':
        return `<circle cx="${icx - 3}" cy="${icy}" r="4" fill="none" stroke="${c}" stroke-width="1.2" />
  <circle cx="${icx + 3}" cy="${icy}" r="4" fill="none" stroke="${c}" stroke-width="1.2" />`;
      case 'INFRASTRUCTURE':
        return `<rect x="${icx - 6}" y="${icy - 7}" width="12" height="5" rx="1" fill="none" stroke="${c}" stroke-width="1" />
  <rect x="${icx - 6}" y="${icy - 1}" width="12" height="5" rx="1" fill="none" stroke="${c}" stroke-width="1" />
  <circle cx="${icx - 4}" cy="${icy - 4.5}" r="0.7" fill="${c}" />
  <circle cx="${icx - 4}" cy="${icy + 1.5}" r="0.7" fill="${c}" />`;
      case 'SECURITE':
        return `<path d="M${icx},${icy - 7} L${icx + 6},${icy - 4.5} L${icx + 6},${icy + 1} Q${icx + 6},${icy + 6} ${icx},${icy + 8} Q${icx - 6},${icy + 6} ${icx - 6},${icy + 1} L${icx - 6},${icy - 4.5} Z" fill="none" stroke="${c}" stroke-width="1.2" stroke-linejoin="round" />`;
      default:
        return '';
    }
  }

  private renderFlux(flux: FluxLike, positions: Map<string, Position>): string {
    const from = positions.get(flux.sourceId)!;
    const to = positions.get(flux.targetId)!;
    const start = this.borderPoint(from, to);
    const end = this.borderPoint(to, from);
    const style = FLUX_STYLE[flux.type];
    const dash = style.dashed ? ` stroke-dasharray="6,4"` : '';
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const label = flux.label
      ? `<text x="${midX}" y="${midY - 5}" font-size="9" text-anchor="middle" fill="${style.color}">${this.escape(flux.label)}</text>`
      : '';

    return `<g>
  <line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="${style.color}" stroke-width="1.6"${dash} marker-end="url(#flux-arrow-${flux.type.toLowerCase()})" />
  ${label}
</g>`;
  }

  private renderLegend(width: number, y: number): string {
    const typeEntries = Object.entries(TYPE_LABEL) as [TypeElementArchiApplicative, string][];
    const fluxEntries = Object.entries(FLUX_LABEL) as [TypeFluxArchiApplicative, string][];

    const swatchesPerRow = 4;
    const colW = (width - MARGIN * 2) / swatchesPerRow;

    const typeSwatches = typeEntries
      .map(([type, label], i) => {
        const col = i % swatchesPerRow;
        const row = Math.floor(i / swatchesPerRow);
        const sx = MARGIN + col * colW;
        const sy = y + row * 16;
        const color = TYPE_COLOR[type];
        return `<rect x="${sx}" y="${sy}" width="10" height="10" rx="2" fill="${color.fill}" stroke="${color.stroke}" stroke-width="1" />
  <text x="${sx + 14}" y="${sy + 9}" font-size="9" fill="#333">${this.escape(label)}</text>`;
      })
      .join('\n');

    const legendRows = Math.ceil(typeEntries.length / swatchesPerRow);
    const fluxY = y + legendRows * 16 + 10;
    const fluxSwatches = fluxEntries
      .map(([type, label], i) => {
        const sx = MARGIN + i * colW;
        const style = FLUX_STYLE[type];
        const dash = style.dashed ? ' stroke-dasharray="4,3"' : '';
        return `<line x1="${sx}" y1="${fluxY + 5}" x2="${sx + 16}" y2="${fluxY + 5}" stroke="${style.color}" stroke-width="1.6"${dash} />
  <text x="${sx + 20}" y="${fluxY + 8}" font-size="9" fill="#333">${this.escape(label)}</text>`;
      })
      .join('\n');

    return `<g>
${typeSwatches}
${fluxSwatches}
</g>`;
  }

  private borderPoint(from: Position, to: Position): { x: number; y: number } {
    const fromCx = from.x + from.w / 2;
    const fromCy = from.y + from.h / 2;
    const toCx = to.x + to.w / 2;
    const toCy = to.y + to.h / 2;
    const dx = toCx - fromCx;
    const dy = toCy - fromCy;
    if (dx === 0 && dy === 0) return { x: fromCx, y: fromCy };
    const halfW = from.w / 2;
    const halfH = from.h / 2;
    const scale = Math.min(dx !== 0 ? Math.abs(halfW / dx) : Infinity, dy !== 0 ? Math.abs(halfH / dy) : Infinity);
    return { x: fromCx + dx * scale, y: fromCy + dy * scale };
  }

  private defs(): string {
    const markers = (Object.keys(FLUX_STYLE) as TypeFluxArchiApplicative[])
      .map((type) => {
        const color = FLUX_STYLE[type].color;
        return `<marker id="flux-arrow-${type.toLowerCase()}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="${color}" />
  </marker>`;
      })
      .join('\n  ');
    return `<defs>\n  ${markers}\n</defs>`;
  }

  private buildEmptySvg(message: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="400" height="120" font-family="Arial, sans-serif">
  <rect x="0" y="0" width="400" height="120" fill="#FAFAFA" stroke="#DDD" />
  <text x="200" y="60" font-size="13" text-anchor="middle" fill="#666">${this.escape(message)}</text>
</svg>`;
  }

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
