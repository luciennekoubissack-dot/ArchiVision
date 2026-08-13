import { Injectable } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';

const MARGIN = 30;
const GAP_X = 26;
const ROW_GAP_Y = 54;
const BOX_W = 190;
const BANNER_H = 52;
const HEADER_HEIGHT = 24;
const INNER_PADDING = 10;
const CHIP_HEIGHT = 16;
const MAX_VISIBLE_MEMBRES = 4;

const CONNECTOR_STROKE = '#90A4AE';

const DEPTH_COLORS: { fill: string; stroke: string }[] = [
  { fill: '#DCE3F9', stroke: '#1F3BB3' }, // racine — bleu primaire
  { fill: '#DFF3FB', stroke: '#0E90B8' }, // niveau 1 — bleu secondaire
  { fill: '#EDE3F9', stroke: '#6A1B9A' }, // niveau 2+ — violet
];

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

interface LayoutNode {
  service: ServiceNode;
  depth: number;
  x: number;
  y: number;
  w: number;
  h: number;
  children: LayoutNode[];
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

    const svg = this.buildTreeSvg(roots);
    return { svg, serviceCount, membreCount };
  }

  private buildTreeSvg(roots: ServiceNode[]): string {
    const rowHeights: number[] = [];
    const collectRowHeights = (nodes: ServiceNode[], depth: number): void => {
      for (const node of nodes) {
        rowHeights[depth] = Math.max(rowHeights[depth] ?? 0, this.nodeBoxHeight(node));
        if (node.enfants && node.enfants.length > 0) collectRowHeights(node.enfants, depth + 1);
      }
    };
    collectRowHeights(roots, 0);

    const rowY: number[] = [];
    let cursorY = MARGIN + BANNER_H + MARGIN;
    for (let d = 0; d < rowHeights.length; d += 1) {
      rowY[d] = cursorY;
      cursorY += rowHeights[d] + ROW_GAP_Y;
    }
    const totalHeight = cursorY - ROW_GAP_Y + MARGIN;

    let leafIndex = 0;
    const layoutNodes: LayoutNode[] = [];
    const assign = (node: ServiceNode, depth: number): LayoutNode => {
      const children = (node.enfants ?? []).map((child) => assign(child, depth + 1));
      let x: number;
      if (children.length > 0) {
        const xs = children.map((c) => c.x);
        x = (Math.min(...xs) + Math.max(...xs)) / 2;
      } else {
        x = MARGIN + leafIndex * (BOX_W + GAP_X) + BOX_W / 2;
        leafIndex += 1;
      }
      const layout: LayoutNode = { service: node, depth, x, y: rowY[depth], w: BOX_W, h: this.nodeBoxHeight(node), children };
      layoutNodes.push(layout);
      return layout;
    };
    roots.forEach((root) => assign(root, 0));

    const width = MARGIN * 2 + Math.max(leafIndex, 1) * BOX_W + Math.max(leafIndex - 1, 0) * GAP_X;

    const connectors = layoutNodes
      .filter((n) => n.children.length > 0)
      .map((n) => this.renderConnectors(n))
      .join('\n');
    const boxes = layoutNodes.map((n) => this.renderBox(n)).join('\n');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${totalHeight}" width="${width}" height="${totalHeight}" font-family="Arial, sans-serif">
  <rect x="0" y="0" width="${width}" height="${totalHeight}" fill="#FAFAFA" />
  ${this.renderBanner(width)}
${connectors}
${boxes}
</svg>`;
  }

  private renderBanner(width: number): string {
    return `<defs>
    <linearGradient id="bannerGradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1F3BB3" />
      <stop offset="100%" stop-color="#34B1AA" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${width}" height="${BANNER_H}" fill="url(#bannerGradient)" />
  <text x="${width / 2}" y="${BANNER_H / 2 + 5}" font-size="14" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Organigramme</text>`;
  }

  private renderBox(n: LayoutNode): string {
    const { fill, stroke } = DEPTH_COLORS[Math.min(n.depth, DEPTH_COLORS.length - 1)];
    const left = n.x - n.w / 2;
    const header = `<rect x="${left}" y="${n.y}" width="${n.w}" height="${n.h}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" rx="6" />
  <text x="${n.x}" y="${n.y + 17}" font-size="11" font-weight="bold" fill="${stroke}" text-anchor="middle">${this.escape(this.truncate(n.service.nom, 26))}</text>`;

    if (n.children.length > 0) {
      return `<g>\n${header}\n</g>`;
    }

    const chips = this.renderMembreChips(n.service.membres, left + INNER_PADDING, n.y + HEADER_HEIGHT, n.w - INNER_PADDING * 2);
    return `<g>\n${header}\n${chips}\n</g>`;
  }

  private renderConnectors(n: LayoutNode): string {
    const parentBottomY = n.y + n.h;
    const midY = parentBottomY + ROW_GAP_Y / 2;
    const lines = [`<line x1="${n.x}" y1="${parentBottomY}" x2="${n.x}" y2="${midY}" stroke="${CONNECTOR_STROKE}" stroke-width="1.5" />`];

    if (n.children.length > 1) {
      const xs = n.children.map((c) => c.x);
      lines.push(`<line x1="${Math.min(...xs)}" y1="${midY}" x2="${Math.max(...xs)}" y2="${midY}" stroke="${CONNECTOR_STROKE}" stroke-width="1.5" />`);
    }

    for (const child of n.children) {
      lines.push(`<line x1="${child.x}" y1="${midY}" x2="${child.x}" y2="${child.y}" stroke="${CONNECTOR_STROKE}" stroke-width="1.5" />`);
    }
    return lines.join('\n');
  }

  private nodeBoxHeight(node: ServiceNode): number {
    if (node.enfants && node.enfants.length > 0) return HEADER_HEIGHT;
    const visible = Math.min(node.membres.length, MAX_VISIBLE_MEMBRES);
    if (visible === 0) return HEADER_HEIGHT + 8;
    const overflow = node.membres.length > MAX_VISIBLE_MEMBRES ? 14 : 4;
    return HEADER_HEIGHT + INNER_PADDING + visible * (CHIP_HEIGHT + 4) + overflow;
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
