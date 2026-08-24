import { Injectable } from '@nestjs/common';
import { DeclencheurEvenement, TypeBpmn, TypeTache } from '@prisma/client';
import { BpmnService } from './bpmn.service';

const GAP_X = 40;
const ROW_Y = 60;
const MARGIN = 40;
/** Largeur max d'une ligne avant repli sur la ligne suivante — un processus
 * de plus d'une dizaine d'étapes sans position enregistrée reste lisible. */
const MAX_ROW_WIDTH = 1000;
const ROW_HEIGHT = 140;

interface ShapeSize {
  w: number;
  h: number;
}

const SHAPE_SIZE: Record<TypeBpmn, ShapeSize> = {
  EVENEMENT_DEBUT: { w: 48, h: 48 },
  EVENEMENT_FIN: { w: 48, h: 48 },
  EVENEMENT_INTERMEDIAIRE: { w: 48, h: 48 },
  TACHE: { w: 150, h: 64 },
  SOUS_PROCESSUS: { w: 150, h: 64 },
  PASSERELLE_EXCLUSIVE: { w: 56, h: 56 },
  PASSERELLE_PARALLELE: { w: 56, h: 56 },
  PASSERELLE_INCLUSIVE: { w: 56, h: 56 },
  PASSERELLE_EVENEMENTIELLE: { w: 56, h: 56 },
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
  type: TypeBpmn;
  declencheur?: DeclencheurEvenement | null;
  typeTache?: TypeTache | null;
  positionX?: number | null;
  positionY?: number | null;
}

interface FlowLike {
  id: string;
  label?: string | null;
  sourceId: string;
  targetId: string;
}

export interface BpmnViewResult {
  svg: string;
  elementCount: number;
  flowCount: number;
}

@Injectable()
export class BpmnViewService {
  constructor(private readonly bpmnService: BpmnService) {}

