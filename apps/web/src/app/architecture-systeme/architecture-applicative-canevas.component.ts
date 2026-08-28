import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import Konva from 'konva';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import {
  ArchiApplicativeElement,
  ArchiApplicativeFlux,
  ArchitectureApplicativeService,
  TypeElementArchiApplicative,
  TypeFluxArchiApplicative,
} from './architecture-applicative.service';
import { ToastService } from '../shared/toast.service';
import { ConfirmDialogService } from '../shared/confirm-dialog.service';

interface ShapeSize {
  w: number;
  h: number;
}

const BOX_SIZE: ShapeSize = { w: 160, h: 56 };
const DB_SIZE: ShapeSize = { w: 120, h: 70 };

const SHAPE_SIZE: Record<TypeElementArchiApplicative, ShapeSize> = {
  UTILISATEUR_INTERNE: BOX_SIZE,
  UTILISATEUR_EXTERNE: BOX_SIZE,
  APPLICATION: BOX_SIZE,
  BASE_DE_DONNEES: DB_SIZE,
  SYSTEME_EXTERNE: BOX_SIZE,
  INFRASTRUCTURE: BOX_SIZE,
  SECURITE: BOX_SIZE,
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

const TYPES: TypeElementArchiApplicative[] = [
  'UTILISATEUR_INTERNE',
  'UTILISATEUR_EXTERNE',
  'APPLICATION',
  'BASE_DE_DONNEES',
  'SYSTEME_EXTERNE',
  'INFRASTRUCTURE',
  'SECURITE',
];

/** Couleur de remplissage/contour par type — même palette que le diagramme généré côté serveur. */
const TYPE_COLOR: Record<TypeElementArchiApplicative, { fill: string; stroke: string; dashed: boolean }> = {
  UTILISATEUR_INTERNE: { fill: '#F3D9E0', stroke: '#C0244F', dashed: false },
  UTILISATEUR_EXTERNE: { fill: '#F3D9E0', stroke: '#C0244F', dashed: true },
  APPLICATION: { fill: '#BBDEFB', stroke: '#1565C0', dashed: false },
  BASE_DE_DONNEES: { fill: '#B2EBF2', stroke: '#00838F', dashed: false },
  SYSTEME_EXTERNE: { fill: '#FFECB3', stroke: '#D4A017', dashed: true },
  INFRASTRUCTURE: { fill: '#C8E6C9', stroke: '#2E7D32', dashed: false },
  SECURITE: { fill: '#FFCDD2', stroke: '#C62828', dashed: false },
};

const PALETTE_ICON: Record<TypeElementArchiApplicative, string> = {
  UTILISATEUR_INTERNE:
    '<rect x="3" y="3" width="18" height="18" rx="3" fill="#F3D9E0" stroke="#C0244F" stroke-width="1.3"/><circle cx="12" cy="9" r="2" fill="none" stroke="#C0244F" stroke-width="1.1"/><path d="M8,15.5 Q12,11.5 16,15.5" fill="none" stroke="#C0244F" stroke-width="1.1" stroke-linecap="round"/>',
  UTILISATEUR_EXTERNE:
    '<rect x="3" y="3" width="18" height="18" rx="3" fill="#F3D9E0" stroke="#C0244F" stroke-width="1.3" stroke-dasharray="3,2"/><circle cx="12" cy="9" r="2" fill="none" stroke="#C0244F" stroke-width="1.1"/><path d="M8,15.5 Q12,11.5 16,15.5" fill="none" stroke="#C0244F" stroke-width="1.1" stroke-linecap="round"/>',
  APPLICATION:
    '<rect x="3" y="3" width="18" height="18" rx="3" fill="#BBDEFB" stroke="#1565C0" stroke-width="1.3"/><rect x="7" y="7.5" width="10" height="2" rx="1" fill="#1565C0"/><rect x="7" y="11" width="10" height="2" rx="1" fill="#1565C0"/><rect x="7" y="14.5" width="6" height="2" rx="1" fill="#1565C0"/>',
  BASE_DE_DONNEES:
    '<path d="M4,8 L4,16 A8,3 0 0 0 20,16 L20,8" fill="#B2EBF2" stroke="#00838F" stroke-width="1.3"/><ellipse cx="12" cy="8" rx="8" ry="3" fill="#B2EBF2" stroke="#00838F" stroke-width="1.3"/>',
  SYSTEME_EXTERNE:
    '<rect x="3" y="3" width="18" height="18" rx="3" fill="#FFECB3" stroke="#D4A017" stroke-width="1.3" stroke-dasharray="3,2"/><circle cx="9.5" cy="12" r="3.2" fill="none" stroke="#D4A017" stroke-width="1.2"/><circle cx="14.5" cy="12" r="3.2" fill="none" stroke="#D4A017" stroke-width="1.2"/>',
  INFRASTRUCTURE:
    '<rect x="3" y="3" width="18" height="18" rx="3" fill="#C8E6C9" stroke="#2E7D32" stroke-width="1.3"/><rect x="6.5" y="6.5" width="11" height="4.5" rx="1" fill="none" stroke="#2E7D32" stroke-width="1"/><rect x="6.5" y="13" width="11" height="4.5" rx="1" fill="none" stroke="#2E7D32" stroke-width="1"/><circle cx="9" cy="8.75" r="0.7" fill="#2E7D32"/><circle cx="9" cy="15.25" r="0.7" fill="#2E7D32"/>',
  SECURITE:
    '<rect x="3" y="3" width="18" height="18" rx="3" fill="#FFCDD2" stroke="#C62828" stroke-width="1.3"/><path d="M12,6 L17,8 L17,12.5 Q17,16.5 12,18.5 Q7,16.5 7,12.5 L7,8 Z" fill="none" stroke="#C62828" stroke-width="1.2" stroke-linejoin="round"/>',
};

const TYPE_FLUX_LABEL: Record<TypeFluxArchiApplicative, string> = {
  API: 'API',
  DONNEES: 'Données',
  AUTHENTIFICATION: 'Authentification',
  RESEAU: 'Réseau',
};
const TYPES_FLUX: TypeFluxArchiApplicative[] = ['API', 'DONNEES', 'AUTHENTIFICATION', 'RESEAU'];
const FLUX_COLOR: Record<TypeFluxArchiApplicative, { color: string; dashed: boolean }> = {
  API: { color: '#1565C0', dashed: false },
  DONNEES: { color: '#2E7D32', dashed: false },
  AUTHENTIFICATION: { color: '#C62828', dashed: true },
  RESEAU: { color: '#616161', dashed: false },
};

const GAP_X = 40;
const ROW_Y = 60;
const MARGIN = 40;
const MAX_ROW_WIDTH = 1100;
const ROW_HEIGHT = 130;

interface PendingCreate {
  type: TypeElementArchiApplicative;
  x: number;
  y: number;
  nom: string;
  description: string;
}

interface PendingEdit {
  id: string;
  nom: string;
  description: string;
}

interface PendingFlux {
  sourceId: string;
  targetId: string;
  type: TypeFluxArchiApplicative;
  label: string;
}

interface Pos {
  x: number;
  y: number;
  w: number;
  h: number;
}

@Component({
  selector: 'app-architecture-applicative-canevas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p class="hint">
      Glissez une icône de la palette sur le plan pour ajouter un élément. Pour créer un flux entre deux éléments :
      survolez un élément, 4 points apparaissent sur ses bords, puis glissez depuis l'un de ces points jusqu'à
      l'élément cible. Survolez un élément : cliquez sur le crayon pour le modifier, ou sur le « × » rouge pour le
      supprimer.
    </p>

    <div class="canevas-layout">
      <aside class="palette">
        <h4>Éléments</h4>
        <div class="item" *ngFor="let t of types" draggable="true" (dragstart)="onDragStart($event, t)">
          <span class="palette-icon" [innerHTML]="paletteIcon(t)"></span>
          {{ typeLabel(t) }}
        </div>
      </aside>

      <div class="stage-wrap">
        <div class="empty-state" *ngIf="!loading && elements.length === 0">
          Aucun élément pour l'instant, glissez une icône depuis la palette.
        </div>
        <div #stageHost class="stage-host" (dragover)="onDragOver($event)" (drop)="onDrop($event)"></div>
      </div>
    </div>

    <div class="pending-form" *ngIf="pendingCreate as p">
      <form class="card form-card" (submit)="confirmCreate($event)">
        <h3>Nouvel élément, {{ typeLabel(p.type) }}</h3>
        <label class="field">
          Nom
          <input type="text" [value]="p.nom" (input)="p.nom = $any($event.target).value" required autofocus />
        </label>
        <label class="field">
          Description (facultatif)
          <textarea [value]="p.description" (input)="p.description = $any($event.target).value"></textarea>
        </label>
        <div class="pending-actions">
          <button type="button" class="btn btn-ghost" (click)="cancelCreate()">Annuler</button>
          <button type="submit" class="btn btn-primary">Créer</button>
        </div>
      </form>
    </div>

    <div class="pending-form" *ngIf="pendingEdit as pe">
      <form class="card form-card" (submit)="confirmEdit($event)">
        <h3>Modifier l'élément</h3>
        <label class="field">
          Nom
          <input type="text" [value]="pe.nom" (input)="pe.nom = $any($event.target).value" required autofocus />
        </label>
        <label class="field">
          Description (facultatif)
          <textarea [value]="pe.description" (input)="pe.description = $any($event.target).value"></textarea>
        </label>
        <div class="pending-actions">
          <button type="button" class="btn btn-ghost" (click)="cancelEdit()">Annuler</button>
          <button type="submit" class="btn btn-success">Enregistrer</button>
        </div>
      </form>
    </div>

    <div class="pending-form" *ngIf="pendingFlux as pf">
      <form class="card form-card" (submit)="confirmFlux($event)">
        <h3>Nouveau flux</h3>
        <p class="muted">{{ elementLabel(pf.sourceId) }} → {{ elementLabel(pf.targetId) }}</p>
        <label class="field">
          Nature du flux
          <select (change)="pf.type = $any($event.target).value">
            <option *ngFor="let t of typesFlux" [value]="t" [selected]="t === pf.type">{{ fluxLabel(t) }}</option>
          </select>
        </label>
        <label class="field">
          Libellé (facultatif, ex. protocole)
          <input type="text" [value]="pf.label" (input)="pf.label = $any($event.target).value" />
        </label>
        <div class="pending-actions">
          <button type="button" class="btn btn-ghost" (click)="cancelFlux()">Annuler</button>
          <button type="submit" class="btn btn-primary">Créer</button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .hint { color: var(--color-text-muted); font-size: 0.85rem; margin: 0 0 1rem; }
      .canevas-layout { display: flex; gap: 1.25rem; align-items: flex-start; }
      .palette {
        width: 210px;
        flex-shrink: 0;
        background: var(--color-white);
        border-radius: var(--radius-lg);
        border: 1px solid var(--color-border);
        padding: 1.1rem;
      }
      .palette h4 { margin: 0 0 0.75rem; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-text-muted); }
      .palette .item {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.5rem 0.55rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        margin-bottom: 0.4rem;
        cursor: grab;
        font-size: 0.86rem;
        background: var(--color-surface);
        user-select: none;
      }
      .palette .item:active { cursor: grabbing; }
      .palette-icon { width: 22px; height: 22px; flex-shrink: 0; display: inline-flex; }
      .palette-icon svg, .palette-icon { width: 22px; height: 22px; }
      .stage-wrap {
        position: relative;
        flex: 1;
        min-width: 0;
        background: var(--color-white);
        border-radius: var(--radius-lg);
        border: 1px solid var(--color-border);
        overflow: hidden;
      }
      .stage-host { width: 100%; height: 60vh; min-height: 380px; cursor: grab; }
      .stage-wrap .empty-state { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; color: var(--color-text-muted); text-align: center; padding: 2rem; }
      .pending-form { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.25); display: flex; align-items: center; justify-content: center; z-index: 50; }
      .pending-form .card { width: 340px; }
      .pending-actions { display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 0.5rem; }
      .muted { color: var(--color-text-muted); margin-top: 0.25rem; font-size: 0.88rem; }
    `,
  ],
})
export class ArchitectureApplicativeCanevasComponent implements AfterViewInit, OnDestroy {
  @Output() changed = new EventEmitter<void>();

  @ViewChild('stageHost') stageHost!: ElementRef<HTMLDivElement>;

  types = TYPES;
  typesFlux = TYPES_FLUX;
  loading = true;
  elements: ArchiApplicativeElement[] = [];
  flux: ArchiApplicativeFlux[] = [];
  pendingCreate: PendingCreate | null = null;
  pendingEdit: PendingEdit | null = null;
  pendingFlux: PendingFlux | null = null;

  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private fluxLayer!: Konva.Group;
  private boxLayer!: Konva.Group;
  private nodesById = new Map<string, Konva.Group>();
  private positionsById = new Map<string, Pos>();
  private linking: { fromId: string; line: Konva.Line } | null = null;
  private readonly positionChange$ = new Subject<{ id: string; x: number; y: number }>();
  private readonly resizeHandler = () => this.resizeStage();
  private readonly windowMouseUpHandler = () => this.cancelLinking();

  constructor(
    private readonly service: ArchitectureApplicativeService,
    private readonly toast: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
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
    this.stage.on('mousemove', () => this.onStageMouseMove());
    this.stage.on('mouseup', (e) => this.onStageMouseUp(e));
    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('mouseup', this.windowMouseUpHandler);

    this.positionChange$.pipe(debounceTime(400)).subscribe(({ id, x, y }) => this.savePosition(id, x, y));

    this.load();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener('mouseup', this.windowMouseUpHandler);
    this.stage?.destroy();
  }

  typeLabel(type: TypeElementArchiApplicative): string {
    return TYPE_LABEL[type];
  }

  fluxLabel(type: TypeFluxArchiApplicative): string {
    return TYPE_FLUX_LABEL[type];
  }

  paletteIcon(type: TypeElementArchiApplicative): string {
    return PALETTE_ICON[type];
  }

  elementLabel(id: string): string {
    return this.elements.find((e) => e.id === id)?.nom ?? '?';
  }

  // ── Chargement ───────────────────────────────────────────────────────────

  private load(): void {
    this.loading = true;
    forkJoin({ elements: this.service.listElements(), flux: this.service.listFlux() }).subscribe({
      next: ({ elements, flux }) => {
        this.elements = elements;
        this.flux = flux;
        this.loading = false;
        this.render();
      },
      error: () => {
        this.loading = false;
        this.toast.error("Impossible de charger le diagramme d'architecture applicative.");
      },
    });
  }

  // ── Rendu ────────────────────────────────────────────────────────────────

  private render(): void {
    this.layer.destroyChildren();
    this.nodesById.clear();
    this.positionsById.clear();

    const resolved = this.resolvePositions(this.elements);
    for (const element of this.elements) {
      this.positionsById.set(element.id, resolved.get(element.id)!);
    }

    this.fluxLayer = new Konva.Group();
    this.boxLayer = new Konva.Group();
    this.layer.add(this.fluxLayer);
    this.layer.add(this.boxLayer);

    for (const flux of this.flux) {
      const arrow = this.buildFluxArrow(flux);
      if (arrow) this.fluxLayer.add(arrow);
    }

    for (const element of this.elements) {
      const group = this.buildBox(element, resolved.get(element.id)!);
      this.nodesById.set(element.id, group);
      this.boxLayer.add(group);
    }

    this.layer.draw();
  }

  private resolvePositions(elements: ArchiApplicativeElement[]): Map<string, Pos> {
    const result = new Map<string, Pos>();
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

  private buildIcon(type: TypeElementArchiApplicative, w: number, h: number): Konva.Group {
    const g = new Konva.Group({ listening: false });
    const icx = w - 16;
    const icy = 14;
    const color = TYPE_COLOR[type].stroke;
    switch (type) {
      case 'UTILISATEUR_INTERNE':
      case 'UTILISATEUR_EXTERNE':
        g.add(new Konva.Circle({ x: icx, y: icy - 4, radius: 2.2, stroke: color, strokeWidth: 1.1 }));
        g.add(new Konva.Path({ data: `M${icx - 4.5},${icy + 6} Q${icx},${icy - 1} ${icx + 4.5},${icy + 6}`, stroke: color, strokeWidth: 1.1, lineCap: 'round' }));
        break;
      case 'APPLICATION':
        [0, 1, 2].forEach((i) =>
          g.add(new Konva.Rect({ x: icx - 7, y: icy - 6 + i * 4.5, width: i === 2 ? 9 : 14, height: 2.6, cornerRadius: 1, fill: color })),
        );
        break;
      case 'SYSTEME_EXTERNE':
        g.add(new Konva.Circle({ x: icx - 3.5, y: icy, radius: 4.5, stroke: color, strokeWidth: 1.2 }));
        g.add(new Konva.Circle({ x: icx + 3.5, y: icy, radius: 4.5, stroke: color, strokeWidth: 1.2 }));
        break;
      case 'INFRASTRUCTURE':
        g.add(new Konva.Rect({ x: icx - 8, y: icy - 8, width: 16, height: 6, cornerRadius: 1, stroke: color, strokeWidth: 1 }));
        g.add(new Konva.Rect({ x: icx - 8, y: icy, width: 16, height: 6, cornerRadius: 1, stroke: color, strokeWidth: 1 }));
        g.add(new Konva.Circle({ x: icx - 5, y: icy - 5, radius: 0.8, fill: color }));
        g.add(new Konva.Circle({ x: icx - 5, y: icy + 3, radius: 0.8, fill: color }));
        break;
      case 'SECURITE':
        g.add(
          new Konva.Path({
            data: `M${icx},${icy - 9} L${icx + 7},${icy - 6} L${icx + 7},${icy} Q${icx + 7},${icy + 7} ${icx},${icy + 10} Q${icx - 7},${icy + 7} ${icx - 7},${icy} L${icx - 7},${icy - 6} Z`,
            stroke: color,
            strokeWidth: 1.2,
            lineJoin: 'round',
          }),
        );
        break;
    }
    return g;
  }

  private buildBox(element: ArchiApplicativeElement, pos: Pos): Konva.Group {
    const size = SHAPE_SIZE[element.type];
    const color = TYPE_COLOR[element.type];
    const group = new Konva.Group({ x: pos.x, y: pos.y, draggable: true });
    group.setAttr('nodeKey', element.id);

    if (element.type === 'BASE_DE_DONNEES') {
      const cx = size.w / 2;
      const ry = 9;
      group.add(
        new Konva.Path({
          data: `M0,${ry} L0,${size.h - ry} A${size.w / 2},${ry} 0 0 0 ${size.w},${size.h - ry} L${size.w},${ry}`,
          fill: color.fill,
          stroke: color.stroke,
          strokeWidth: 1.5,
        }),
      );
      group.add(new Konva.Ellipse({ x: cx, y: ry, radiusX: size.w / 2, radiusY: ry, fill: color.fill, stroke: color.stroke, strokeWidth: 1.5 }));
      group.add(
        new Konva.Text({
          x: -30,
          y: size.h + 4,
          width: size.w + 60,
          text: element.nom,
          fontSize: 11,
          fill: '#1a1a1a',
          align: 'center',
          wrap: 'word',
        }),
      );
    } else {
      group.add(
        new Konva.Rect({
          width: size.w,
          height: size.h,
          fill: color.fill,
          stroke: color.stroke,
          strokeWidth: 1.5,
          cornerRadius: 6,
          dash: color.dashed ? [5, 3] : undefined,
        }),
      );
      group.add(this.buildIcon(element.type, size.w, size.h));
      group.add(
        new Konva.Text({
          x: 8,
          y: 0,
          width: size.w - 16,
          height: size.h,
          text: element.nom,
          fontSize: 11.5,
          fill: '#1a1a1a',
          align: 'center',
          verticalAlign: 'middle',
          wrap: 'word',
        }),
      );
    }

    const anchorPositions = [
      { x: size.w / 2, y: 0 },
      { x: size.w, y: size.h / 2 },
      { x: size.w / 2, y: size.h },
      { x: 0, y: size.h / 2 },
    ];
    const anchors = anchorPositions.map((p) => {
      const circle = new Konva.Circle({ x: p.x, y: p.y, radius: 6, fill: '#455A64', stroke: '#ffffff', strokeWidth: 1.5, opacity: 0 });
      circle.on('mousedown', (e) => {
        e.cancelBubble = true;
        group.draggable(false);
        this.startLinking(element.id, { x: group.x() + p.x, y: group.y() + p.y });
      });
      circle.on('mouseenter', () => {
        document.body.style.cursor = 'crosshair';
        circle.radius(8);
        this.layer.batchDraw();
      });
      circle.on('mouseleave', () => {
        document.body.style.cursor = 'grab';
        circle.radius(6);
        this.layer.batchDraw();
      });
      group.add(circle);
      return circle;
    });

    const deleteBtn = new Konva.Group({ x: size.w, y: 0, opacity: 0 });
    deleteBtn.add(new Konva.Circle({ radius: 8, fill: '#dc2626', stroke: '#ffffff', strokeWidth: 1 }));
    deleteBtn.add(
      new Konva.Text({ text: '×', fontSize: 13, fontStyle: 'bold', fill: '#ffffff', width: 16, height: 16, offsetX: 8, offsetY: 8.5, align: 'center', verticalAlign: 'middle', listening: false }),
    );
    deleteBtn.on('mousedown', (e) => (e.cancelBubble = true));
    deleteBtn.on('click', (e) => {
      e.cancelBubble = true;
      this.deleteElement(element);
    });
    deleteBtn.on('mouseenter', () => (document.body.style.cursor = 'pointer'));
    deleteBtn.on('mouseleave', () => (document.body.style.cursor = 'grab'));
    group.add(deleteBtn);

    const editBtn = new Konva.Group({ x: size.w - 20, y: 0, opacity: 0 });
    editBtn.add(new Konva.Circle({ radius: 8, fill: '#E29E09', stroke: '#ffffff', strokeWidth: 1 }));
    editBtn.add(
      new Konva.Text({ text: '✎', fontSize: 10, fill: '#ffffff', width: 16, height: 16, offsetX: 8, offsetY: 8, align: 'center', verticalAlign: 'middle', listening: false }),
    );
    editBtn.on('mousedown', (e) => (e.cancelBubble = true));
    editBtn.on('click', (e) => {
      e.cancelBubble = true;
      this.openEditElement(element);
    });
    editBtn.on('mouseenter', () => (document.body.style.cursor = 'pointer'));
    editBtn.on('mouseleave', () => (document.body.style.cursor = 'grab'));
    group.add(editBtn);

    group.on('mouseenter', () => {
      document.body.style.cursor = 'grab';
      anchors.forEach((a) => a.opacity(0.8));
      deleteBtn.opacity(1);
      editBtn.opacity(1);
      this.layer.batchDraw();
    });
    group.on('mouseleave', () => {
      document.body.style.cursor = 'default';
      if (this.linking) return;
      anchors.forEach((a) => a.opacity(0));
      deleteBtn.opacity(0);
      editBtn.opacity(0);
      this.layer.batchDraw();
    });

    group.on('dragmove', () => {
      this.positionsById.set(element.id, { x: group.x(), y: group.y(), w: size.w, h: size.h });
      this.redrawFlux();
    });
    group.on('dragend', () => {
      element.positionX = group.x();
      element.positionY = group.y();
      this.positionChange$.next({ id: element.id, x: group.x(), y: group.y() });
    });

    return group;
  }

  private savePosition(id: string, x: number, y: number): void {
    this.service.updateElement(id, { positionX: x, positionY: y }).subscribe({
      error: () => this.toast.error("Impossible d'enregistrer la position."),
    });
  }

  private buildFluxArrow(flux: ArchiApplicativeFlux): Konva.Group | null {
    const from = this.positionsById.get(flux.sourceId);
    const to = this.positionsById.get(flux.targetId);
    if (!from || !to) return null;

    const start = this.borderPoint(from, to);
    const end = this.borderPoint(to, from);
    const style = FLUX_COLOR[flux.type];
    const group = new Konva.Group();
    group.add(
      new Konva.Arrow({
        points: [start.x, start.y, end.x, end.y],
        stroke: style.color,
        fill: style.color,
        strokeWidth: 1.6,
        pointerLength: 8,
        pointerWidth: 8,
        dash: style.dashed ? [6, 4] : undefined,
      }),
    );
    if (flux.label) {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      group.add(
        new Konva.Text({ x: midX - 40, y: midY - 14, width: 80, text: flux.label, fontSize: 10, fill: style.color, align: 'center' }),
      );
    }
    return group;
  }

  private redrawFlux(): void {
    this.fluxLayer.destroyChildren();
    for (const flux of this.flux) {
      const arrow = this.buildFluxArrow(flux);
      if (arrow) this.fluxLayer.add(arrow);
    }
    this.layer.draw();
  }

  private borderPoint(from: Pos, to: Pos): { x: number; y: number } {
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

  // ── Liaison interactive (points d'ancrage) ──────────────────────────────

  private startLinking(fromId: string, from: { x: number; y: number }): void {
    const line = new Konva.Line({ points: [from.x, from.y, from.x, from.y], stroke: '#2E7D32', strokeWidth: 2, dash: [4, 3], listening: false });
    this.fluxLayer.add(line);
    this.linking = { fromId, line };
  }

  private onStageMouseMove(): void {
    if (!this.linking) return;
    const pos = this.stage.getRelativePointerPosition();
    if (!pos) return;
    const points = this.linking.line.points();
    this.linking.line.points([points[0], points[1], pos.x, pos.y]);
    this.layer.batchDraw();
  }

  private onStageMouseUp(e: Konva.KonvaEventObject<MouseEvent>): void {
    if (!this.linking) return;
    const fromId = this.linking.fromId;
    this.nodesById.get(fromId)?.draggable(true);
    const targetId = this.resolveNodeIdFromEvent(e.target);
    this.linking.line.destroy();
    this.linking = null;
    document.body.style.cursor = 'default';
    this.layer.batchDraw();

    if (targetId && targetId !== fromId) {
      this.pendingFlux = { sourceId: fromId, targetId, type: 'DONNEES', label: '' };
    }
  }

  private cancelLinking(): void {
    if (!this.linking) return;
    this.nodesById.get(this.linking.fromId)?.draggable(true);
    this.linking.line.destroy();
    this.linking = null;
    document.body.style.cursor = 'default';
    this.layer?.batchDraw();
  }

  private resolveNodeIdFromEvent(target: Konva.Node): string | null {
    let node: Konva.Node | null = target;
    while (node && node !== this.stage) {
      const id = node.getAttr('nodeKey');
      if (id) return id as string;
      node = node.getParent();
    }
    return null;
  }

  confirmFlux(event: Event): void {
    event.preventDefault();
    const pf = this.pendingFlux;
    if (!pf) return;
    this.service.createFlux({ sourceId: pf.sourceId, targetId: pf.targetId, type: pf.type, label: pf.label || undefined }).subscribe({
      next: () => {
        this.pendingFlux = null;
        this.toast.success('Flux créé.');
        this.load();
        this.changed.emit();
      },
      error: () => this.toast.error('Impossible de créer ce flux.'),
    });
  }

  cancelFlux(): void {
    this.pendingFlux = null;
  }

  // ── Zoom / pan / resize ─────────────────────────────────────────────────

  private onWheel(e: Konva.KonvaEventObject<WheelEvent>): void {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const oldScale = this.stage.scaleX();
    const pointer = this.stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = { x: (pointer.x - this.stage.x()) / oldScale, y: (pointer.y - this.stage.y()) / oldScale };
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clamped = Math.min(Math.max(newScale, 0.3), 2.5);

    this.stage.scale({ x: clamped, y: clamped });
    this.stage.position({ x: pointer.x - mousePointTo.x * clamped, y: pointer.y - mousePointTo.y * clamped });
    this.stage.batchDraw();
  }

  private resizeStage(): void {
    if (!this.stage) return;
    this.stage.width(this.stageHost.nativeElement.clientWidth);
    this.stage.height(this.stageHost.nativeElement.clientHeight);
  }

  // ── Drop depuis la palette ───────────────────────────────────────────────

  onDragStart(event: DragEvent, type: TypeElementArchiApplicative): void {
    event.dataTransfer?.setData('application/x-archivision-type-archi-applicative', type);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const type = event.dataTransfer?.getData('application/x-archivision-type-archi-applicative') as TypeElementArchiApplicative | undefined;
    if (!type) return;

    const size = SHAPE_SIZE[type];
    const rect = this.stageHost.nativeElement.getBoundingClientRect();
    const scale = this.stage.scaleX();
    const x = (event.clientX - rect.left - this.stage.x()) / scale - size.w / 2;
    const y = (event.clientY - rect.top - this.stage.y()) / scale - size.h / 2;

    this.pendingCreate = { type, x, y, nom: '', description: '' };
  }

  cancelCreate(): void {
    this.pendingCreate = null;
  }

  confirmCreate(event: Event): void {
    event.preventDefault();
    const p = this.pendingCreate;
    if (!p || !p.nom.trim()) return;
    const nom = p.nom.trim();

    this.service
      .createElement({ nom, type: p.type, description: p.description || undefined })
      .subscribe({
        next: (created) => {
          this.service.updateElement(created.id, { positionX: p.x, positionY: p.y }).subscribe();
          this.elements = [...this.elements, { ...created, positionX: p.x, positionY: p.y }];
          this.pendingCreate = null;
          this.render();
          this.toast.success('Élément ajouté.');
          this.changed.emit();
        },
        error: () => this.toast.error("Impossible d'ajouter cet élément."),
      });
  }

  // ── Modification ─────────────────────────────────────────────────────────

  openEditElement(element: ArchiApplicativeElement): void {
    this.pendingEdit = { id: element.id, nom: element.nom, description: element.description ?? '' };
  }

  cancelEdit(): void {
    this.pendingEdit = null;
  }

  confirmEdit(event: Event): void {
    event.preventDefault();
    const pe = this.pendingEdit;
    if (!pe || !pe.nom.trim()) return;
    const nom = pe.nom.trim();

    this.service.updateElement(pe.id, { nom, description: pe.description || undefined }).subscribe({
      next: (updated) => {
        this.elements = this.elements.map((e) => (e.id === updated.id ? { ...e, ...updated } : e));
        this.pendingEdit = null;
        this.render();
        this.toast.success('Élément modifié.');
        this.changed.emit();
      },
      error: () => this.toast.error("Impossible de modifier cet élément."),
    });
  }

  // ── Suppression ──────────────────────────────────────────────────────────

  async deleteElement(element: ArchiApplicativeElement): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      `Supprimer « ${element.nom} » ? Les flux qui lui sont rattachés seront aussi supprimés.`,
    );
    if (!confirmed) return;

    this.service.deleteElement(element.id).subscribe({
      next: () => {
        this.elements = this.elements.filter((e) => e.id !== element.id);
        this.flux = this.flux.filter((f) => f.sourceId !== element.id && f.targetId !== element.id);
        this.nodesById.delete(element.id);
        this.positionsById.delete(element.id);
        this.render();
        this.toast.success('Élément supprimé.');
        this.changed.emit();
      },
      error: () => this.toast.error("Impossible de supprimer cet élément."),
    });
  }
}
