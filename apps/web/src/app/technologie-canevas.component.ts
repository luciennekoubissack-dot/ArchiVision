import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import Konva from 'konva';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { TechComponent, TechnologieService, TypeTechComponent } from './technologie.service';
import { ToastService } from './toast.service';

// Notation UML « déploiement » : le TechComponent est un Nœud (boîte 3D),
// chaque application déployée est son propre Composant relié par un trait
// pointillé — voir apps/web/src/assets/diagramme-deploiement-template.png.
const NODE_W = 150;
const NODE_H = 64;
const DEPTH = 14;
const HEADER_H = 26;
const COMP_W = 140;
const COMP_H = 30;
const COMP_GAP_Y = 12;
const NODE_TO_COMP_GAP = 50;
const GAP_X = 40;
const ROW_Y = 60;
const UNIT_W = NODE_W + DEPTH + NODE_TO_COMP_GAP + COMP_W + GAP_X;

const TYPE_LABEL: Record<TypeTechComponent, string> = {
  SERVEUR: 'Serveur',
  RESEAU: 'Réseau',
  CLOUD: 'Cloud',
  BASE_DE_DONNEES: 'Base de données',
  MIDDLEWARE: 'Middleware',
};

const TYPE_COLOR: Record<TypeTechComponent, string> = {
  SERVEUR: '#1F3BB3',
  RESEAU: '#0F766E',
  CLOUD: '#7C3AED',
  BASE_DE_DONNEES: '#B45309',
  MIDDLEWARE: '#BE185D',
};

const TYPE_FILL: Record<TypeTechComponent, string> = {
  SERVEUR: '#DCE4FA',
  RESEAU: '#D6F0EC',
  CLOUD: '#E9E1FB',
  BASE_DE_DONNEES: '#FBE9D6',
  MIDDLEWARE: '#FBDCEA',
};

interface Pos {
  x: number;
  y: number;
}