  async generate(processusId: string, organisationId: string): Promise<BpmnViewResult> {
    const processus = await this.bpmnService.findOne(processusId, organisationId);
    const elements: ElementLike[] = processus.elements;
    const flows: FlowLike[] = elements.flatMap((e: any) => e.flowsSource ?? []);

    if (elements.length === 0) {
      return { svg: this.buildEmptySvg('Aucune étape pour ce processus.'), elementCount: 0, flowCount: 0 };
    }

    const positions = this.resolvePositions(elements);
    let maxX = 0;
    let maxY = 0;
    for (const pos of positions.values()) {
      maxX = Math.max(maxX, pos.x + pos.w);
      maxY = Math.max(maxY, pos.y + pos.h + 24); // marge pour le libellé sous les événements/passerelles
    }
    const width = maxX + MARGIN;
    const height = maxY + MARGIN;

    const flowsSvg = flows
      .filter((f) => positions.has(f.sourceId) && positions.has(f.targetId))
      .map((f) => this.renderFlow(f, positions))
      .join('\n');

    const boxesSvg = elements.map((e) => this.renderBox(e, positions.get(e.id)!)).join('\n');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="Arial, sans-serif">
${this.defs()}
${flowsSvg}
${boxesSvg}
</svg>`;

    return { svg, elementCount: elements.length, flowCount: flows.length };
  }

  /**
   * Position enregistrée si elle existe (éléments positionnés manuellement
   * dans l'éditeur), sinon repli en cascade gauche→droite avec passage à la
   * ligne suivante dès que la largeur max est dépassée — un processus avec
   * beaucoup d'étapes reste lisible plutôt que de s'étaler indéfiniment.
   */
  private resolvePositions(elements: ElementLike[]): Map<string, Position> {
    const result = new Map<string, Position>();
    let cursorX = MARGIN;
    let cursorY = ROW_Y;
    let row = 0;
    for (const element of elements) {
      const size = SHAPE_SIZE[element.type];
      if (element.positionX != null && element.positionY != null) {
        result.set(element.id, { x: element.positionX, y: element.positionY, ...size });
        continue;
      }
      if (cursorX + size.w > MARGIN + MAX_ROW_WIDTH) {
        row += 1;
        cursorX = MARGIN;
        cursorY = ROW_Y + row * ROW_HEIGHT;
      }
      result.set(element.id, { x: cursorX, y: cursorY, ...size });
      cursorX += size.w + GAP_X;
    }
    return result;
  }

  private renderBox(element: ElementLike, pos: Position): string {
    const { x, y, w, h } = pos;
    switch (element.type) {
      case 'TACHE': {
        const iconX = x + 10;
        const iconY = y + 10;
        return `<g>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#1E283D" />
  ${this.renderTaskIcon(element.typeTache, iconX, iconY)}
  <text x="${x + 40}" y="${y + h / 2 + 4}" font-size="12" font-weight="bold" text-anchor="start" fill="#ffffff">${this.wrap(element.nom, 16, x + 40)}</text>
</g>`;
      }
      case 'SOUS_PROCESSUS': {
        const markerCx = x + w / 2;
        const markerY = y + h - 12;
        return `<g>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#ffffff" stroke="#1E283D" stroke-width="1.8" />
  <text x="${x + w / 2}" y="${y + h / 2}" font-size="12" font-weight="bold" text-anchor="middle" fill="#1a1a1a">${this.wrap(element.nom, 20, x + w / 2)}</text>
  <rect x="${markerCx - 7}" y="${markerY - 7}" width="14" height="14" fill="none" stroke="#1E283D" stroke-width="1.4" />
  <path d="M${markerCx - 4},${markerY} L${markerCx + 4},${markerY} M${markerCx},${markerY - 4} L${markerCx},${markerY + 4}" stroke="#1E283D" stroke-width="1.4" stroke-linecap="round" />
</g>`;
      }
      case 'PASSERELLE_EXCLUSIVE':
      case 'PASSERELLE_PARALLELE':
      case 'PASSERELLE_INCLUSIVE':
      case 'PASSERELLE_EVENEMENTIELLE': {
        const cx = x + w / 2;
        const cy = y + h / 2;
        return `<g>
  <polygon points="${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}" fill="#F3E9FB" stroke="#6A1B9A" stroke-width="1.6" />
  ${this.renderGatewaySymbol(element.type, cx, cy)}
  <text x="${cx}" y="${y + h + 16}" font-size="10.5" text-anchor="middle" fill="#1a1a1a">${this.wrap(element.nom, 22, cx)}</text>
</g>`;
      }
      case 'EVENEMENT_DEBUT': {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const r = Math.min(w, h) / 2 - 2;
        return `<g>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#E8F5E9" stroke="#2E7D32" stroke-width="1.8" />
  ${this.renderEventIcon(element.declencheur, cx, cy, '#2E7D32')}
  <text x="${cx}" y="${y + h + 16}" font-size="10.5" text-anchor="middle" fill="#1a1a1a">${this.wrap(element.nom, 18, cx)}</text>
</g>`;
      }
      case 'EVENEMENT_FIN': {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const r = Math.min(w, h) / 2 - 3;
        return `<g>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#FDECEA" stroke="#C62828" stroke-width="3" />
  ${this.renderEventIcon(element.declencheur, cx, cy, '#C62828')}
  <text x="${cx}" y="${y + h + 16}" font-size="10.5" text-anchor="middle" fill="#1a1a1a">${this.wrap(element.nom, 18, cx)}</text>
</g>`;
      }
      case 'EVENEMENT_INTERMEDIAIRE':
      default: {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const r = Math.min(w, h) / 2 - 2;
        return `<g>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#FEF6E6" stroke="#E29E09" stroke-width="1.6" />
  <circle cx="${cx}" cy="${cy}" r="${r - 4}" fill="none" stroke="#E29E09" stroke-width="1.1" />
  ${this.renderEventIcon(element.declencheur, cx, cy, '#E29E09')}
  <text x="${cx}" y="${y + h + 16}" font-size="10.5" text-anchor="middle" fill="#1a1a1a">${this.wrap(element.nom, 18, cx)}</text>
</g>`;
      }
    }
  }

  /** Symbole distinctif au centre du losange selon le type de passerelle. */
  private renderGatewaySymbol(type: TypeBpmn, cx: number, cy: number): string {
    switch (type) {
      case 'PASSERELLE_EXCLUSIVE':
        return `<path d="M${cx - 8},${cy - 8} L${cx + 8},${cy + 8} M${cx + 8},${cy - 8} L${cx - 8},${cy + 8}" stroke="#6A1B9A" stroke-width="2.2" stroke-linecap="round" />`;
      case 'PASSERELLE_PARALLELE':
        return `<path d="M${cx},${cy - 9} L${cx},${cy + 9} M${cx - 9},${cy} L${cx + 9},${cy}" stroke="#6A1B9A" stroke-width="2.2" stroke-linecap="round" />`;
      case 'PASSERELLE_INCLUSIVE':
        return `<circle cx="${cx}" cy="${cy}" r="8" fill="none" stroke="#6A1B9A" stroke-width="2.2" />`;
      case 'PASSERELLE_EVENEMENTIELLE':
        return `<circle cx="${cx}" cy="${cy}" r="9" fill="none" stroke="#6A1B9A" stroke-width="1.3" /><circle cx="${cx}" cy="${cy}" r="5.5" fill="none" stroke="#6A1B9A" stroke-width="1.3" />`;
      default:
        return '';
    }
  }

  /** Glyphe interne d'un événement selon son déclencheur — absent = événement générique ("none"). */
  private renderEventIcon(declencheur: DeclencheurEvenement | null | undefined, cx: number, cy: number, color: string): string {
    if (!declencheur) return '';
    switch (declencheur) {
      case 'MESSAGE':
        return `<rect x="${cx - 8}" y="${cy - 5.5}" width="16" height="11" fill="none" stroke="${color}" stroke-width="1.3" /><path d="M${cx - 8},${cy - 5.5} L${cx},${cy + 1} L${cx + 8},${cy - 5.5}" fill="none" stroke="${color}" stroke-width="1.3" />`;
      case 'MINUTERIE':
        return `<circle cx="${cx}" cy="${cy}" r="9" fill="none" stroke="${color}" stroke-width="1.2" /><path d="M${cx},${cy - 6} L${cx},${cy} L${cx + 4},${cy + 2}" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round" />`;
      case 'ERREUR':
        return `<path d="M${cx - 7},${cy + 7} L${cx - 1},${cy - 6} L${cx + 2},${cy} L${cx + 7},${cy - 7} L${cx + 1},${cy + 6} L${cx - 2},${cy} Z" fill="${color}" />`;
      case 'SIGNAL':
        return `<polygon points="${cx},${cy - 8} ${cx + 8},${cy + 7} ${cx - 8},${cy + 7}" fill="none" stroke="${color}" stroke-width="1.3" />`;
      case 'CONDITIONNEL':
        return `<rect x="${cx - 7}" y="${cy - 8}" width="14" height="16" fill="none" stroke="${color}" stroke-width="1.1" /><path d="M${cx - 4},${cy - 4} L${cx + 4},${cy - 4} M${cx - 4},${cy} L${cx + 4},${cy} M${cx - 4},${cy + 4} L${cx + 4},${cy + 4}" stroke="${color}" stroke-width="1" />`;
      case 'ESCALADE':
        return `<path d="M${cx - 6},${cy + 6} L${cx},${cy - 6} L${cx + 6},${cy + 6}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />`;
      case 'TERMINAISON':
        return `<circle cx="${cx}" cy="${cy}" r="6" fill="${color}" />`;
      default:
        return '';
    }
  }

  /** Icône en haut à gauche de la boîte tâche selon sa nature — sans typeTache, glyphe générique (document). */
  private renderTaskIcon(typeTache: TypeTache | null | undefined, x: number, y: number): string {
    const c = '#ffffff';
    switch (typeTache) {
      case 'UTILISATEUR':
        return `<circle cx="${x + 11}" cy="${y + 6}" r="4" fill="none" stroke="${c}" stroke-width="1.3" /><path d="M${x + 4},${y + 20} Q${x + 11},${y + 12} ${x + 18},${y + 20}" fill="none" stroke="${c}" stroke-width="1.3" />`;
      case 'SERVICE':
        return `<circle cx="${x + 11}" cy="${y + 11}" r="6" fill="none" stroke="${c}" stroke-width="1.3" /><path d="M${x + 11},${y + 2} L${x + 11},${y + 5} M${x + 11},${y + 17} L${x + 11},${y + 20} M${x + 2},${y + 11} L${x + 5},${y + 11} M${x + 17},${y + 11} L${x + 20},${y + 11}" stroke="${c}" stroke-width="1.3" stroke-linecap="round" />`;
      case 'MANUELLE':
        return `<path d="M${x + 3},${y + 18} L${x + 3},${y + 10} Q${x + 3},${y + 7} ${x + 6},${y + 7} L${x + 16},${y + 7} Q${x + 19},${y + 7} ${x + 19},${y + 10} L${x + 19},${y + 18}" fill="none" stroke="${c}" stroke-width="1.3" />`;
      case 'ENVOI':
        return `<polygon points="${x + 2},${y + 5} ${x + 20},${y + 5} ${x + 20},${y + 17} ${x + 2},${y + 17}" fill="${c}" /><path d="M${x + 2},${y + 5} L${x + 11},${y + 12} L${x + 20},${y + 5}" fill="none" stroke="#1E283D" stroke-width="1.2" />`;
      case 'RECEPTION':
        return `<rect x="${x + 2}" y="${y + 5}" width="18" height="12" fill="none" stroke="${c}" stroke-width="1.3" /><path d="M${x + 2},${y + 5} L${x + 11},${y + 12} L${x + 20},${y + 5}" fill="none" stroke="${c}" stroke-width="1.3" />`;
      case 'REGLE_METIER':
        return `<rect x="${x + 2}" y="${y + 3}" width="18" height="16" fill="none" stroke="${c}" stroke-width="1.2" /><path d="M${x + 2},${y + 9} L${x + 20},${y + 9} M${x + 9},${y + 3} L${x + 9},${y + 19}" stroke="${c}" stroke-width="1" />`;
      case 'SCRIPT':
        return `<path d="M${x + 8},${y + 4} L${x + 3},${y + 11} L${x + 8},${y + 18} M${x + 14},${y + 4} L${x + 19},${y + 11} L${x + 14},${y + 18}" fill="none" stroke="${c}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />`;
      default:
        return `<rect x="${x}" y="${y}" width="22" height="22" rx="4" fill="none" stroke="${c}" stroke-width="0" /><rect x="${x + 4}" y="${y + 6}" width="14" height="1.6" fill="${c}" /><rect x="${x + 4}" y="${y + 11}" width="14" height="1.6" fill="${c}" /><rect x="${x + 4}" y="${y + 16}" width="9" height="1.6" fill="${c}" />`;
    }
  }

  private renderFlow(flow: FlowLike, positions: Map<string, Position>): string {
    const from = positions.get(flow.sourceId)!;
    const to = positions.get(flow.targetId)!;
    const start = this.borderPoint(from, to);
    const end = this.borderPoint(to, from);
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    const label = flow.label
      ? `<text x="${midX}" y="${midY - 6}" font-size="10" text-anchor="middle" fill="#455A64">${this.escape(flow.label)}</text>`
      : '';

    return `<g>
  <line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="#333" stroke-width="1.6" marker-end="url(#bpmn-arrow)" />
  ${label}
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
    return `<defs>
  <marker id="bpmn-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="#333" />
  </marker>
</defs>`;
  }

  private buildEmptySvg(message: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="400" height="120" font-family="Arial, sans-serif">
  <rect x="0" y="0" width="400" height="120" fill="#FAFAFA" stroke="#DDD" />
  <text x="200" y="60" font-size="13" text-anchor="middle" fill="#666">${this.escape(message)}</text>
</svg>`;
  }

  /** Découpe le texte en lignes tspan pour tenir dans la boîte (rendu SVG basique, sans wrap automatique du navigateur). */
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
    const limited = lines.slice(0, 3);
    return limited
      .map((line, i) => `<tspan x="${x}" dy="${i === 0 ? -((limited.length - 1) * 6) : 12}">${this.escape(line)}</tspan>`)
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
