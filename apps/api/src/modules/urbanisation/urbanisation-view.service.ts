import { Injectable } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { TypeZone } from '@prisma/client';

const MARGIN = 30;
const GAP = 18;
const ROOT_CELL_W = 340;
const ROOT_CELL_H = 280;
const HEADER_HEIGHT = 22;
const INNER_PADDING = 10;
const CHIP_HEIGHT = 16;
const MAX_VISIBLE_APPS = 4;

const CHIP_COLOR = { fill: '#E3E8F0', stroke: '#455A73' };

const STYLE_BY_TYPE: Record<TypeZone, { fill: string; stroke: string }> = {
  ZONE: { fill: '#E3F2FD', stroke: '#1565C0' },
  QUARTIER: { fill: '#F3E5F5', stroke: '#6A1B9A' },
  ILOT: { fill: '#FFFFFF', stroke: '#616161' },
};

/// Constantes reprises telles quelles de l'éditeur interactif (applications-canevas.component.ts)
/// pour que le diagramme généré ressemble exactement à ce que l'on voit et modifie dans l'éditeur.
const COMPONENT_BOX_W = 190;
const COMPONENT_HEADER_H = 30;
const COMPONENT_SERVICE_ROW_H = 18;
const COMPONENT_PADDING = 8;
const COMPONENT_GAP_X = 40;
const COMPONENT_ROW_Y = 60;
const COMPONENT_MARGIN = 40;
/// Largeur max d'une ligne avant repli sur la ligne suivante, comme pour les autres générateurs
/// de diagrammes statiques (bpmn-view.service.ts) — un portefeuille de nombreuses applications
/// sans position enregistrée reste lisible plutôt que de s'étaler indéfiniment.
const COMPONENT_MAX_ROW_WIDTH = 1000;
const COMPONENT_INTERFACE_R = 5;

interface ComponentAppRef {
  id: string;
  nom: string;
  positionX?: number | null;
  positionY?: number | null;
  services: { id: string; nom: string }[];
}

interface ComponentEchangeRef {
  id: string;
  sourceId: string;
  targetId: string;
  description?: string | null;
  protocole?: string | null;
}

interface ComponentPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ComponentsViewResult {
  svg: string;
  applicationCount: number;
  echangeCount: number;
}

interface AppRef {
  id: string;
  nom: string;
}

interface ZoneApplicationRef {
  application: AppRef;
}

interface ZoneNode {
  id: string;
  nom: string;
  type: TypeZone;
  applications: ZoneApplicationRef[];
  enfants?: ZoneNode[];
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface UrbanisationViewResult {
  svg: string;
  zoneCount: number;
  applicationCount: number;
}

@Injectable()
export class UrbanisationViewService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(organisationId: string): Promise<UrbanisationViewResult> {
    const roots = (await this.prisma.zoneUrbanisation.findMany({
      where: { organisationId, parentId: null },
      orderBy: { nom: 'asc' },
      include: {
        applications: { include: { application: { select: { id: true, nom: true } } } },
        enfants: {
          orderBy: { nom: 'asc' },
          include: {
            applications: {
              include: { application: { select: { id: true, nom: true } } },
            },
            enfants: {
              orderBy: { nom: 'asc' },
              include: {
                applications: {
                  include: { application: { select: { id: true, nom: true } } },
                },
              },
            },
          },
        },
      },
    })) as unknown as ZoneNode[];

    const zoneCount = this.countZones(roots);
    const applicationCount = this.countApplications(roots);

    if (zoneCount === 0) {
      return {
        svg: this.buildEmptySvg("Aucune zone d'urbanisation pour cette organisation."),
        zoneCount: 0,
        applicationCount: 0,
      };
    }

    const cols = Math.ceil(Math.sqrt(roots.length));
    const rows = Math.ceil(roots.length / cols);
    const width = MARGIN * 2 + cols * ROOT_CELL_W + (cols - 1) * GAP;
    const height = MARGIN * 2 + rows * ROOT_CELL_H + (rows - 1) * GAP;