@Component({
  selector: 'app-technologie-canevas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p class="hint">Glissez un nœud pour le repositionner. Les applications qu'il héberge s'affichent comme des composants reliés.</p>
    <div class="stage-wrap">
      <div class="empty-state" *ngIf="!loading && components.length === 0">
        Aucun composant technique pour l'instant — ajoutez-en depuis l'onglet Composants.
      </div>
      <div #stageHost class="stage-host"></div>
    </div>
  `,
  styles: [
    `
      .hint { color: var(--color-text-muted); font-size: 0.85rem; margin: 0 0 1rem; }
      .stage-wrap {
        position: relative;
        background: var(--color-white);
        border-radius: var(--radius-lg);
        border: 1px solid var(--color-border);
        overflow: hidden;
      }
      .stage-host { width: 100%; height: 60vh; min-height: 380px; cursor: grab; }
      .stage-wrap .empty-state { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; color: var(--color-text-muted); text-align: center; padding: 2rem; }
    `,
  ],
})
export class TechnologieCanevasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('stageHost') stageHost!: ElementRef<HTMLDivElement>;

  loading = true;
  components: TechComponent[] = [];

  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private readonly positionChange$ = new Subject<{ id: string; x: number; y: number }>();
  private readonly resizeHandler = () => this.resizeStage();

  constructor(
    private readonly technologieService: TechnologieService,
    private readonly toast: ToastService,
  ) {}

  ngAfterViewInit(): void {
    this.stage = new Konva.Stage({
      container: this.stageHost.nativeElement,
      width: this.stageHost.nativeElement.clientWidth,
      height: this.stageHost.nativeElement.clientHeight,
      draggable: true,
    });
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    this.stage.on('wheel', (e) => this.onWheel(e));
    window.addEventListener('resize', this.resizeHandler);

    this.positionChange$.pipe(debounceTime(400)).subscribe(({ id, x, y }) => this.savePosition(id, x, y));

    this.load();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
    this.stage?.destroy();
  }

  private load(): void {
    this.loading = true;
    this.technologieService.list().subscribe({
      next: (components) => {
        this.components = components;
        this.loading = false;
        this.render();
      },
      error: () => {
        this.loading = false;
        this.toast.error('Impossible de charger les composants techniques.');
      },
    });
  }

  private render(): void {
    this.layer.destroyChildren();

    let cursorX = 40;
    for (const comp of this.components) {
      const pos: Pos =
        comp.positionX != null && comp.positionY != null
          ? { x: comp.positionX, y: comp.positionY }
          : { x: cursorX, y: ROW_Y };
      cursorX += UNIT_W;

      this.layer.add(this.buildNodeGroup(comp, pos));
    }

    this.layer.draw();
  }

  /**
   * Nœud UML (boîte 3D) pour le TechComponent + ses composants (applications)
   * reliés — l'ensemble (nœud, liens, composants) se déplace comme un seul
   * bloc, cohérent avec le fait que seule la position du Nœud est persistée.
   */
  private buildNodeGroup(comp: TechComponent, pos: Pos): Konva.Group {
    const color = TYPE_COLOR[comp.type];
    const fill = TYPE_FILL[comp.type];
    const group = new Konva.Group({ x: pos.x, y: pos.y, draggable: true });
    const nodeGroup = new Konva.Group();
    const frontY = DEPTH;

    // Face du dessus (parallélogramme)
    nodeGroup.add(
      new Konva.Line({
        points: [0, frontY, DEPTH, 0, NODE_W + DEPTH, 0, NODE_W, frontY],
        closed: true,
        fill,
        stroke: color,
        strokeWidth: 1.2,
        opacity: 0.9,
      }),
    );
    // Face latérale (parallélogramme)
    nodeGroup.add(
      new Konva.Line({
        points: [NODE_W, frontY, NODE_W + DEPTH, 0, NODE_W + DEPTH, NODE_H, NODE_W, NODE_H + frontY],
        closed: true,
        fill,
        stroke: color,
        strokeWidth: 1.2,
        opacity: 0.7,
      }),
    );
    // Face avant
    nodeGroup.add(new Konva.Rect({ x: 0, y: frontY, width: NODE_W, height: NODE_H, fill, stroke: color, strokeWidth: 1.4 }));
    nodeGroup.add(new Konva.Rect({ x: 0, y: frontY, width: NODE_W, height: HEADER_H, fill: '#1E283D' }));
    nodeGroup.add(
      new Konva.Text({
        x: 6,
        y: frontY + 2,
        width: NODE_W - 12,
        text: `«nœud» ${TYPE_LABEL[comp.type]}`,
        fontSize: 8,
        fontStyle: 'italic',
        fill: '#c9d2e3',
        align: 'center',
      }),
    );
    nodeGroup.add(
      new Konva.Text({
        x: 6,
        y: frontY + 12,
        width: NODE_W - 12,
        height: HEADER_H - 12,
        text: comp.nom,
        fontSize: 12,
        fontStyle: 'bold',
        fill: '#ffffff',
        align: 'center',
        verticalAlign: 'middle',
        wrap: 'none',
        ellipsis: true,
      }),
    );

    group.add(nodeGroup);

    const nodeRightX = NODE_W + DEPTH;
    comp.deploiements.forEach((d, i) => {
      const compY = frontY + i * (COMP_H + COMP_GAP_Y);
      const compX = nodeRightX + NODE_TO_COMP_GAP;
      group.add(
        new Konva.Line({
          points: [nodeRightX, compY + COMP_H / 2, compX, compY + COMP_H / 2],
          stroke: '#8991a8',
          strokeWidth: 1.2,
          dash: [5, 4],
        }),
      );
      group.add(this.buildAppComponentBox(d.application.nom, compX, compY));
    });

    group.on('mouseenter', () => (document.body.style.cursor = 'grab'));
    group.on('mouseleave', () => (document.body.style.cursor = 'default'));
    group.on('dragend', () => {
      comp.positionX = group.x();
      comp.positionY = group.y();
      this.positionChange$.next({ id: comp.id, x: group.x(), y: group.y() });
    });

    return group;
  }

  /** Boîte « Composant » UML — rectangle + icône composant (deux rectangles), pour une application déployée. */
  private buildAppComponentBox(nom: string, x: number, y: number): Konva.Group {
    const box = new Konva.Group({ x, y });
    box.add(new Konva.Rect({ width: COMP_W, height: COMP_H, fill: '#F5F9FF', stroke: '#1F3BB3', strokeWidth: 1.3, cornerRadius: 3 }));
    box.add(
      new Konva.Text({
        x: 8,
        y: 0,
        width: COMP_W - 26,
        height: COMP_H,
        text: nom,
        fontSize: 10.5,
        fill: '#1a1a1a',
        verticalAlign: 'middle',
        wrap: 'none',
        ellipsis: true,
      }),
    );
    box.add(this.buildComponentIcon(COMP_W - 18, 7));
    return box;
  }

  /** Icône UML de composant : rectangle avec deux petites encoches sur le bord gauche. */
  private buildComponentIcon(x: number, y: number): Konva.Group {
    const icon = new Konva.Group({ x, y });
    icon.add(new Konva.Rect({ width: 12, height: 16, stroke: '#1F3BB3', strokeWidth: 1, fill: '#ffffff' }));
    icon.add(new Konva.Rect({ x: -3, y: 2, width: 6, height: 3.5, stroke: '#1F3BB3', strokeWidth: 1, fill: '#ffffff' }));
    icon.add(new Konva.Rect({ x: -3, y: 9, width: 6, height: 3.5, stroke: '#1F3BB3', strokeWidth: 1, fill: '#ffffff' }));
    return icon;
  }

  private savePosition(id: string, x: number, y: number): void {
    this.technologieService.update(id, { positionX: x, positionY: y }).subscribe({
      error: () => this.toast.error("Impossible d'enregistrer la position."),
    });
  }

  private onWheel(e: Konva.KonvaEventObject<WheelEvent>): void {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const oldScale = this.stage.scaleX();
    const pointer = this.stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - this.stage.x()) / oldScale,
      y: (pointer.y - this.stage.y()) / oldScale,
    };
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clamped = Math.min(Math.max(newScale, 0.3), 2.5);

    this.stage.scale({ x: clamped, y: clamped });
    this.stage.position({
      x: pointer.x - mousePointTo.x * clamped,
      y: pointer.y - mousePointTo.y * clamped,
    });
    this.stage.batchDraw();
  }

  private resizeStage(): void {
    if (!this.stage) return;
    this.stage.width(this.stageHost.nativeElement.clientWidth);
    this.stage.height(this.stageHost.nativeElement.clientHeight);
  }
}
