import { Injectable } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';

const MARGIN = 30;
const GAP = 18;
const ROOT_CELL_W = 340;
const ROOT_CELL_H = 280;
const HEADER_HEIGHT = 22;
const INNER_PADDING = 10;
const CHIP_HEIGHT = 16;
const MAX_VISIBLE_MEMBRES = 4;

const STYLE = { fill: '#E3F2FD', stroke: '#1565C0' };

const ROLE_COLOR: Record<RoleUtilisateur, { fill: string; stroke: string }> = {
  // SUPERADMIN n'apparaît jamais dans un organigramme (aucune organisation
  // rattachée) — couleur définie uniquement pour satisfaire l'exhaustivité du Record.
  SUPERADMIN: { fill: '#ECEFF1', stroke: '#455A64' },
  ADMINISTRATEUR: { fill: '#BBDEFB', stroke: '#1565C0' },
  ARCHITECTE: { fill: '#E1BEE7', stroke: '#6A1B9A' },
};

interface MembreRef {
  id: string;
  nom: string;
  role: RoleUtilisateur;
}

interface ServiceNode {
  id: string;
  nom: string;
  membres: MembreRef[];
  enfants?: ServiceNode[];
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ServiceViewResult {
  svg: string;
  serviceCount: number;
  membreCount: number;
}

@Injectable()
export class ServiceViewService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(organisationId: string): Promise<ServiceViewResult> {
    const roots = (await this.prisma.service.findMany({
      where: { organisationId, parentId: null },
      orderBy: { nom: 'asc' },
      include: {
        membres: { select: { id: true, nom: true, role: true } },
        enfants: {
          orderBy: { nom: 'asc' },
          include: {
            membres: { select: { id: true, nom: true, role: true } },
            enfants: {
              orderBy: { nom: 'asc' },
              include: {
                membres: { select: { id: true, nom: true, role: true } },
              },
            },
          },
        },
      },
    })) as unknown as ServiceNode[];

    const serviceCount = this.countServices(roots);
    const membreCount = this.countMembres(roots);

    if (serviceCount === 0) {
      return {
        svg: this.buildEmptySvg('Aucun service défini pour cette organisation.'),
        serviceCount: 0,
        membreCount: 0,
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

    return { svg, serviceCount, membreCount };
  }

  private renderNode(node: ServiceNode, rect: Rect): string {
    const header = `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="${STYLE.fill}" stroke="${STYLE.stroke}" stroke-width="1.5" rx="4" />
  <text x="${rect.x + 6}" y="${rect.y + 15}" font-size="11" font-weight="bold" fill="${STYLE.stroke}">${this.escape(this.truncate(node.nom, 28))}</text>`;

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

    const chips = this.renderMembreChips(node.membres, innerX, innerY, innerW);
    return `<g>\n${header}\n${chips}\n</g>`;
  }

  private renderMembreChips(membres: MembreRef[], x: number, y: number, width: number): string {
    if (membres.length === 0) return '';
    const visible = membres.slice(0, MAX_VISIBLE_MEMBRES);
    const chips = visible
      .map((membre, i) => {
        const { fill, stroke } = ROLE_COLOR[membre.role];
        const chipY = y + i * (CHIP_HEIGHT + 4);
        return `<rect x="${x}" y="${chipY}" width="${width}" height="${CHIP_HEIGHT}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="1" />
  <text x="${x + 5}" y="${chipY + CHIP_HEIGHT - 4}" font-size="9" fill="#1a1a1a">${this.escape(this.truncate(membre.nom, 20))}</text>`;
      })
      .join('\n');
    const overflow = membres.length - visible.length;
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

  private countServices(nodes: ServiceNode[]): number {
    return nodes.reduce((sum, node) => sum + 1 + this.countServices(node.enfants ?? []), 0);
  }

  private countMembres(nodes: ServiceNode[]): number {
    return nodes.reduce(
      (sum, node) => sum + node.membres.length + this.countMembres(node.enfants ?? []),
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