    const cells = this.gridCells(roots.length, MARGIN, MARGIN, width - MARGIN * 2, height - MARGIN * 2);
    const body = roots.map((root, i) => this.renderNode(root, cells[i])).join('\n');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="Arial, sans-serif">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#FAFAFA" />
${body}
</svg>`;

    return { svg, zoneCount, applicationCount };
  }

  /** Diagramme de composants UML (applications + échanges), même notation que l'éditeur interactif. */
  async generateComponents(organisationId: string): Promise<ComponentsViewResult> {
    const [apps, echanges] = await Promise.all([
      this.prisma.application.findMany({
        where: { organisationId },
        orderBy: { nom: 'asc' },
        include: { services: { select: { id: true, nom: true } } },
      }),
      this.prisma.applicationEchange.findMany({
        where: { source: { organisationId } },
        select: { id: true, sourceId: true, targetId: true, description: true, protocole: true },
      }),
    ]);

    if (apps.length === 0) {
      return {
        svg: this.buildEmptySvg('Aucune application pour cette organisation.'),
        applicationCount: 0,
        echangeCount: 0,
      };
    }

    const positions = this.resolveComponentPositions(apps as ComponentAppRef[]);
    let maxX = 0;
    let maxY = 0;
    for (const pos of positions.values()) {
      maxX = Math.max(maxX, pos.x + pos.w);
      maxY = Math.max(maxY, pos.y + pos.h + 16); // marge pour le libellé sous les échanges
    }
    const width = maxX + COMPONENT_MARGIN;
    const height = maxY + COMPONENT_MARGIN;

    const visibleEchanges = (echanges as ComponentEchangeRef[]).filter(
      (e) => positions.has(e.sourceId) && positions.has(e.targetId),
    );
    const relationsSvg = visibleEchanges.map((e) => this.renderComponentRelation(e, positions)).join('\n');
    const boxesSvg = (apps as ComponentAppRef[]).map((app) => this.renderComponentBox(app, positions.get(app.id)!)).join('\n');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="Arial, sans-serif">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#FAFAFA" />
${relationsSvg}
${boxesSvg}
</svg>`;

    return { svg, applicationCount: apps.length, echangeCount: visibleEchanges.length };
  }

  private componentBoxHeight(app: ComponentAppRef): number {
    const rows = Math.max(app.services.length, 1);
    return COMPONENT_HEADER_H + rows * COMPONENT_SERVICE_ROW_H + COMPONENT_PADDING * 2;
  }

  /**
   * Position enregistrée si elle existe (application repositionnée dans l'éditeur), sinon repli
   * en cascade gauche→droite avec passage à la ligne suivante au-delà de la largeur max.
   */
  private resolveComponentPositions(apps: ComponentAppRef[]): Map<string, ComponentPosition> {
    const result = new Map<string, ComponentPosition>();
    let cursorX = COMPONENT_MARGIN;
    let cursorY = COMPONENT_ROW_Y;
    let rowMaxH = 0;
    for (const app of apps) {
      const h = this.componentBoxHeight(app);
      if (app.positionX != null && app.positionY != null) {
        result.set(app.id, { x: app.positionX, y: app.positionY, w: COMPONENT_BOX_W, h });
        continue;
      }
      if (cursorX + COMPONENT_BOX_W > COMPONENT_MARGIN + COMPONENT_MAX_ROW_WIDTH && cursorX > COMPONENT_MARGIN) {
        cursorX = COMPONENT_MARGIN;
        cursorY += rowMaxH + COMPONENT_GAP_X;
        rowMaxH = 0;
      }
      result.set(app.id, { x: cursorX, y: cursorY, w: COMPONENT_BOX_W, h });
      cursorX += COMPONENT_BOX_W + COMPONENT_GAP_X;
      rowMaxH = Math.max(rowMaxH, h);
    }
    return result;
  }

