import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import Konva from 'konva';
import { forkJoin, Observable, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ArchimateService, ElementArchimate, RelationArchimate, TypeElement, TypeRelation } from '../architecture-metier/archimate.service';
import { Application, UrbanisationService } from '../urbanisation/urbanisation.service';
import { TechComponent, TechnologieService, TypeTechComponent } from '../technologie/technologie.service';
import { DataEntity, DonneesService } from '../donnees/donnees.service';
import { CanevasService, CanevasRelation, ElementKind } from './canevas.service';
import {
  CanevasPaletteComponent,
  CANEVAS_DRAG_MIME,
  CanevasDragPayload,
  TYPE_ELEMENT_LABEL,
  TYPE_TECH_COMPONENT_LABEL,
  MOTIVATION_TYPES,
  LAYER_COLORS,
} from './canevas-palette.component';
import { ToastService } from '../shared/toast.service';
import { ConfirmDialogService } from '../shared/confirm-dialog.service';

const BOX_WIDTH = 170;
const BOX_HEIGHT = 56;
const GAP_X = 30;
const GAP_Y = 30;

const RELATION_LABEL: Record<TypeRelation, string> = {
  ASSIGNATION: 'assignation',
  COMPOSITION: 'composition',
  REALISATION: 'réalisation',
  ASSOCIATION: 'association',
};
const RELATION_TYPES: TypeRelation[] = ['ASSIGNATION', 'COMPOSITION', 'REALISATION', 'ASSOCIATION'];

type Colors = { fill: string; stroke: string; text: string };

interface CanevasElement {
  key: string;
  kind: ElementKind;
  id: string;
  nom: string;
  typeLabel: string;
  positionX: number | null;
  positionY: number | null;
  colors: Colors;
}

interface CanevasRelationView {
  id: string;
  type: TypeRelation;
  sourceKey: string;
  targetKey: string;
  origin: 'ARCHIMATE' | 'CANEVAS';
}

interface PendingCreate {
  kind: ElementKind;
  type?: TypeElement | TypeTechComponent;
  x: number;
  y: number;
  nom: string;
}

interface PendingRelation {
  sourceKey: string;
  targetKey: string;
  type: TypeRelation;
}

