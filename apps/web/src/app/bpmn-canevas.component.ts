import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Konva from 'konva';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { BpmnElement, BpmnFlow, BpmnService, DeclencheurEvenement, StatutElement, TypeBpmn, TypeTache } from './bpmn.service';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';

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

export const TYPE_BPMN_LABEL: Record<TypeBpmn, string> = {
  EVENEMENT_DEBUT: 'Événement de début',
  EVENEMENT_FIN: 'Événement de fin',
  EVENEMENT_INTERMEDIAIRE: 'Événement intermédiaire',
  TACHE: 'Tâche',
  SOUS_PROCESSUS: 'Sous-processus',
  PASSERELLE_EXCLUSIVE: 'Passerelle exclusive',
  PASSERELLE_PARALLELE: 'Passerelle parallèle',
  PASSERELLE_INCLUSIVE: 'Passerelle inclusive',
  PASSERELLE_EVENEMENTIELLE: 'Passerelle événementielle',
};

const TYPES: TypeBpmn[] = [
  'EVENEMENT_DEBUT',
  'TACHE',
  'SOUS_PROCESSUS',
  'PASSERELLE_EXCLUSIVE',
  'PASSERELLE_PARALLELE',
  'PASSERELLE_INCLUSIVE',
  'PASSERELLE_EVENEMENTIELLE',
  'EVENEMENT_INTERMEDIAIRE',
  'EVENEMENT_FIN',
];

/** Types événement — pour lesquels le formulaire propose un déclencheur. */
const EVENT_TYPES: TypeBpmn[] = ['EVENEMENT_DEBUT', 'EVENEMENT_FIN', 'EVENEMENT_INTERMEDIAIRE'];

export const DECLENCHEUR_LABEL: Record<DeclencheurEvenement, string> = {
  MESSAGE: 'Message',
  MINUTERIE: 'Minuterie',
  ERREUR: 'Erreur',
  SIGNAL: 'Signal',
  CONDITIONNEL: 'Conditionnel',
  TERMINAISON: 'Terminaison',
  ESCALADE: 'Escalade',
};
const DECLENCHEURS: DeclencheurEvenement[] = ['MESSAGE', 'MINUTERIE', 'ERREUR', 'SIGNAL', 'CONDITIONNEL', 'ESCALADE', 'TERMINAISON'];

export const TYPE_TACHE_LABEL: Record<TypeTache, string> = {
  UTILISATEUR: 'Utilisateur',
  SERVICE: 'Service',
  MANUELLE: 'Manuelle',
  ENVOI: 'Envoi',
  RECEPTION: 'Réception',
  REGLE_METIER: 'Règle métier',
  SCRIPT: 'Script',
};
const TYPE_TACHES: TypeTache[] = ['UTILISATEUR', 'SERVICE', 'MANUELLE', 'ENVOI', 'RECEPTION', 'REGLE_METIER', 'SCRIPT'];

/** Icônes de palette : même vocabulaire visuel (triangle de lancement, carré
 * d'arrêt, horloge, document, ×, +) que les glyphes dessinés sur le canevas
 * (buildIcon), pour une continuité entre palette et plan de travail. */
const PALETTE_ICON: Record<TypeBpmn, string> = {
  EVENEMENT_DEBUT:
    '<circle cx="12" cy="12" r="8" fill="none" stroke="#2E7D32" stroke-width="1.6"/><path d="M10,8.5 L16,12 L10,15.5 Z" fill="#2E7D32"/>',
  EVENEMENT_FIN:
    '<circle cx="12" cy="12" r="8" fill="none" stroke="#C62828" stroke-width="2.4"/><rect x="9.5" y="9.5" width="5" height="5" fill="#C62828"/>',
  EVENEMENT_INTERMEDIAIRE:
    '<circle cx="12" cy="12" r="8" fill="none" stroke="#E29E09" stroke-width="1.6"/><circle cx="12" cy="12" r="5.3" fill="none" stroke="#E29E09" stroke-width="1.1"/><path d="M12,9 L12,12 L14.2,13.3" fill="none" stroke="#E29E09" stroke-width="1.3" stroke-linecap="round"/>',
  TACHE:
    '<rect x="5" y="5" width="14" height="14" rx="2.5" fill="#1E283D"/><rect x="8" y="8.6" width="8" height="1.5" rx="0.7" fill="#ffffff"/><rect x="8" y="11.3" width="8" height="1.5" rx="0.7" fill="#ffffff"/><rect x="8" y="14" width="5" height="1.5" rx="0.7" fill="#ffffff"/>',
  SOUS_PROCESSUS:
    '<rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="#1E283D" stroke-width="1.5"/><rect x="9.5" y="11.5" width="5" height="5" fill="none" stroke="#1E283D" stroke-width="1.1"/><path d="M10.5,14 L13.5,14 M12,12.5 L12,15.5" stroke="#1E283D" stroke-width="1.1" stroke-linecap="round"/>',
  PASSERELLE_EXCLUSIVE:
    '<polygon points="12,4 20,12 12,20 4,12" fill="none" stroke="#6A1B9A" stroke-width="1.6"/><path d="M9.5,9.5 L14.5,14.5 M14.5,9.5 L9.5,14.5" stroke="#6A1B9A" stroke-width="1.6" stroke-linecap="round"/>',
  PASSERELLE_PARALLELE:
    '<polygon points="12,4 20,12 12,20 4,12" fill="none" stroke="#6A1B9A" stroke-width="1.6"/><path d="M12,8.5 L12,15.5 M8.5,12 L15.5,12" stroke="#6A1B9A" stroke-width="1.6" stroke-linecap="round"/>',
  PASSERELLE_INCLUSIVE:
    '<polygon points="12,4 20,12 12,20 4,12" fill="none" stroke="#6A1B9A" stroke-width="1.6"/><circle cx="12" cy="12" r="4" fill="none" stroke="#6A1B9A" stroke-width="1.6"/>',
  PASSERELLE_EVENEMENTIELLE:
    '<polygon points="12,4 20,12 12,20 4,12" fill="none" stroke="#6A1B9A" stroke-width="1.6"/><circle cx="12" cy="12" r="4.4" fill="none" stroke="#6A1B9A" stroke-width="1"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="#6A1B9A" stroke-width="1"/>',
};