  private renderComponentBox(app: ComponentAppRef, pos: ComponentPosition): string {
    const { x, y, w, h } = pos;
    const header = `<rect x="${x}" y="${y}" width="${w}" height="${COMPONENT_HEADER_H}" fill="#1E283D" rx="6" />
  <rect x="${x}" y="${y + COMPONENT_HEADER_H / 2}" width="${w}" height="${COMPONENT_HEADER_H / 2}" fill="#1E283D" />
  <text x="${x + w / 2}" y="${y + 12}" font-size="8.5" font-style="italic" text-anchor="middle" fill="#c9d2e3">«component»</text>
  <text x="${x + w / 2}" y="${y + 24}" font-size="12" font-weight="bold" text-anchor="middle" fill="#ffffff">${this.escape(this.truncate(app.nom, 24))}</text>`;

    const body = `<rect x="${x}" y="${y + COMPONENT_HEADER_H}" width="${w}" height="${h - COMPONENT_HEADER_H}" fill="#ffffff" stroke="#1F3BB3" stroke-width="1.4" />`;

    const services = app.services;
    const servicesSvg =
      services.length === 0
        ? `<text x="${x + COMPONENT_PADDING}" y="${y + COMPONENT_HEADER_H + COMPONENT_PADDING + 9}" font-size="10" font-style="italic" fill="#8991a8">Aucun service</text>`
        : services
            .map(
              (service, i) =>
                `<text x="${x + COMPONENT_PADDING}" y="${y + COMPONENT_HEADER_H + COMPONENT_PADDING + 9 + i * COMPONENT_SERVICE_ROW_H}" font-size="10.5" fill="#1a1a1a">• ${this.escape(this.truncate(service.nom, 24))}</text>`,
            )
            .join('\n  ');

    return `<g>\n  ${header}\n  ${body}\n  ${servicesSvg}\n</g>`;
  }

  /**
   * Notation UML « interface fournie / requise » : un disque plein (lollipop) côté source, un
   * arc ouvert (socket) côté cible, comme dans l'éditeur interactif.
   */
  private renderComponentRelation(echange: ComponentEchangeRef, positions: Map<string, ComponentPosition>): string {
    const from = positions.get(echange.sourceId)!;
    const to = positions.get(echange.targetId)!;
    const start = this.componentBorderPoint(from, to);
    const end = this.componentBorderPoint(to, from);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;

    const lollipopPos = { x: start.x + ux * COMPONENT_INTERFACE_R, y: start.y + uy * COMPONENT_INTERFACE_R };
    const socketPos = { x: end.x - ux * COMPONENT_INTERFACE_R * 2, y: end.y - uy * COMPONENT_INTERFACE_R * 2 };
    const angle = Math.atan2(dy, dx);
    const socketStartAngle = ((angle - Math.PI / 2) * 180) / Math.PI;
    const socketEndAngle = ((angle + Math.PI / 2) * 180) / Math.PI;
    const socketStart = {
      x: socketPos.x + COMPONENT_INTERFACE_R * Math.cos((socketStartAngle * Math.PI) / 180),
      y: socketPos.y + COMPONENT_INTERFACE_R * Math.sin((socketStartAngle * Math.PI) / 180),
    };
    const socketEnd = {
      x: socketPos.x + COMPONENT_INTERFACE_R * Math.cos((socketEndAngle * Math.PI) / 180),
      y: socketPos.y + COMPONENT_INTERFACE_R * Math.sin((socketEndAngle * Math.PI) / 180),
    };

    const label = [echange.description, echange.protocole].filter(Boolean).join(' · ');
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const labelSvg = label
      ? `<text x="${midX}" y="${midY - 6}" font-size="10" text-anchor="middle" fill="#455A64">${this.escape(label)}</text>`
      : '';

    return `<g>
  <line x1="${lollipopPos.x}" y1="${lollipopPos.y}" x2="${socketPos.x}" y2="${socketPos.y}" stroke="#1F3BB3" stroke-width="1.4" />
  <circle cx="${lollipopPos.x}" cy="${lollipopPos.y}" r="${COMPONENT_INTERFACE_R}" fill="#1F3BB3" />
  <path d="M${socketStart.x},${socketStart.y} A${COMPONENT_INTERFACE_R},${COMPONENT_INTERFACE_R} 0 0 1 ${socketEnd.x},${socketEnd.y}" fill="none" stroke="#1F3BB3" stroke-width="1.4" />
  ${labelSvg}
</g>`;
  }