@Component({
  selector: 'app-canevas',
  standalone: true,
  imports: [CommonModule, CanevasPaletteComponent],
  template: `
    <p class="hint">
      Pour relier deux éléments : survolez un élément 4 petits points apparaissent sur ses bords  puis glissez
      depuis l'un de ces points jusqu'à l'élément cible. Pour supprimer un élément, survolez-le et cliquez sur le
      « × » rouge en haut à droite.
    </p>

    <div class="page-header page-header-end">
      <div class="actions">
        <button class="btn btn-outline" (click)="exportPng()" [disabled]="loading || elements.length === 0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 21h16" />
          </svg>
          Exporter en PNG
        </button>
        <button
          class="btn btn-primary"
          (click)="generate()"
          [disabled]="loading"
          title="Positionne automatiquement tous les éléments du canevas (Motivation, Métier, Applicatif, Technologique, Données)."
        >
          {{ generating ? 'Génération…' : 'Générer' }}
        </button>
      </div>
    </div>

    <div class="canevas-layout">
      <app-canevas-palette />

      <div class="stage-wrap">
        <div class="empty-state" *ngIf="!loading && elements.length === 0">
          Aucun élément pour l'instant , glissez un élément depuis la palette ou cliquez sur « Générer ».
        </div>
        <div
          #stageHost
          class="stage-host"
          (dragover)="onDragOver($event)"
          (drop)="onDrop($event)"
        ></div>
      </div>
    </div>

    <div class="pending-form" *ngIf="pendingCreate as p">
      <form class="card form-card" (submit)="confirmCreate($event)">
        <h3>Nouvel élément — {{ typeLabel(p.kind, p.type) }}</h3>
        <label class="field">
          Nom
          <input type="text" [value]="p.nom" (input)="p.nom = $any($event.target).value" required autofocus />
        </label>
        <div class="pending-actions">
          <button type="button" class="btn btn-ghost" (click)="cancelCreate()">Annuler</button>
          <button type="submit" class="btn btn-primary">Créer</button>
        </div>
      </form>
    </div>

    <div class="pending-form" *ngIf="pendingRelation as pr">
      <form class="card form-card" (submit)="confirmRelation($event)">
        <h3>Nouvelle relation</h3>
        <p class="muted">{{ elementLabel(pr.sourceKey) }} → {{ elementLabel(pr.targetKey) }}</p>
        <label class="field">
          Type
          <select [value]="pr.type" (change)="pr.type = $any($event.target).value">
            <option *ngFor="let t of relationTypes" [value]="t">{{ relationLabel(t) }}</option>
          </select>
        </label>
        <div class="pending-actions">
          <button type="button" class="btn btn-ghost" (click)="cancelRelation()">Annuler</button>
          <button type="submit" class="btn btn-primary">Créer</button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .actions {
        display: flex;
        gap: 0.6rem;
      }
      .hint {
        color: var(--color-text-muted);
        font-size: 0.85rem;
        margin: -0.5rem 0 1rem;
      }
      .canevas-layout {
        display: flex;
        gap: 1.25rem;
        align-items: flex-start;
      }
      .stage-wrap {
        position: relative;
        flex: 1;
        min-width: 0;
        background: var(--color-white);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
      }
      .stage-host {
        width: 100%;
        height: 68vh;
        min-height: 420px;
        cursor: grab;
      }
      .stage-wrap .empty-state {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      .pending-form {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
      }
      .pending-form .card {
        width: 320px;
      }
      .pending-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.6rem;
        margin-top: 0.5rem;
      }
    `,
  ],
})
export class CanevasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('stageHost') stageHost!: ElementRef<HTMLDivElement>;

  loading = true;
  generating = false;
  elements: CanevasElement[] = [];
  relations: CanevasRelationView[] = [];
  pendingCreate: PendingCreate | null = null;
  pendingRelation: PendingRelation | null = null;
  relationTypes = RELATION_TYPES;

  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private relationLayer!: Konva.Group;
  private boxLayer!: Konva.Group;
  private nodesById = new Map<string, Konva.Group>();
  private positionsById = new Map<string, { x: number; y: number }>();
  private linking: { fromKey: string; line: Konva.Line } | null = null;
  private readonly positionChange$ = new Subject<{ kind: ElementKind; id: string; x: number; y: number }>();
  private readonly resizeHandler = () => this.resizeStage();
  private readonly windowMouseUpHandler = () => this.cancelLinking();

  constructor(
    private readonly archimateService: ArchimateService,
    private readonly urbanisationService: UrbanisationService,
    private readonly technologieService: TechnologieService,
    private readonly donneesService: DonneesService,
    private readonly canevasService: CanevasService,
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

    this.positionChange$.pipe(debounceTime(400)).subscribe(({ kind, id, x, y }) => this.savePosition(kind, id, x, y));

    this.loadAll();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener('mouseup', this.windowMouseUpHandler);
    this.stage?.destroy();
  }

  typeLabel(kind: ElementKind, type?: TypeElement | TypeTechComponent): string {
    if (kind === 'ARCHIMATE' && type) return TYPE_ELEMENT_LABEL[type as TypeElement];
    if (kind === 'TECH_COMPONENT' && type) return TYPE_TECH_COMPONENT_LABEL[type as TypeTechComponent];
    if (kind === 'APPLICATION') return 'Application';
    return 'Entité de données';
  }

  relationLabel(type: TypeRelation): string {
    return RELATION_LABEL[type];
  }

  elementLabel(key: string): string {
    return this.elements.find((e) => e.key === key)?.nom ?? '?';
  }

  // ── Chargement ───────────────────────────────────────────────────────────

  private loadAll(): void {
    this.loading = true;
    forkJoin({
      archimateElements: this.archimateService.listElements(),
      applications: this.urbanisationService.listApplications(),
      techComponents: this.technologieService.list(),
      dataEntities: this.donneesService.list(),
      archimateRelations: this.archimateService.listRelations(),
      canevasRelations: this.canevasService.listRelations(),
    }).subscribe({
      next: (result) => this.afterAllLoaded(result),
      error: () => {
        this.loading = false;
        this.toast.error('Impossible de charger le canevas.');
      },
    });
  }

  private afterAllLoaded(result: {
    archimateElements: ElementArchimate[];
    applications: Application[];
    techComponents: TechComponent[];
    dataEntities: DataEntity[];
    archimateRelations: RelationArchimate[];
    canevasRelations: CanevasRelation[];
  }): void {
    const allElements = [
      ...result.archimateElements,
      ...result.applications,
      ...result.techComponents,
      ...result.dataEntities,
    ];
    const canvasIsFresh = allElements.length > 0 && allElements.every((e) => e.positionX == null);

    if (canvasIsFresh) {
      // Canevas jamais ouvert pour cette organisation : on positionne tout de
      // suite les éléments issus de l'inscription/de l'assistant, sur toutes
      // les couches, pour arriver sur un plan de travail déjà exploitable.
      this.buildFromSources(result);
      this.archimateService.generateLayout().subscribe({
        next: (layout) => {
          const updatedById = new Map(layout.elements.map((e) => [e.id, e]));
          this.elements = this.elements.map((el) => {
            if (el.kind !== 'ARCHIMATE') return el;
            const updated = updatedById.get(el.id);
            return updated ? { ...el, positionX: updated.positionX ?? null, positionY: updated.positionY ?? null } : el;
          });
          const archimateBottomY = layout.elements.length
            ? Math.max(...layout.elements.map((e) => (e.positionY ?? 0) + BOX_HEIGHT)) + GAP_Y
            : 40;
          this.generateOtherLayers(archimateBottomY).subscribe({
            next: () => {
              this.loading = false;
              this.render();
            },
            error: () => {
              this.loading = false;
              this.render();
            },
          });
        },
        error: () => {
          this.loading = false;
          this.render();
        },
      });
      return;
    }
    this.buildFromSources(result);
    this.loading = false;
    this.render();
  }

  private buildFromSources(result: {
    archimateElements: ElementArchimate[];
    applications: Application[];
    techComponents: TechComponent[];
    dataEntities: DataEntity[];
    archimateRelations: RelationArchimate[];
    canevasRelations: CanevasRelation[];
  }): void {
    const archimateEls: CanevasElement[] = result.archimateElements.map((e) => ({
      key: this.key('ARCHIMATE', e.id),
      kind: 'ARCHIMATE',
      id: e.id,
      nom: e.nom,
      typeLabel: TYPE_ELEMENT_LABEL[e.type],
      positionX: e.positionX ?? null,
      positionY: e.positionY ?? null,
      colors: this.colorsFor('ARCHIMATE', e.type),
    }));
    const apps: CanevasElement[] = result.applications.map((a) => ({
      key: this.key('APPLICATION', a.id),
      kind: 'APPLICATION',
      id: a.id,
      nom: a.nom,
      typeLabel: 'Application',
      positionX: a.positionX ?? null,
      positionY: a.positionY ?? null,
      colors: LAYER_COLORS.APPLICATION,
    }));
    const techs: CanevasElement[] = result.techComponents.map((t) => ({
      key: this.key('TECH_COMPONENT', t.id),
      kind: 'TECH_COMPONENT',
      id: t.id,
      nom: t.nom,
      typeLabel: TYPE_TECH_COMPONENT_LABEL[t.type],
      positionX: t.positionX ?? null,
      positionY: t.positionY ?? null,
      colors: LAYER_COLORS.TECH_COMPONENT,
    }));
    const datas: CanevasElement[] = result.dataEntities.map((d) => ({
      key: this.key('DATA_ENTITY', d.id),
      kind: 'DATA_ENTITY',
      id: d.id,
      nom: d.nom,
      typeLabel: 'Entité de données',
      positionX: d.positionX ?? null,
      positionY: d.positionY ?? null,
      colors: LAYER_COLORS.DATA_ENTITY,
    }));
    this.elements = [...archimateEls, ...apps, ...techs, ...datas];

    const archimateRels: CanevasRelationView[] = result.archimateRelations.map((r) => ({
      id: r.id,
      type: r.type,
      sourceKey: this.key('ARCHIMATE', r.source.id),
      targetKey: this.key('ARCHIMATE', r.target.id),
      origin: 'ARCHIMATE',
    }));
    const canevasRels: CanevasRelationView[] = result.canevasRelations.map((r) => ({
      id: r.id,
      type: r.type,
      sourceKey: this.key(r.sourceKind, r.sourceId),
      targetKey: this.key(r.targetKind, r.targetId),
      origin: 'CANEVAS',
    }));
    this.relations = [...archimateRels, ...canevasRels];
  }

  private key(kind: ElementKind, id: string): string {
    return `${kind}:${id}`;
  }

  private splitKey(key: string): [ElementKind, string] {
    const i = key.indexOf(':');
    return [key.slice(0, i) as ElementKind, key.slice(i + 1)];
  }

  private colorsFor(kind: ElementKind, archimateType?: TypeElement): Colors {
    if (kind === 'ARCHIMATE') {
      return archimateType && MOTIVATION_TYPES.includes(archimateType)
        ? { fill: '#E6E6FA', stroke: '#7A6FBE', text: '#4A4177' }
        : { fill: '#FFFFB3', stroke: '#C6A700', text: '#7A6400' };
    }
    return LAYER_COLORS[kind];
  }

  // ── Rendu ────────────────────────────────────────────────────────────────

  private render(): void {
    this.layer.destroyChildren();
    this.nodesById.clear();
    this.positionsById.clear();

    const resolved = this.resolvePositions(this.elements);
    for (const element of this.elements) {
      this.positionsById.set(element.key, resolved.get(element.key)!);
    }

    this.relationLayer = new Konva.Group();
    this.boxLayer = new Konva.Group();
    this.layer.add(this.relationLayer);
    this.layer.add(this.boxLayer);

    for (const relation of this.relations) {
      const arrow = this.buildArrow(relation);
      if (arrow) this.relationLayer.add(arrow);
    }

    for (const element of this.elements) {
      const group = this.buildBox(element, resolved.get(element.key)!);
      this.nodesById.set(element.key, group);
      this.boxLayer.add(group);
    }

    this.layer.draw();
  }

  /** Complète les positions manquantes (élément jamais positionné) par un
   * empilement sous la zone déjà occupée, sans rien persister. */
  private resolvePositions(elements: CanevasElement[]): Map<string, { x: number; y: number }> {
    const result = new Map<string, { x: number; y: number }>();
    let maxY = 40;
    let hasAny = false;
    for (const element of elements) {
      if (element.positionX != null && element.positionY != null) {
        result.set(element.key, { x: element.positionX, y: element.positionY });
        maxY = Math.max(maxY, element.positionY + BOX_HEIGHT);
        hasAny = true;
      }
    }
    const startY = hasAny ? maxY + GAP_Y : 40;
    let col = 0;
    for (const element of elements) {
      if (result.has(element.key)) continue;
      const x = 40 + col * (BOX_WIDTH + GAP_X);
      result.set(element.key, { x, y: startY });
      col += 1;
    }
    return result;
  }

  private buildBox(element: CanevasElement, pos: { x: number; y: number }): Konva.Group {
    const colors = element.colors;
    const group = new Konva.Group({ x: pos.x, y: pos.y, draggable: true });
    group.setAttr('nodeKey', element.key);

    group.add(
      new Konva.Rect({
        width: BOX_WIDTH,
        height: BOX_HEIGHT,
        fill: colors.fill,
        stroke: colors.stroke,
        strokeWidth: 1.5,
        cornerRadius: 4,
      }),
    );
    group.add(
      new Konva.Text({ x: 8, y: 6, text: element.typeLabel, fontSize: 9, fill: colors.text }),
    );
    group.add(
      new Konva.Text({
        x: 8,
        y: 22,
        width: BOX_WIDTH - 16,
        text: element.nom,
        fontSize: 12,
        fill: '#1a1a1a',
        align: 'center',
        wrap: 'word',
      }),
    );

    const anchorPositions = [
      { x: BOX_WIDTH / 2, y: 0 },
      { x: BOX_WIDTH, y: BOX_HEIGHT / 2 },
      { x: BOX_WIDTH / 2, y: BOX_HEIGHT },
      { x: 0, y: BOX_HEIGHT / 2 },
    ];
    const anchors = anchorPositions.map((p) => {
      const circle = new Konva.Circle({
        x: p.x,
        y: p.y,
        radius: 6,
        fill: colors.stroke,
        stroke: '#ffffff',
        strokeWidth: 1.5,
        opacity: 0,
      });
      circle.on('mousedown', (e) => {
        e.cancelBubble = true;
        group.draggable(false);
        this.startLinking(element.key, { x: group.x() + p.x, y: group.y() + p.y });
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

    const deleteBtn = new Konva.Group({ x: BOX_WIDTH, y: 0, opacity: 0 });
    deleteBtn.add(new Konva.Circle({ radius: 8, fill: '#dc2626', stroke: '#ffffff', strokeWidth: 1 }));
    deleteBtn.add(
      new Konva.Text({
        text: '×',
        fontSize: 13,
        fontStyle: 'bold',
        fill: '#ffffff',
        width: 16,
        height: 16,
        offsetX: 8,
        offsetY: 8.5,
        align: 'center',
        verticalAlign: 'middle',
        listening: false,
      }),
    );
    deleteBtn.on('mousedown', (e) => {
      e.cancelBubble = true;
    });
    deleteBtn.on('click', (e) => {
      e.cancelBubble = true;
      this.deleteElement(element);
    });
    deleteBtn.on('mouseenter', () => {
      document.body.style.cursor = 'pointer';
    });
    deleteBtn.on('mouseleave', () => {
      document.body.style.cursor = 'grab';
    });
    group.add(deleteBtn);

    group.on('mouseenter', () => {
      document.body.style.cursor = 'grab';
      anchors.forEach((a) => a.opacity(0.8));
      deleteBtn.opacity(1);
      this.layer.batchDraw();
    });
    group.on('mouseleave', () => {
      document.body.style.cursor = 'default';
      if (this.linking) return;
      anchors.forEach((a) => a.opacity(0));
      deleteBtn.opacity(0);
      this.layer.batchDraw();
    });

    group.on('dragmove', () => {
      this.positionsById.set(element.key, { x: group.x(), y: group.y() });
      this.redrawArrows();
    });
    group.on('dragend', () => {
      element.positionX = group.x();
      element.positionY = group.y();
      this.positionChange$.next({ kind: element.kind, id: element.id, x: group.x(), y: group.y() });
    });

    return group;
  }

  private savePosition(kind: ElementKind, id: string, x: number, y: number): void {
    this.positionUpdateRequest(kind, id, x, y).subscribe({
      error: () => this.toast.error("Impossible d'enregistrer la position."),
    });
  }

  private positionUpdateRequest(kind: ElementKind, id: string, x: number, y: number): Observable<unknown> {
    return (
      kind === 'ARCHIMATE'
        ? this.archimateService.updateElementPosition(id, x, y)
        : kind === 'APPLICATION'
          ? this.urbanisationService.updateApplication(id, { positionX: x, positionY: y })
          : kind === 'TECH_COMPONENT'
            ? this.technologieService.update(id, { positionX: x, positionY: y })
            : this.donneesService.update(id, { positionX: x, positionY: y })
    ) as Observable<unknown>;
  }

  private buildArrow(relation: CanevasRelationView): Konva.Arrow | null {
    const from = this.positionsById.get(relation.sourceKey);
    const to = this.positionsById.get(relation.targetKey);
    if (!from || !to) return null;

    const start = this.borderPoint(from, to);
    const end = this.borderPoint(to, from);
    return new Konva.Arrow({
      points: [start.x, start.y, end.x, end.y],
      stroke: '#555',
      fill: '#555',
      strokeWidth: 1.5,
      pointerLength: 8,
      pointerWidth: 8,
      dash: relation.type === 'REALISATION' ? [6, 4] : undefined,
      name: `relation-${relation.id}`,
    });
  }

  private redrawArrows(): void {
    this.relationLayer.destroyChildren();
    for (const relation of this.relations) {
      const arrow = this.buildArrow(relation);
      if (arrow) this.relationLayer.add(arrow);
    }
    this.layer.draw();
  }

  private borderPoint(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number } {
    const fromCx = from.x + BOX_WIDTH / 2;
    const fromCy = from.y + BOX_HEIGHT / 2;
    const toCx = to.x + BOX_WIDTH / 2;
    const toCy = to.y + BOX_HEIGHT / 2;
    const dx = toCx - fromCx;
    const dy = toCy - fromCy;
    if (dx === 0 && dy === 0) return { x: fromCx, y: fromCy };
    const halfW = BOX_WIDTH / 2;
    const halfH = BOX_HEIGHT / 2;
    const scale = Math.min(dx !== 0 ? Math.abs(halfW / dx) : Infinity, dy !== 0 ? Math.abs(halfH / dy) : Infinity);
    return { x: fromCx + dx * scale, y: fromCy + dy * scale };
  }

  // ── Liaison interactive (points d'ancrage) ──────────────────────────────

  private startLinking(fromKey: string, from: { x: number; y: number }): void {
    const line = new Konva.Line({
      points: [from.x, from.y, from.x, from.y],
      stroke: '#2E7D32',
      strokeWidth: 2,
      dash: [4, 3],
      listening: false,
    });
    this.relationLayer.add(line);
    this.linking = { fromKey, line };
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
    const fromKey = this.linking.fromKey;
    this.nodesById.get(fromKey)?.draggable(true);
    const targetKey = this.resolveGroupKeyFromEvent(e.target);
    this.linking.line.destroy();
    this.linking = null;
    document.body.style.cursor = 'default';
    this.layer.batchDraw();

    if (targetKey && targetKey !== fromKey) {
      this.pendingRelation = { sourceKey: fromKey, targetKey, type: 'ASSOCIATION' };
    }
  }

  private cancelLinking(): void {
    if (!this.linking) return;
    this.nodesById.get(this.linking.fromKey)?.draggable(true);
    this.linking.line.destroy();
    this.linking = null;
    document.body.style.cursor = 'default';
    this.layer?.batchDraw();
  }

  private resolveGroupKeyFromEvent(target: Konva.Node): string | null {
    let node: Konva.Node | null = target;
    while (node && node !== this.stage) {
      const key = node.getAttr('nodeKey');
      if (key) return key as string;
      node = node.getParent();
    }
    return null;
  }

  confirmRelation(event: Event): void {
    event.preventDefault();
    const p = this.pendingRelation;
    if (!p) return;
    const [srcKind, srcId] = this.splitKey(p.sourceKey);
    const [tgtKind, tgtId] = this.splitKey(p.targetKey);
    const bothArchimate = srcKind === 'ARCHIMATE' && tgtKind === 'ARCHIMATE';

    const req$ = (
      bothArchimate
        ? this.archimateService.createRelation({ type: p.type, sourceId: srcId, targetId: tgtId })
        : this.canevasService.createRelation({
            type: p.type,
            sourceKind: srcKind,
            sourceId: srcId,
            targetKind: tgtKind,
            targetId: tgtId,
          })
    ) as Observable<unknown>;

    req$.subscribe({
      next: () => {
        this.pendingRelation = null;
        this.toast.success('Relation créée.');
        this.reloadRelationsOnly();
      },
      error: () => this.toast.error('Impossible de créer cette relation.'),
    });
  }

  cancelRelation(): void {
    this.pendingRelation = null;
  }

  private reloadRelationsOnly(): void {
    forkJoin({
      archimateRelations: this.archimateService.listRelations(),
      canevasRelations: this.canevasService.listRelations(),
    }).subscribe({
      next: (result) => {
        const archimateRels: CanevasRelationView[] = result.archimateRelations.map((r) => ({
          id: r.id,
          type: r.type,
          sourceKey: this.key('ARCHIMATE', r.source.id),
          targetKey: this.key('ARCHIMATE', r.target.id),
          origin: 'ARCHIMATE',
        }));
        const canevasRels: CanevasRelationView[] = result.canevasRelations.map((r) => ({
          id: r.id,
          type: r.type,
          sourceKey: this.key(r.sourceKind, r.sourceId),
          targetKey: this.key(r.targetKind, r.targetId),
          origin: 'CANEVAS',
        }));
        this.relations = [...archimateRels, ...canevasRels];
        this.redrawArrows();
      },
      error: () => this.toast.error("La relation est enregistrée mais l'affichage n'a pas pu être rafraîchi — rechargez la page."),
    });
  }

  // ── Zoom / pan / resize ─────────────────────────────────────────────────

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

  // ── Drop depuis la palette ───────────────────────────────────────────────

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const raw = event.dataTransfer?.getData(CANEVAS_DRAG_MIME);
    if (!raw) return;
    let payload: CanevasDragPayload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    const rect = this.stageHost.nativeElement.getBoundingClientRect();
    const scale = this.stage.scaleX();
    const x = (event.clientX - rect.left - this.stage.x()) / scale - BOX_WIDTH / 2;
    const y = (event.clientY - rect.top - this.stage.y()) / scale - BOX_HEIGHT / 2;

    this.pendingCreate = { kind: payload.kind, type: payload.type, x, y, nom: '' };
  }

  cancelCreate(): void {
    this.pendingCreate = null;
  }

  confirmCreate(event: Event): void {
    event.preventDefault();
    const p = this.pendingCreate;
    if (!p || !p.nom.trim()) return;
    const nom = p.nom.trim();

    const req$ = (
      p.kind === 'ARCHIMATE'
        ? this.archimateService.createElement({ type: p.type as TypeElement, nom, positionX: p.x, positionY: p.y })
        : p.kind === 'APPLICATION'
          ? this.urbanisationService.createApplication({ nom, positionX: p.x, positionY: p.y })
          : p.kind === 'TECH_COMPONENT'
            ? this.technologieService.create({ nom, type: p.type as TypeTechComponent, positionX: p.x, positionY: p.y })
            : this.donneesService.create({ nom, positionX: p.x, positionY: p.y })
    ) as Observable<{ id: string; nom: string }>;

    req$.subscribe({
      next: (created) => {
        const element: CanevasElement = {
          key: this.key(p.kind, created.id),
          kind: p.kind,
          id: created.id,
          nom: created.nom,
          typeLabel: this.typeLabel(p.kind, p.type),
          positionX: p.x,
          positionY: p.y,
          colors: this.colorsFor(p.kind, p.type as TypeElement),
        };
        this.elements = [...this.elements, element];
        this.pendingCreate = null;
        this.render();
        this.toast.success('Élément ajouté.');
      },
      error: () => this.toast.error("Impossible de créer l'élément."),
    });
  }

  // ── Suppression ──────────────────────────────────────────────────────────

  async deleteElement(element: CanevasElement): Promise<void> {
    const ok = await this.confirmDialog.confirm(
      `Supprimer « ${element.nom} » ? Les relations qui lui sont rattachées seront aussi supprimées.`,
    );
    if (!ok) return;

    const req$ = (
      element.kind === 'ARCHIMATE'
        ? this.archimateService.deleteElement(element.id)
        : element.kind === 'APPLICATION'
          ? this.urbanisationService.deleteApplication(element.id)
          : element.kind === 'TECH_COMPONENT'
            ? this.technologieService.delete(element.id)
            : this.donneesService.delete(element.id)
    ) as Observable<unknown>;

    req$.subscribe({
      next: () => {
        // RelationArchimate est nettoyée en cascade côté base pour les
        // éléments ArchiMate ; CanevasRelation n'a pas de contrainte de clé
        // étrangère (relations inter-couches), donc on la nettoie ici.
        const orphanCanevasRelations = this.relations.filter(
          (r) => r.origin === 'CANEVAS' && (r.sourceKey === element.key || r.targetKey === element.key),
        );
        if (orphanCanevasRelations.length) {
          forkJoin(orphanCanevasRelations.map((r) => this.canevasService.deleteRelation(r.id))).subscribe({
            error: () => {},
          });
        }

        this.elements = this.elements.filter((e) => e.key !== element.key);
        this.relations = this.relations.filter((r) => r.sourceKey !== element.key && r.targetKey !== element.key);
        this.nodesById.delete(element.key);
        this.positionsById.delete(element.key);
        this.render();
        this.toast.success('Élément supprimé.');
      },
      error: () => this.toast.error("Impossible de supprimer l'élément."),
    });
  }

  // ── Génération automatique (toutes couches) ──────────────────────────────

  /** Aligne une liste d'éléments d'une même couche sur une ligne horizontale,
   * en partant de la marge gauche, à l'ordonnée `y` donnée. */
  private layoutRow(items: CanevasElement[], y: number): Map<string, { x: number; y: number }> {
    const result = new Map<string, { x: number; y: number }>();
    items.forEach((item, i) => {
      result.set(item.key, { x: 40 + i * (BOX_WIDTH + GAP_X), y });
    });
    return result;
  }

  /** Calcule et persiste un layout en grille pour Applicatif/Technologique/
   * Données, sous la zone occupée par la couche ArchiMate. */
  private generateOtherLayers(archimateBottomY: number): Observable<unknown> {
    const apps = this.elements.filter((e) => e.kind === 'APPLICATION');
    const techs = this.elements.filter((e) => e.kind === 'TECH_COMPONENT');
    const datas = this.elements.filter((e) => e.kind === 'DATA_ENTITY');

    let y = archimateBottomY;
    const appPositions = this.layoutRow(apps, y);
    if (apps.length) y += BOX_HEIGHT + GAP_Y;
    const techPositions = this.layoutRow(techs, y);
    if (techs.length) y += BOX_HEIGHT + GAP_Y;
    const dataPositions = this.layoutRow(datas, y);

    const allPositions = new Map([...appPositions, ...techPositions, ...dataPositions]);
    for (const element of [...apps, ...techs, ...datas]) {
      const pos = allPositions.get(element.key);
      if (pos) {
        element.positionX = pos.x;
        element.positionY = pos.y;
      }
    }

    const requests = [...apps, ...techs, ...datas].map((e) =>
      this.positionUpdateRequest(e.kind, e.id, e.positionX!, e.positionY!),
    );
    return requests.length ? forkJoin(requests) : forkJoin([]);
  }

  async generate(): Promise<void> {
    const dejaPositionne = this.elements.some((e) => e.positionX != null);
    if (dejaPositionne) {
      const ok = await this.confirmDialog.confirm(
        'Cette action va réorganiser automatiquement tous les éléments (Motivation, Métier, Applicatif, Technologique, Données) et écraser leurs positions actuelles. Continuer ?',
      );
      if (!ok) return;
    }

    this.generating = true;
    this.archimateService.generateLayout().subscribe({
      next: (result) => {
        const updatedById = new Map(result.elements.map((e) => [e.id, e]));
        this.elements = this.elements.map((el) => {
          if (el.kind !== 'ARCHIMATE') return el;
          const updated = updatedById.get(el.id);
          return updated ? { ...el, positionX: updated.positionX ?? null, positionY: updated.positionY ?? null } : el;
        });
        const archimateBottomY = result.elements.length
          ? Math.max(...result.elements.map((e) => (e.positionY ?? 0) + BOX_HEIGHT)) + GAP_Y
          : 40;

        this.generateOtherLayers(archimateBottomY).subscribe({
          next: () => {
            this.generating = false;
            this.render();
            this.toast.success("Plan de l'architecture régénéré.");
          },
          error: () => {
            this.generating = false;
            this.render();
            this.toast.error("Les éléments ArchiMate ont été replacés, mais l'enregistrement des autres couches a échoué.");
          },
        });
      },
      error: () => {
        this.generating = false;
        this.toast.error('Impossible de générer le plan.');
      },
    });
  }

  // ── Export ───────────────────────────────────────────────────────────────

  exportPng(): void {
    const dataUrl = this.stage.toDataURL({ pixelRatio: 2 });
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = 'canevas-architecture.png';
    anchor.click();
  }
}
