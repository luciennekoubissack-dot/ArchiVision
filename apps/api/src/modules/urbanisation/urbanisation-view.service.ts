import { Injectable } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { Criticite, TypeZone } from '@prisma/client';

const MARGIN = 30;
const GAP = 18;
const ROOT_CELL_W = 340;
const ROOT_CELL_H = 280;
const HEADER_HEIGHT = 22;
const INNER_PADDING = 10;
const CHIP_HEIGHT = 16;
const MAX_VISIBLE_APPS = 4;

const CRITICITE_COLOR: Record<Criticite, { fill: string; stroke: string }> = {
  HAUTE: { fill: '#F28B82', stroke: '#C62828' },
  MOYENNE: { fill: '#FFCC80', stroke: '#EF6C00' },
  BASSE: { fill: '#A5D6A7', stroke: '#2E7D32' },
};

const STYLE_BY_TYPE: Record<TypeZone, { fill: string; stroke: string }> = {
  ZONE: { fill: '#E3F2FD', stroke: '#1565C0' },
  QUARTIER: { fill: '#F3E5F5', stroke: '#6A1B9A' },
  ILOT: { fill: '#FFFFFF', stroke: '#616161' },
};

interface AppRef {
  id: string;
  nom: string;
  criticite: Criticite;
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
        applications: { include: { application: { select: { id: true, nom: true, criticite: true } } } },
        enfants: {
          orderBy: { nom: 'asc' },
          include: {
            applications: {
              include: { application: { select: { id: true, nom: true, criticite: true } } },
            },
            enfants: {
              orderBy: { nom: 'asc' },
              include: {
                applications: {
                  include: { application: { select: { id: true, nom: true, criticite: true } } },
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
        const { fill, stroke } = CRITICITE_COLOR[ref.application.criticite];
        const chipY = y + i * (CHIP_HEIGHT + 4);
        return `<rect x="${x}" y="${chipY}" width="${width}" height="${CHIP_HEIGHT}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="1" />
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
