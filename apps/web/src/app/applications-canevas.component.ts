import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import Konva from 'konva';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Application, ApplicationEchange, Criticite, UrbanisationService } from './urbanisation.service';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';

const BOX_W = 190;
const HEADER_H = 30;
const SERVICE_ROW_H = 18;
const PADDING = 8;
const GAP_X = 40;
const ROW_Y = 60;

const CRITICITE_COLOR: Record<Criticite, string> = {
  HAUTE: '#dc2626',
  MOYENNE: '#d97706',
  BASSE: '#16a34a',
};

interface Pos {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PendingEchange {
  sourceId: string;
  targetId: string;
  description: string;
  protocole: string;
}

@Component({
  selector: 'app-applications-canevas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p class="hint">
      Glissez une application pour la repositionner. Survolez une application : glissez depuis l'un des 4 points
      sur ses bords vers une autre application pour créer un échange, ou cliquez sur le « × » rouge pour la
      supprimer.
    </p>

    <div class="stage-wrap">
      <div class="empty-state" *ngIf="!loading && applications.length === 0">
        Aucune application pour l'instant — ajoutez-en depuis l'onglet Portefeuille.
      </div>
      <div #stageHost class="stage-host"></div>
    </div>

    <div class="pending-form" *ngIf="pendingEchange as pe">
      <form class="card form-card" (submit)="confirmEchange($event)">
        <h3>Nouvel échange</h3>
        <p class="muted">{{ appLabel(pe.sourceId) }} → {{ appLabel(pe.targetId) }}</p>
        <label class="field">
          Description (facultatif)
          <input type="text" placeholder="ex. Synchronisation des commandes" [value]="pe.description" (input)="pe.description = $any($event.target).value" />
        </label>
        <label class="field">
          Protocole (facultatif)
          <input type="text" placeholder="ex. REST, SFTP, message queue" [value]="pe.protocole" (input)="pe.protocole = $any($event.target).value" />
        </label>
        <div class="pending-actions">
          <button type="button" class="btn btn-ghost" (click)="cancelEchange()">Annuler</button>
          <button type="submit" class="btn btn-primary">Créer</button>
        </div>
      </form>
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
      .pending-form { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.25); display: flex; align-items: center; justify-content: center; z-index: 50; }
      .pending-form .card { width: 320px; }
      .pending-actions { display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 0.5rem; }
      .muted { color: var(--color-text-muted); font-size: 0.88rem; }
    `,
  ],
})
export class ApplicationsCanevasComponent implements AfterViewInit, OnDestroy {
  @Output() changed = new EventEmitter<void>();
  @ViewChild('stageHost') stageHost!: ElementRef<HTMLDivElement>;

  loading = true;
  applications: Application[] = [];
  echanges: ApplicationEchange[] = [];
  pendingEchange: PendingEchange | null = null;

  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private relationLayer!: Konva.Group;
  private boxLayer!: Konva.Group;
  private nodesById = new Map<string, Konva.Group>();
  private positionsById = new Map<string, Pos>();
  private linking: { fromId: string; line: Konva.Line } | null = null;
  private readonly positionChange$ = new Subject<{ id: string; x: number; y: number }>();
  private readonly resizeHandler = () => this.resizeStage();
  private readonly windowMouseUpHandler = () => this.cancelLinking();

  constructor(
    private readonly urbanisationService: UrbanisationService,
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

  appLabel(id: string): string {
    return this.applications.find((a) => a.id === id)?.nom ?? '?';
  }

  // ── Chargement ───────────────────────────────────────────────────────────

  load(): void {
    this.loading = true;
    this.urbanisationService.listApplications().subscribe({
      next: (applications) => {
        this.applications = applications;
        this.urbanisationService.listEchanges().subscribe({
          next: (echanges) => {
            this.echanges = echanges;
            this.loading = false;
            this.render();
          },
          error: () => {
            this.loading = false;
            this.toast.error('Impossible de charger les échanges.');
          },
        });
      },
      error: () => {
        this.loading = false;
        this.toast.error('Impossible de charger les applications.');
      },
    });
  }

  // ── Rendu ────────────────────────────────────────────────────────────────

  private boxHeight(app: Application): number {
    const rows = Math.max(app.services?.length ?? 0, 1);
    return HEADER_H + rows * SERVICE_ROW_H + PADDING * 2;
  }

  private render(): void {
    this.layer.destroyChildren();
    this.nodesById.clear();
    this.positionsById.clear();

    const resolved = this.resolvePositions(this.applications);
    for (const app of this.applications) {
      this.positionsById.set(app.id, resolved.get(app.id)!);
    }

    this.relationLayer = new Konva.Group();
    this.boxLayer = new Konva.Group();
    this.layer.add(this.relationLayer);
    this.layer.add(this.boxLayer);

    for (const echange of this.echanges) {
      const g = this.buildRelation(echange);
      if (g) this.relationLayer.add(g);
    }

    for (const app of this.applications) {
      const group = this.buildBox(app, resolved.get(app.id)!);
      this.nodesById.set(app.id, group);
      this.boxLayer.add(group);
    }

    this.layer.draw();
  }

  private resolvePositions(applications: Application[]): Map<string, Pos> {
    const result = new Map<string, Pos>();
    let cursorX = 40;
    for (const app of applications) {
      const h = this.boxHeight(app);
      if (app.positionX != null && app.positionY != null) {
        result.set(app.id, { x: app.positionX, y: app.positionY, w: BOX_W, h });
      } else {
        result.set(app.id, { x: cursorX, y: ROW_Y, w: BOX_W, h });
      }
      cursorX += BOX_W + GAP_X;
    }
    return result;
  }

  private buildBox(app: Application, pos: Pos): Konva.Group {
    const h = pos.h;
    const color = CRITICITE_COLOR[app.criticite];
    const group = new Konva.Group({ x: pos.x, y: pos.y, draggable: true });
    group.setAttr('nodeKey', app.id);

    group.add(new Konva.Rect({ width: BOX_W, height: HEADER_H, fill: '#1E283D', cornerRadius: [6, 6, 0, 0] }));
    group.add(new Konva.Rect({ width: 4, height: HEADER_H, fill: color, cornerRadius: [6, 0, 0, 0] }));
    group.add(
      new Konva.Text({
        x: 6,
        y: 3,
        width: BOX_W - 12,
        text: '«component»',
        fontSize: 8.5,
        fontStyle: 'italic',
        fill: '#c9d2e3',
        align: 'center',
      }),
    );
    group.add(
      new Konva.Text({
        x: 6,
        y: 14,
        width: BOX_W - 12,
        height: HEADER_H - 14,
        text: app.nom,
        fontSize: 12,
        fontStyle: 'bold',
        fill: '#ffffff',
        align: 'center',
        verticalAlign: 'middle',
        wrap: 'none',
        ellipsis: true,
      }),
    );
    group.add(
      new Konva.Rect({
        y: HEADER_H,
        width: BOX_W,
        height: h - HEADER_H,
        fill: '#ffffff',
        stroke: '#1F3BB3',
        strokeWidth: 1.4,
      }),
    );
    group.add(new Konva.Line({ points: [0, HEADER_H, BOX_W, HEADER_H], stroke: '#1F3BB3', strokeWidth: 1.4 }));

    const services = app.services ?? [];
    if (services.length === 0) {
      group.add(
        new Konva.Text({
          x: PADDING,
          y: HEADER_H + PADDING,
          width: BOX_W - PADDING * 2,
          text: 'Aucun service',
          fontSize: 10,
          fontStyle: 'italic',
          fill: '#8991a8',
        }),
      );
    } else {
      services.forEach((service, i) => {
        group.add(
          new Konva.Text({
            x: PADDING,
            y: HEADER_H + PADDING + i * SERVICE_ROW_H,
            width: BOX_W - PADDING * 2,
            text: `• ${service.nom}`,
            fontSize: 10.5,
            fill: '#1a1a1a',
            wrap: 'none',
            ellipsis: true,
          }),
        );
      });
    }

    const anchorPositions = [
      { x: BOX_W / 2, y: 0 },
      { x: BOX_W, y: h / 2 },
      { x: BOX_W / 2, y: h },
      { x: 0, y: h / 2 },
    ];
    const anchors = anchorPositions.map((p) => {
      const circle = new Konva.Circle({
        x: p.x,
        y: p.y,
        radius: 6,
        fill: '#1F3BB3',
        stroke: '#ffffff',
        strokeWidth: 1.5,
        opacity: 0,
      });
      circle.on('mousedown', (e) => {
        e.cancelBubble = true;
        group.draggable(false);
        this.startLinking(app.id, { x: group.x() + p.x, y: group.y() + p.y });
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

    const deleteBtn = new Konva.Group({ x: BOX_W, y: 0, opacity: 0 });
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
      this.deleteApplication(app);
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
      this.positionsById.set(app.id, { x: group.x(), y: group.y(), w: BOX_W, h });
      this.redrawRelations();
    });
    group.on('dragend', () => {
      app.positionX = group.x();
      app.positionY = group.y();
      this.positionChange$.next({ id: app.id, x: group.x(), y: group.y() });
    });

    return group;
  }

  private savePosition(id: string, x: number, y: number): void {
    this.urbanisationService.updateApplication(id, { positionX: x, positionY: y }).subscribe({
      error: () => this.toast.error("Impossible d'enregistrer la position."),
    });
  }

  private buildRelation(echange: ApplicationEchange): Konva.Group | null {
    const from = this.positionsById.get(echange.sourceId);
    const to = this.positionsById.get(echange.targetId);
    if (!from || !to) return null;

    const start = this.borderPoint(from, to);
    const end = this.borderPoint(to, from);
    const group = new Konva.Group();
    group.add(
      new Konva.Arrow({
        points: [start.x, start.y, end.x, end.y],
        stroke: '#1F3BB3',
        fill: '#1F3BB3',
        strokeWidth: 1.4,
        pointerLength: 8,
        pointerWidth: 7,
      }),
    );
    const label = [echange.description, echange.protocole].filter(Boolean).join(' · ');
    if (label) {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      group.add(
        new Konva.Text({ x: midX - 45, y: midY - 8, width: 90, text: label, fontSize: 10, fill: '#455A64', align: 'center' }),
      );
    }
    return group;
  }

  private redrawRelations(): void {
    this.relationLayer.destroyChildren();
    for (const echange of this.echanges) {
      const g = this.buildRelation(echange);
      if (g) this.relationLayer.add(g);
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
    const line = new Konva.Line({
      points: [from.x, from.y, from.x, from.y],
      stroke: '#1F3BB3',
      strokeWidth: 2,
      dash: [4, 3],
      listening: false,
    });
    this.relationLayer.add(line);
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
      this.pendingEchange = { sourceId: fromId, targetId, description: '', protocole: '' };
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

  confirmEchange(event: Event): void {
    event.preventDefault();
    const pe = this.pendingEchange;
    if (!pe) return;
    this.urbanisationService
      .createEchange({
        sourceId: pe.sourceId,
        targetId: pe.targetId,
        description: pe.description || undefined,
        protocole: pe.protocole || undefined,
      })
      .subscribe({
        next: () => {
          this.pendingEchange = null;
          this.toast.success('Échange créé.');
          this.load();
          this.changed.emit();
        },
        error: () => this.toast.error("Impossible de créer cet échange."),
      });
  }

  cancelEchange(): void {
    this.pendingEchange = null;
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

  // ── Suppression ──────────────────────────────────────────────────────────

  async deleteApplication(app: Application): Promise<void> {
    const ok = await this.confirmDialog.confirm(`Supprimer l'application « ${app.nom} » ?`);
    if (!ok) return;

    this.urbanisationService.deleteApplication(app.id).subscribe({
      next: () => {
        this.applications = this.applications.filter((a) => a.id !== app.id);
        this.echanges = this.echanges.filter((e) => e.sourceId !== app.id && e.targetId !== app.id);
        this.nodesById.delete(app.id);
        this.positionsById.delete(app.id);
        this.render();
        this.toast.success('Application supprimée.');
        this.changed.emit();
      },
      error: () => this.toast.error('Impossible de supprimer cette application.'),
    });
  }
}