const GAP_X = 40;
const ROW_Y = 60;

const STATUT_LABEL: Record<StatutElement, string> = {
  AS_IS: 'AS-IS (état actuel)',
  TO_BE: 'TO-BE (cible)',
  LES_DEUX: 'Les deux (inchangé)',
};
const STATUTS: StatutElement[] = ['LES_DEUX', 'AS_IS', 'TO_BE'];
const STATUT_BADGE_COLOR: Record<StatutElement, string | null> = {
  AS_IS: '#9AA1BA',
  TO_BE: '#1F3BB3',
  LES_DEUX: null,
};

interface PendingCreate {
  type: TypeBpmn;
  x: number;
  y: number;
  nom: string;
  statut: StatutElement;
  declencheur: DeclencheurEvenement | '';
  typeTache: TypeTache | '';
}

interface PendingEdit {
  id: string;
  type: TypeBpmn;
  nom: string;
  statut: StatutElement;
  declencheur: DeclencheurEvenement | '';
  typeTache: TypeTache | '';
}

interface PendingFlow {
  sourceId: string;
  targetId: string;
  label: string;
}

interface Pos {
  x: number;
  y: number;
  w: number;
  h: number;
}

@Component({
  selector: 'app-bpmn-canevas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p class="hint">
      Glissez une icône de la palette sur le plan pour ajouter une étape. Pour relier deux étapes : survolez une
      étape , 4 points apparaissent sur ses bords  puis glissez depuis l'un de ces points jusqu'à l'étape cible.
      Survolez une étape : cliquez sur le crayon pour la modifier (nom, AS-IS/TO-BE), ou sur le « × » rouge pour la
      supprimer.
    </p>
    <p class="hint legend">
      <span class="legend-dot" style="background:#9AA1BA"></span> AS-IS (état actuel)
      <span class="legend-dot" style="background:#1F3BB3"></span> TO-BE (cible)
      <span class="legend-dot legend-dot-outline"></span> Les deux (inchangé, sans repère)
    </p>

    <div class="bpmn-layout">
      <aside class="palette">
        <h4>Étapes BPMN</h4>
        <div class="item" *ngFor="let t of types" draggable="true" (dragstart)="onDragStart($event, t)">
          <span class="palette-icon" [innerHTML]="paletteIcon(t)"></span>
          {{ typeLabel(t) }}
        </div>
      </aside>

      <div class="stage-wrap">
        <div class="empty-state" *ngIf="!loading && elements.length === 0">
          Aucune étape pour l'instant — glissez une icône depuis la palette.
        </div>
        <div #stageHost class="stage-host" (dragover)="onDragOver($event)" (drop)="onDrop($event)"></div>
      </div>
    </div>

    <div class="pending-form" *ngIf="pendingCreate as p">
      <form class="card form-card" (submit)="confirmCreate($event)">
        <h3>Nouvelle étape — {{ typeLabel(p.type) }}</h3>
        <label class="field">
          Nom
          <input type="text" [value]="p.nom" (input)="p.nom = $any($event.target).value" required autofocus />
        </label>
        <label class="field" *ngIf="isEventType(p.type)">
          Déclencheur
          <select (change)="p.declencheur = $any($event.target).value">
            <option value="" [selected]="!p.declencheur">Générique</option>
            <option *ngFor="let d of declencheurs" [value]="d" [selected]="d === p.declencheur">{{ declencheurLabel(d) }}</option>
          </select>
        </label>
        <label class="field" *ngIf="p.type === 'TACHE'">
          Nature de la tâche
          <select (change)="p.typeTache = $any($event.target).value">
            <option value="" [selected]="!p.typeTache">Générique</option>
            <option *ngFor="let t of typeTaches" [value]="t" [selected]="t === p.typeTache">{{ typeTacheLabel(t) }}</option>
          </select>
        </label>
        <label class="field">
          Statut
          <select (change)="p.statut = $any($event.target).value">
            <option *ngFor="let s of statuts" [value]="s" [selected]="s === p.statut">{{ statutLabel(s) }}</option>
          </select>
        </label>
        <div class="pending-actions">
          <button type="button" class="btn btn-ghost" (click)="cancelCreate()">Annuler</button>
          <button type="submit" class="btn btn-primary">Créer</button>
        </div>
      </form>
    </div>

    <div class="pending-form" *ngIf="pendingEdit as pe">
      <form class="card form-card" (submit)="confirmEdit($event)">
        <h3>Modifier l'étape</h3>
        <label class="field">
          Nom
          <input type="text" [value]="pe.nom" (input)="pe.nom = $any($event.target).value" required autofocus />
        </label>
        <label class="field" *ngIf="isEventType(pe.type)">
          Déclencheur
          <select (change)="pe.declencheur = $any($event.target).value">
            <option value="" [selected]="!pe.declencheur">Générique</option>
            <option *ngFor="let d of declencheurs" [value]="d" [selected]="d === pe.declencheur">{{ declencheurLabel(d) }}</option>
          </select>
        </label>
        <label class="field" *ngIf="pe.type === 'TACHE'">
          Nature de la tâche
          <select (change)="pe.typeTache = $any($event.target).value">
            <option value="" [selected]="!pe.typeTache">Générique</option>
            <option *ngFor="let t of typeTaches" [value]="t" [selected]="t === pe.typeTache">{{ typeTacheLabel(t) }}</option>
          </select>
        </label>
        <label class="field">
          Statut
          <select (change)="pe.statut = $any($event.target).value">
            <option *ngFor="let s of statuts" [value]="s" [selected]="s === pe.statut">{{ statutLabel(s) }}</option>
          </select>
        </label>
        <div class="pending-actions">
          <button type="button" class="btn btn-ghost" (click)="cancelEdit()">Annuler</button>
          <button type="submit" class="btn btn-success">Enregistrer</button>
        </div>
      </form>
    </div>

    <div class="pending-form" *ngIf="pendingFlow as pf">
      <form class="card form-card" (submit)="confirmFlow($event)">
        <h3>Nouveau flux</h3>
        <p class="muted">{{ elementLabel(pf.sourceId) }} → {{ elementLabel(pf.targetId) }}</p>
        <label class="field">
          Libellé (facultatif)
          <input type="text" [value]="pf.label" (input)="pf.label = $any($event.target).value" />
        </label>
        <div class="pending-actions">
          <button type="button" class="btn btn-ghost" (click)="cancelFlow()">Annuler</button>
          <button type="submit" class="btn btn-primary">Créer</button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .hint { color: var(--color-text-muted); font-size: 0.85rem; margin: 0 0 1rem; }
      .legend { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; margin-top: -0.5rem; }
      .legend-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; margin-left: 0.5rem; }
      .legend-dot:first-child { margin-left: 0; }
      .legend-dot-outline { border: 1.5px dashed var(--color-border); }
      .bpmn-layout { display: flex; gap: 1.25rem; align-items: flex-start; }
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
      .pending-form .card { width: 320px; }
      .pending-actions { display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 0.5rem; }
    `,
  ],
})
export class BpmnCanevasComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) processusId!: string;
  @Output() changed = new EventEmitter<void>();

  @ViewChild('stageHost') stageHost!: ElementRef<HTMLDivElement>;

  types = TYPES;
  statuts = STATUTS;
  declencheurs = DECLENCHEURS;
  typeTaches = TYPE_TACHES;
  loading = true;
  elements: BpmnElement[] = [];
  flows: BpmnFlow[] = [];
  pendingCreate: PendingCreate | null = null;
  pendingEdit: PendingEdit | null = null;
  pendingFlow: PendingFlow | null = null;

  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private flowLayer!: Konva.Group;
  private boxLayer!: Konva.Group;
  private nodesById = new Map<string, Konva.Group>();
  private positionsById = new Map<string, Pos>();
  private linking: { fromId: string; line: Konva.Line } | null = null;
  private loadedProcessusId: string | null = null;
  private readonly positionChange$ = new Subject<{ id: string; x: number; y: number }>();
  private readonly resizeHandler = () => this.resizeStage();
  private readonly windowMouseUpHandler = () => this.cancelLinking();

  constructor(
    private readonly bpmnService: BpmnService,
    private readonly toast: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['processusId'] && this.stage && this.processusId !== this.loadedProcessusId) {
      this.load();
    }
  }

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

  typeLabel(type: TypeBpmn): string {
    return TYPE_BPMN_LABEL[type];
  }

  statutLabel(statut: StatutElement): string {
    return STATUT_LABEL[statut];
  }

  paletteIcon(type: TypeBpmn): string {
    return PALETTE_ICON[type];
  }

  declencheurLabel(declencheur: DeclencheurEvenement): string {
    return DECLENCHEUR_LABEL[declencheur];
  }

  typeTacheLabel(typeTache: TypeTache): string {
    return TYPE_TACHE_LABEL[typeTache];
  }

  isEventType(type: TypeBpmn): boolean {
    return EVENT_TYPES.includes(type);
  }

  elementLabel(id: string): string {
    return this.elements.find((e) => e.id === id)?.nom ?? '?';
  }

  // ── Chargement ───────────────────────────────────────────────────────────

  private load(): void {
    this.loading = true;
    this.loadedProcessusId = this.processusId;
    this.bpmnService.get(this.processusId).subscribe({
      next: (detail) => {
        this.elements = detail.elements;
        this.flows = detail.elements.flatMap((el) => el.flowsSource ?? []);
        this.loading = false;
        this.render();
      },
      error: () => {
        this.loading = false;
        this.toast.error('Impossible de charger ce processus.');
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

    this.flowLayer = new Konva.Group();
    this.boxLayer = new Konva.Group();
    this.layer.add(this.flowLayer);
    this.layer.add(this.boxLayer);

    for (const flow of this.flows) {
      const arrow = this.buildFlowArrow(flow);
      if (arrow) this.flowLayer.add(arrow);
    }

    for (const element of this.elements) {
      const group = this.buildBox(element, resolved.get(element.id)!);
      this.nodesById.set(element.id, group);
      this.boxLayer.add(group);
    }

    this.layer.draw();
  }

  private resolvePositions(elements: BpmnElement[]): Map<string, Pos> {
    const result = new Map<string, Pos>();
    let cursorX = 40;
    for (const element of elements) {
      const size = SHAPE_SIZE[element.type];
      if (element.positionX != null && element.positionY != null) {
        result.set(element.id, { x: element.positionX, y: element.positionY, ...size });
      } else {
        result.set(element.id, { x: cursorX, y: ROW_Y, ...size });
      }
      cursorX += size.w + GAP_X;
    }
    return result;
  }

  private buildIcon(element: BpmnElement, w: number, h: number): Konva.Group {
    const g = new Konva.Group({ listening: false });
    const cx = w / 2;
    const cy = h / 2;
    switch (element.type) {
      case 'EVENEMENT_DEBUT': {
        const r = Math.min(w, h) / 2 - 3;
        g.add(new Konva.Circle({ x: cx, y: cy, radius: r, stroke: '#2E7D32', strokeWidth: 1.6, fill: '#E8F5E9' }));
        this.drawEventGlyph(g, element.declencheur, cx, cy, '#2E7D32');
        break;
      }
      case 'EVENEMENT_FIN': {
        const r = Math.min(w, h) / 2 - 3;
        g.add(new Konva.Circle({ x: cx, y: cy, radius: r, stroke: '#C62828', strokeWidth: 2.6, fill: '#FDECEA' }));
        this.drawEventGlyph(g, element.declencheur, cx, cy, '#C62828');
        break;
      }
      case 'EVENEMENT_INTERMEDIAIRE': {
        const r = Math.min(w, h) / 2 - 3;
        g.add(new Konva.Circle({ x: cx, y: cy, radius: r, stroke: '#E29E09', strokeWidth: 1.4, fill: '#FEF6E6' }));
        g.add(new Konva.Circle({ x: cx, y: cy, radius: r - 4, stroke: '#E29E09', strokeWidth: 1.1 }));
        this.drawEventGlyph(g, element.declencheur, cx, cy, '#E29E09');
        break;
      }
      case 'TACHE': {
        g.add(new Konva.Rect({ x: 10, y: 10, width: 22, height: 22, cornerRadius: 4, fill: '#33415A' }));
        this.drawTaskGlyph(g, element.typeTache, 10, 10);
        break;
      }
      case 'PASSERELLE_EXCLUSIVE':
      case 'PASSERELLE_PARALLELE':
      case 'PASSERELLE_INCLUSIVE':
      case 'PASSERELLE_EVENEMENTIELLE':
        this.drawGatewaySymbol(g, element.type, cx, cy);
        break;
    }
    return g;
  }

  /** Symbole distinctif au centre du losange selon le type de passerelle — même vocabulaire que la génération SVG. */
  private drawGatewaySymbol(g: Konva.Group, type: TypeBpmn, cx: number, cy: number): void {
    switch (type) {
      case 'PASSERELLE_EXCLUSIVE':
        g.add(new Konva.Line({ points: [cx - 8, cy - 8, cx + 8, cy + 8], stroke: '#6A1B9A', strokeWidth: 2.2, lineCap: 'round' }));
        g.add(new Konva.Line({ points: [cx + 8, cy - 8, cx - 8, cy + 8], stroke: '#6A1B9A', strokeWidth: 2.2, lineCap: 'round' }));
        break;
      case 'PASSERELLE_PARALLELE':
        g.add(new Konva.Line({ points: [cx, cy - 9, cx, cy + 9], stroke: '#6A1B9A', strokeWidth: 2.2, lineCap: 'round' }));
        g.add(new Konva.Line({ points: [cx - 9, cy, cx + 9, cy], stroke: '#6A1B9A', strokeWidth: 2.2, lineCap: 'round' }));
        break;
      case 'PASSERELLE_INCLUSIVE':
        g.add(new Konva.Circle({ x: cx, y: cy, radius: 8, stroke: '#6A1B9A', strokeWidth: 2.2 }));
        break;
      case 'PASSERELLE_EVENEMENTIELLE':
        g.add(new Konva.Circle({ x: cx, y: cy, radius: 9, stroke: '#6A1B9A', strokeWidth: 1.3 }));
        g.add(new Konva.Circle({ x: cx, y: cy, radius: 5.5, stroke: '#6A1B9A', strokeWidth: 1.3 }));
        break;
    }
  }

  /** Glyphe interne d'un événement selon son déclencheur — absent = événement générique ("none"), aucun glyphe. */
  private drawEventGlyph(g: Konva.Group, declencheur: DeclencheurEvenement | null | undefined, cx: number, cy: number, color: string): void {
    if (!declencheur) return;
    switch (declencheur) {
      case 'MESSAGE':
        g.add(new Konva.Rect({ x: cx - 8, y: cy - 5.5, width: 16, height: 11, stroke: color, strokeWidth: 1.3 }));
        g.add(new Konva.Path({ data: `M${cx - 8},${cy - 5.5} L${cx},${cy + 1} L${cx + 8},${cy - 5.5}`, stroke: color, strokeWidth: 1.3 }));
        break;
      case 'MINUTERIE':
        g.add(new Konva.Circle({ x: cx, y: cy, radius: 9, stroke: color, strokeWidth: 1.2 }));
        g.add(new Konva.Path({ data: `M${cx},${cy - 6} L${cx},${cy} L${cx + 4},${cy + 2}`, stroke: color, strokeWidth: 1.2, lineCap: 'round' }));
        break;
      case 'ERREUR':
        g.add(
          new Konva.Path({
            data: `M${cx - 7},${cy + 7} L${cx - 1},${cy - 6} L${cx + 2},${cy} L${cx + 7},${cy - 7} L${cx + 1},${cy + 6} L${cx - 2},${cy} Z`,
            fill: color,
          }),
        );
        break;
      case 'SIGNAL':
        g.add(new Konva.Line({ points: [cx, cy - 8, cx + 8, cy + 7, cx - 8, cy + 7], closed: true, stroke: color, strokeWidth: 1.3 }));
        break;
      case 'CONDITIONNEL':
        g.add(new Konva.Rect({ x: cx - 7, y: cy - 8, width: 14, height: 16, stroke: color, strokeWidth: 1.1 }));
        g.add(
          new Konva.Path({
            data: `M${cx - 4},${cy - 4} L${cx + 4},${cy - 4} M${cx - 4},${cy} L${cx + 4},${cy} M${cx - 4},${cy + 4} L${cx + 4},${cy + 4}`,
            stroke: color,
            strokeWidth: 1,
          }),
        );
        break;
      case 'ESCALADE':
        g.add(
          new Konva.Line({
            points: [cx - 6, cy + 6, cx, cy - 6, cx + 6, cy + 6],
            stroke: color,
            strokeWidth: 1.5,
            lineCap: 'round',
            lineJoin: 'round',
          }),
        );
        break;
      case 'TERMINAISON':
        g.add(new Konva.Circle({ x: cx, y: cy, radius: 6, fill: color }));
        break;
    }
  }

  /** Icône dans le coin de la boîte tâche selon sa nature — sans typeTache, glyphe générique (document). */
  private drawTaskGlyph(g: Konva.Group, typeTache: TypeTache | null | undefined, x: number, y: number): void {
    const c = '#ffffff';
    switch (typeTache) {
      case 'UTILISATEUR':
        g.add(new Konva.Circle({ x: x + 11, y: y + 6, radius: 4, stroke: c, strokeWidth: 1.3 }));
        g.add(new Konva.Path({ data: `M${x + 4},${y + 20} Q${x + 11},${y + 12} ${x + 18},${y + 20}`, stroke: c, strokeWidth: 1.3 }));
        break;
      case 'SERVICE':
        g.add(new Konva.Circle({ x: x + 11, y: y + 11, radius: 6, stroke: c, strokeWidth: 1.3 }));
        g.add(
          new Konva.Path({
            data: `M${x + 11},${y + 2} L${x + 11},${y + 5} M${x + 11},${y + 17} L${x + 11},${y + 20} M${x + 2},${y + 11} L${x + 5},${y + 11} M${x + 17},${y + 11} L${x + 20},${y + 11}`,
            stroke: c,
            strokeWidth: 1.3,
            lineCap: 'round',
          }),
        );
        break;
      case 'MANUELLE':
        g.add(
          new Konva.Path({
            data: `M${x + 3},${y + 18} L${x + 3},${y + 10} Q${x + 3},${y + 7} ${x + 6},${y + 7} L${x + 16},${y + 7} Q${x + 19},${y + 7} ${x + 19},${y + 10} L${x + 19},${y + 18}`,
            stroke: c,
            strokeWidth: 1.3,
          }),
        );
        break;
      case 'ENVOI':
        g.add(new Konva.Line({ points: [x + 2, y + 5, x + 20, y + 5, x + 20, y + 17, x + 2, y + 17], closed: true, fill: c }));
        g.add(new Konva.Path({ data: `M${x + 2},${y + 5} L${x + 11},${y + 12} L${x + 20},${y + 5}`, stroke: '#1E283D', strokeWidth: 1.2 }));
        break;
      case 'RECEPTION':
        g.add(new Konva.Rect({ x: x + 2, y: y + 5, width: 18, height: 12, stroke: c, strokeWidth: 1.3 }));
        g.add(new Konva.Path({ data: `M${x + 2},${y + 5} L${x + 11},${y + 12} L${x + 20},${y + 5}`, stroke: c, strokeWidth: 1.3 }));
        break;
      case 'REGLE_METIER':
        g.add(new Konva.Rect({ x: x + 2, y: y + 3, width: 18, height: 16, stroke: c, strokeWidth: 1.2 }));
        g.add(
          new Konva.Path({
            data: `M${x + 2},${y + 9} L${x + 20},${y + 9} M${x + 9},${y + 3} L${x + 9},${y + 19}`,
            stroke: c,
            strokeWidth: 1,
          }),
        );
        break;
      case 'SCRIPT':
        g.add(
          new Konva.Path({
            data: `M${x + 8},${y + 4} L${x + 3},${y + 11} L${x + 8},${y + 18} M${x + 14},${y + 4} L${x + 19},${y + 11} L${x + 14},${y + 18}`,
            stroke: c,
            strokeWidth: 1.3,
            lineCap: 'round',
            lineJoin: 'round',
          }),
        );
        break;
      default:
        [0, 1, 2].forEach((i) =>
          g.add(
            new Konva.Rect({
              x: x + 4,
              y: y + 6 + i * 5,
              width: i === 2 ? 9 : 14,
              height: 1.6,
              fill: c,
            }),
          ),
        );
        break;
    }
  }

  private buildBox(element: BpmnElement, pos: Pos): Konva.Group {
    const size = SHAPE_SIZE[element.type];
    const group = new Konva.Group({ x: pos.x, y: pos.y, draggable: true });
    group.setAttr('nodeKey', element.id);

    if (element.type === 'TACHE') {
      group.add(new Konva.Rect({ width: size.w, height: size.h, fill: '#1E283D', cornerRadius: 10 }));
      group.add(this.buildIcon(element, size.w, size.h));
      group.add(
        new Konva.Text({
          x: 40,
          y: 0,
          width: size.w - 48,
          height: size.h,
          text: element.nom,
          fontSize: 12,
          fontStyle: 'bold',
          fill: '#ffffff',
          align: 'left',
          verticalAlign: 'middle',
          wrap: 'word',
        }),
      );
    } else if (element.type === 'SOUS_PROCESSUS') {
      group.add(new Konva.Rect({ width: size.w, height: size.h, fill: '#ffffff', stroke: '#1E283D', strokeWidth: 1.8, cornerRadius: 8 }));
      group.add(
        new Konva.Text({
          x: 8,
          y: 0,
          width: size.w - 16,
          height: size.h - 20,
          text: element.nom,
          fontSize: 12,
          fontStyle: 'bold',
          fill: '#1a1a1a',
          align: 'center',
          verticalAlign: 'middle',
          wrap: 'word',
        }),
      );
      const markerCx = size.w / 2;
      const markerY = size.h - 12;
      group.add(new Konva.Rect({ x: markerCx - 7, y: markerY - 7, width: 14, height: 14, stroke: '#1E283D', strokeWidth: 1.4 }));
      group.add(
        new Konva.Path({
          data: `M${markerCx - 4},${markerY} L${markerCx + 4},${markerY} M${markerCx},${markerY - 4} L${markerCx},${markerY + 4}`,
          stroke: '#1E283D',
          strokeWidth: 1.4,
          lineCap: 'round',
        }),
      );
    } else if (element.type.startsWith('PASSERELLE')) {
      group.add(
        new Konva.RegularPolygon({
          x: size.w / 2,
          y: size.h / 2,
          sides: 4,
          radius: size.w / 2 - 2,
          rotation: 45,
          fill: '#F3E9FB',
          stroke: '#6A1B9A',
          strokeWidth: 1.6,
        }),
      );
      group.add(this.buildIcon(element, size.w, size.h));
      group.add(
        new Konva.Text({
          x: -42,
          y: size.h + 4,
          width: size.w + 84,
          text: element.nom,
          fontSize: 11,
          fill: '#1a1a1a',
          align: 'center',
          wrap: 'word',
        }),
      );
    } else {
      group.add(this.buildIcon(element, size.w, size.h));
      group.add(
        new Konva.Text({
          x: -50,
          y: size.h + 4,
          width: size.w + 100,
          text: element.nom,
          fontSize: 11,
          fill: '#1a1a1a',
          align: 'center',
          wrap: 'word',
        }),
      );
    }

    const badgeColor = STATUT_BADGE_COLOR[element.statut];
    if (badgeColor) {
      group.add(new Konva.Circle({ x: 0, y: 0, radius: 5, fill: badgeColor, stroke: '#ffffff', strokeWidth: 1, listening: false }));
    }

    const anchorPositions = [
      { x: size.w / 2, y: 0 },
      { x: size.w, y: size.h / 2 },
      { x: size.w / 2, y: size.h },
      { x: 0, y: size.h / 2 },
    ];
    const anchors = anchorPositions.map((p) => {
      const circle = new Konva.Circle({
        x: p.x,
        y: p.y,
        radius: 6,
        fill: '#455A64',
        stroke: '#ffffff',
        strokeWidth: 1.5,
        opacity: 0,
      });
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

    const editBtn = new Konva.Group({ x: size.w - 20, y: 0, opacity: 0 });
    editBtn.add(new Konva.Circle({ radius: 8, fill: '#E29E09', stroke: '#ffffff', strokeWidth: 1 }));
    editBtn.add(
      new Konva.Text({
        text: '✎',
        fontSize: 10,
        fill: '#ffffff',
        width: 16,
        height: 16,
        offsetX: 8,
        offsetY: 8,
        align: 'center',
        verticalAlign: 'middle',
        listening: false,
      }),
    );
    editBtn.on('mousedown', (e) => {
      e.cancelBubble = true;
    });
    editBtn.on('click', (e) => {
      e.cancelBubble = true;
      this.openEditElement(element);
    });
    editBtn.on('mouseenter', () => {
      document.body.style.cursor = 'pointer';
    });
    editBtn.on('mouseleave', () => {
      document.body.style.cursor = 'grab';
    });
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
      this.redrawFlows();
    });
    group.on('dragend', () => {
      element.positionX = group.x();
      element.positionY = group.y();
      this.positionChange$.next({ id: element.id, x: group.x(), y: group.y() });
    });

    return group;
  }

  private savePosition(id: string, x: number, y: number): void {
    this.bpmnService.updateElement(id, { positionX: x, positionY: y }).subscribe({
      error: () => this.toast.error("Impossible d'enregistrer la position."),
    });
  }

  private buildFlowArrow(flow: BpmnFlow): Konva.Group | null {
    const from = this.positionsById.get(flow.sourceId);
    const to = this.positionsById.get(flow.targetId);
    if (!from || !to) return null;

    const start = this.borderPoint(from, to);
    const end = this.borderPoint(to, from);
    const group = new Konva.Group();
    group.add(
      new Konva.Arrow({
        points: [start.x, start.y, end.x, end.y],
        stroke: '#607D8B',
        fill: '#607D8B',
        strokeWidth: 1.5,
        pointerLength: 8,
        pointerWidth: 8,
      }),
    );
    if (flow.label) {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      group.add(
        new Konva.Text({
          x: midX - 40,
          y: midY - 14,
          width: 80,
          text: flow.label,
          fontSize: 10,
          fill: '#455A64',
          align: 'center',
        }),
      );
    }
    return group;
  }

  private redrawFlows(): void {
    this.flowLayer.destroyChildren();
    for (const flow of this.flows) {
      const arrow = this.buildFlowArrow(flow);
      if (arrow) this.flowLayer.add(arrow);
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
      stroke: '#2E7D32',
      strokeWidth: 2,
      dash: [4, 3],
      listening: false,
    });
    this.flowLayer.add(line);
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
      this.pendingFlow = { sourceId: fromId, targetId, label: '' };
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

  confirmFlow(event: Event): void {
    event.preventDefault();
    const pf = this.pendingFlow;
    if (!pf) return;
    this.bpmnService.addFlow(this.processusId, { sourceId: pf.sourceId, targetId: pf.targetId, label: pf.label || undefined }).subscribe({
      next: () => {
        this.pendingFlow = null;
        this.toast.success('Flux créé.');
        this.load();
        this.changed.emit();
      },
      error: () => this.toast.error('Impossible de créer ce flux.'),
    });
  }

  cancelFlow(): void {
    this.pendingFlow = null;
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

  onDragStart(event: DragEvent, type: TypeBpmn): void {
    event.dataTransfer?.setData('application/x-archivision-type-bpmn', type);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const type = event.dataTransfer?.getData('application/x-archivision-type-bpmn') as TypeBpmn | undefined;
    if (!type) return;

    const size = SHAPE_SIZE[type];
    const rect = this.stageHost.nativeElement.getBoundingClientRect();
    const scale = this.stage.scaleX();
    const x = (event.clientX - rect.left - this.stage.x()) / scale - size.w / 2;
    const y = (event.clientY - rect.top - this.stage.y()) / scale - size.h / 2;

    this.pendingCreate = { type, x, y, nom: '', statut: 'LES_DEUX', declencheur: '', typeTache: '' };
  }

  cancelCreate(): void {
    this.pendingCreate = null;
  }

  confirmCreate(event: Event): void {
    event.preventDefault();
    const p = this.pendingCreate;
    if (!p || !p.nom.trim()) return;
    const nom = p.nom.trim();

    this.bpmnService
      .addElement(this.processusId, {
        nom,
        type: p.type,
        statut: p.statut,
        declencheur: p.declencheur || undefined,
        typeTache: p.typeTache || undefined,
      })
      .subscribe({
        next: (created) => {
          this.bpmnService.updateElement(created.id, { positionX: p.x, positionY: p.y }).subscribe();
          this.elements = [...this.elements, { ...created, positionX: p.x, positionY: p.y }];
          this.pendingCreate = null;
          this.render();
          this.toast.success('Étape ajoutée.');
          this.changed.emit();
        },
        error: () => this.toast.error("Impossible d'ajouter cette étape."),
      });
  }

  // ── Modification ─────────────────────────────────────────────────────────

  openEditElement(element: BpmnElement): void {
    this.pendingEdit = {
      id: element.id,
      type: element.type,
      nom: element.nom,
      statut: element.statut,
      declencheur: element.declencheur ?? '',
      typeTache: element.typeTache ?? '',
    };
  }

  cancelEdit(): void {
    this.pendingEdit = null;
  }

  confirmEdit(event: Event): void {
    event.preventDefault();
    const pe = this.pendingEdit;
    if (!pe || !pe.nom.trim()) return;
    const nom = pe.nom.trim();

    this.bpmnService
      .updateElement(pe.id, { nom, statut: pe.statut, declencheur: pe.declencheur || undefined, typeTache: pe.typeTache || undefined })
      .subscribe({
        next: (updated) => {
          this.elements = this.elements.map((e) => (e.id === updated.id ? { ...e, ...updated } : e));
          this.pendingEdit = null;
          this.render();
          this.toast.success('Étape modifiée.');
          this.changed.emit();
        },
        error: () => this.toast.error("Impossible de modifier cette étape."),
      });
  }

  // ── Suppression ──────────────────────────────────────────────────────────

  async deleteElement(element: BpmnElement): Promise<void> {
    const ok = await this.confirmDialog.confirm(`Supprimer « ${element.nom} » ? Les flux qui lui sont rattachés seront aussi supprimés.`);
    if (!ok) return;

    this.bpmnService.deleteElement(element.id).subscribe({
      next: () => {
        this.elements = this.elements.filter((e) => e.id !== element.id);
        this.flows = this.flows.filter((f) => f.sourceId !== element.id && f.targetId !== element.id);
        this.nodesById.delete(element.id);
        this.positionsById.delete(element.id);
        this.render();
        this.toast.success('Étape supprimée.');
        this.changed.emit();
      },
      error: () => this.toast.error("Impossible de supprimer cette étape."),
    });
  }
}