  private componentBorderPoint(from: ComponentPosition, to: ComponentPosition): { x: number; y: number } {
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

  private renderNode(node: ZoneNode, rect: Rect): string {
    const style = STYLE_BY_TYPE[node.type];
    const header = `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="1.5" rx="4" />
  <text x="${rect.x + 6}" y="${rect.y + 15}" font-size="11" font-weight="bold" fill="${style.stroke}">${this.escape(this.truncate(node.nom, 28))}</text>`;

    const innerX = rect.x + INNER_PADDING;
    const innerY = rect.y + HEADER_HEIGHT;
    const innerW = rect.w - INNER_PADDING * 2;
    const innerH = rect.h - HEADER_HEIGHT - INNER_PADDING;

    if (node.enfants && node.enfants.length > 0) {
      const childCells = this.gridCells(node.enfants.length, innerX, innerY, innerW, innerH);
      const children = node.enfants
        .map((child, i) => this.renderNode(child, childCells[i]))
        .join('\n');
      return `<g>\n${header}\n${children}\n</g>`;
    }

    const chips = this.renderAppChips(node.applications, innerX, innerY, innerW);
    return `<g>\n${header}\n${chips}\n</g>`;
  }

  private renderAppChips(refs: ZoneApplicationRef[], x: number, y: number, width: number): string {
    if (refs.length === 0) return '';
    const visible = refs.slice(0, MAX_VISIBLE_APPS);
    const chips = visible
      .map((ref, i) => {
        const chipY = y + i * (CHIP_HEIGHT + 4);
        return `<rect x="${x}" y="${chipY}" width="${width}" height="${CHIP_HEIGHT}" rx="3" fill="${CHIP_COLOR.fill}" stroke="${CHIP_COLOR.stroke}" stroke-width="1" />
  <text x="${x + 5}" y="${chipY + CHIP_HEIGHT - 4}" font-size="9" fill="#1a1a1a">${this.escape(this.truncate(ref.application.nom, 20))}</text>`;
      })
      .join('\n');
    const overflow = refs.length - visible.length;
    const overflowText =
      overflow > 0
        ? `<text x="${x}" y="${y + visible.length * (CHIP_HEIGHT + 4) + 10}" font-size="9" fill="#777">+${overflow} autre${overflow > 1 ? 's' : ''}</text>`
        : '';
    return `${chips}\n${overflowText}`;
  }

  private gridCells(n: number, x: number, y: number, w: number, h: number): Rect[] {
    const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
    const rows = Math.max(1, Math.ceil(n / cols));
    const cellW = (w - (cols - 1) * GAP) / cols;
    const cellH = (h - (rows - 1) * GAP) / rows;
    const cells: Rect[] = [];
    for (let i = 0; i < n; i += 1) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      cells.push({
        x: x + col * (cellW + GAP),
        y: y + row * (cellH + GAP),
        w: cellW,
        h: cellH,
      });
    }
    return cells;
  }

  private countZones(nodes: ZoneNode[]): number {
    return nodes.reduce((sum, node) => sum + 1 + this.countZones(node.enfants ?? []), 0);
  }

  private countApplications(nodes: ZoneNode[]): number {
    return nodes.reduce(
      (sum, node) => sum + node.applications.length + this.countApplications(node.enfants ?? []),
      0,
    );
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
