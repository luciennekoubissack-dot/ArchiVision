import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import Konva from 'konva';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { TechComponent, TechnologieService, TypeTechComponent } from './technologie.service';
import { CanevasRelation, CanevasService } from '../canevas/canevas.service';
import { ToastService } from '../shared/toast.service';
import { ConfirmDialogService } from '../shared/confirm-dialog.service';
import { downloadDataUrl } from '../shared/download.util';
import { DownloadMenuComponent, DownloadFormatOption } from '../shared/download-menu.component';

// ─── Constantes de rendu ────────────────────────────────────────────────────

// CONNEXION_INTERNET_FIBRE est exclue de la palette : les connexions réseau
// se créent en glissant depuis un point d'ancrage (chemin de communication UML).
const TYPES: TypeTechComponent[] = [
  'SERVEUR', 'ORDINATEUR_PORTABLE', 'ROUTEUR_RESEAU', 'CAPTEUR_IOT_CONSOMMATION',
  'SMARTPHONE_PROFESSIONNEL', 'STOCKAGE_NAS', 'BASE_DE_DONNEES_POSTGRESQL',
  'SERVEUR_APPLICATIONS', 'API_REST', 'LOGICIEL_CYBERSECURITE', 'SYSTEME_EXPLOITATION_LINUX',
  'PLATEFORME_CLOUD', 'PARE_FEU', 'SWITCH', 'VPN', 'AUTRE',
];
const PNG_FORMAT: DownloadFormatOption[] = [{ value: 'png', label: 'PNG' }];

// Nœud UML (boîte 3D)
const NODE_W = 150;
const NODE_H = 64;
const DEPTH = 14;
const HEADER_H = 26;

// Artefact déployé
const COMP_W = 140;
const COMP_H = 30;
const COMP_GAP_Y = 20;
const NODE_TO_COMP_GAP = 55;

// Points d'ancrage (sortie de liaison)
const ANCHOR_R = 6;

// Grille automatique
const GAP_X = 40;
const ROW_Y = 60;
const UNIT_W = NODE_W + DEPTH + NODE_TO_COMP_GAP + COMP_W + GAP_X;

// ─── Tables de métadonnées ─────────────────────────────────────────────────

const TYPE_LABEL: Record<TypeTechComponent, string> = {
  SERVEUR: 'Serveur', RESEAU: 'Réseau', CLOUD: 'Cloud', BASE_DE_DONNEES: 'Base de données',
  MIDDLEWARE: 'Middleware', ORDINATEUR_PORTABLE: 'Ordinateur portable',
  ROUTEUR_RESEAU: 'Routeur réseau', CAPTEUR_IOT_CONSOMMATION: 'Capteur IoT',
  SMARTPHONE_PROFESSIONNEL: 'Smartphone pro', STOCKAGE_NAS: 'NAS',
  BASE_DE_DONNEES_POSTGRESQL: 'PostgreSQL', SERVEUR_APPLICATIONS: "Srv. applicatif",
  API_REST: 'API REST', LOGICIEL_CYBERSECURITE: 'Cybersécurité',
  SYSTEME_EXPLOITATION_LINUX: 'Linux', PLATEFORME_CLOUD: 'Plateforme Cloud',
  PARE_FEU: 'Pare-feu', SWITCH: 'Switch', VPN: 'VPN',
  CONNEXION_INTERNET_FIBRE: 'Fibre', AUTRE: 'Autre',
};

/** «device» pour le matériel physique, «executionEnvironment» pour un environnement logiciel. */
const TYPE_STEREOTYPE: Record<TypeTechComponent, string> = {
  SERVEUR: '«device»', RESEAU: '«device»', CLOUD: '«executionEnvironment»',
  BASE_DE_DONNEES: '«executionEnvironment»', MIDDLEWARE: '«executionEnvironment»',
  ORDINATEUR_PORTABLE: '«device»', ROUTEUR_RESEAU: '«device»',
  CAPTEUR_IOT_CONSOMMATION: '«device»', SMARTPHONE_PROFESSIONNEL: '«device»',
  STOCKAGE_NAS: '«device»', BASE_DE_DONNEES_POSTGRESQL: '«executionEnvironment»',
  SERVEUR_APPLICATIONS: '«executionEnvironment»', API_REST: '«executionEnvironment»',
  LOGICIEL_CYBERSECURITE: '«executionEnvironment»', SYSTEME_EXPLOITATION_LINUX: '«executionEnvironment»',
  PLATEFORME_CLOUD: '«executionEnvironment»', PARE_FEU: '«device»', SWITCH: '«device»',
  VPN: '«executionEnvironment»', CONNEXION_INTERNET_FIBRE: '«device»', AUTRE: '«node»',
};

const TYPE_COLOR: Record<TypeTechComponent, string> = {
  SERVEUR: '#1F3BB3', RESEAU: '#0F766E', CLOUD: '#7C3AED', BASE_DE_DONNEES: '#B45309',
  MIDDLEWARE: '#BE185D', ORDINATEUR_PORTABLE: '#2563EB', ROUTEUR_RESEAU: '#0F766E',
  CAPTEUR_IOT_CONSOMMATION: '#0891B2', SMARTPHONE_PROFESSIONNEL: '#2563EB', STOCKAGE_NAS: '#475569',
  BASE_DE_DONNEES_POSTGRESQL: '#B45309', SERVEUR_APPLICATIONS: '#BE185D', API_REST: '#BE185D',
  LOGICIEL_CYBERSECURITE: '#B91C1C', SYSTEME_EXPLOITATION_LINUX: '#475569', PLATEFORME_CLOUD: '#7C3AED',
  PARE_FEU: '#B91C1C', SWITCH: '#0F766E', VPN: '#7C3AED', CONNEXION_INTERNET_FIBRE: '#0F766E', AUTRE: '#64748B',
};

const TYPE_FILL: Record<TypeTechComponent, string> = {
  SERVEUR: '#DCE4FA', RESEAU: '#D6F0EC', CLOUD: '#E9E1FB', BASE_DE_DONNEES: '#FBE9D6',
  MIDDLEWARE: '#FBDCEA', ORDINATEUR_PORTABLE: '#DBEAFE', ROUTEUR_RESEAU: '#D6F0EC',
  CAPTEUR_IOT_CONSOMMATION: '#CFFAFE', SMARTPHONE_PROFESSIONNEL: '#DBEAFE', STOCKAGE_NAS: '#E2E8F0',
  BASE_DE_DONNEES_POSTGRESQL: '#FBE9D6', SERVEUR_APPLICATIONS: '#FBDCEA', API_REST: '#FBDCEA',
  LOGICIEL_CYBERSECURITE: '#FEE2E2', SYSTEME_EXPLOITATION_LINUX: '#E2E8F0', PLATEFORME_CLOUD: '#E9E1FB',
  PARE_FEU: '#FEE2E2', SWITCH: '#D6F0EC', VPN: '#E9E1FB', CONNEXION_INTERNET_FIBRE: '#D6F0EC', AUTRE: '#E2E8F0',
};

// ─── Interfaces locales ─────────────────────────────────────────────────────

interface Pos { x: number; y: number; }

interface PendingCreate {
  type: TypeTechComponent;
  x: number; y: number;
  nom: string;
  description: string;
}

interface PendingEdit {
  nom: string;
  description: string;
}

/** Types de lien de communication réseau UML (chemins de communication). */
export type TypeLienCommunication =
  | 'TCP_IP'
  | 'HTTPS'
  | 'VPN'
  | 'FIBRE'
  | 'WIFI'
  | 'ETHERNET'
  | 'AUTRE';

const LIEN_LABEL: Record<TypeLienCommunication, string> = {
  TCP_IP:   '«TCP/IP»',
  HTTPS:    '«HTTPS sécurisé»',
  VPN:      '«Canal VPN»',
  FIBRE:    '«Fibre optique»',
  WIFI:     '«Wi-Fi»',
  ETHERNET: '«Ethernet»',
  AUTRE:    '«Lien réseau»',
};

/** Couleur du trait selon le type de lien. */
const LIEN_COLOR: Record<TypeLienCommunication, string> = {
  TCP_IP:   '#334155',  // gris ardoise neutre
  HTTPS:    '#15803d',  // vert (sécurisé)
  VPN:      '#7c3aed',  // violet (chiffré)
  FIBRE:    '#0891b2',  // bleu cyan (haut débit)
  WIFI:     '#d97706',  // ambre (sans fil)
  ETHERNET: '#1e40af',  // bleu profond (filaire)
  AUTRE:    '#64748b',  // gris
};

/** Style de tiret selon le type de lien (undefined = trait plein). */
const LIEN_DASH: Record<TypeLienCommunication, number[] | undefined> = {
  TCP_IP:   undefined,
  HTTPS:    undefined,
  VPN:      [8, 4],
  FIBRE:    undefined,
  WIFI:     [4, 3],
  ETHERNET: undefined,
  AUTRE:    [6, 4],
};

const LIENS_DISPONIBLES: TypeLienCommunication[] = [
  'TCP_IP', 'HTTPS', 'VPN', 'FIBRE', 'WIFI', 'ETHERNET', 'AUTRE',
];

/** État en attente lors de la création d'un lien (après relâchement souris, avant confirmation). */
interface PendingLien {
  fromId: string;
  toId: string;
  typeLien: TypeLienCommunication;
}

/** Modale de confirmation avant de supprimer une relation clic droit. */
interface PendingRelationDelete {
  relation: CanevasRelation;
}

// ─── Composant ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-technologie-canevas',
  standalone: true,
  imports: [CommonModule, DownloadMenuComponent],
  template: `
    <div class="page-header">
      <p class="hint">
        Glissez un composant depuis la palette pour l'ajouter.
        Survolez un nœud — quatre points d'ancrage apparaissent.
        Glissez depuis un point vers un autre nœud pour créer un chemin de communication UML.
        Clic droit sur un lien existant pour le supprimer.
      </p>
      <div class="header-actions">
        <button
          type="button"
          class="btn btn-outline"
          [disabled]="layingOut || components.length === 0"
          (click)="regenererDisposition()"
        >
          {{ layingOut ? 'Génération…' : 'Réorganiser le diagramme' }}
        </button>
        <button type="button" class="btn btn-outline" [disabled]="!selectedComponent || layingOut" (click)="openEdit()">
          Modifier
        </button>
        <button type="button" class="btn btn-danger" [disabled]="!selectedComponent || layingOut" (click)="removeSelected()">
          Supprimer
        </button>
        <app-download-menu [formats]="pngFormat" [disabled]="components.length === 0" (download)="exportPng()" />
      </div>
    </div>

    <div class="tech-layout">
      <!-- Palette de composants -->
      <aside class="palette">
        <h4>Composants</h4>
        <div class="item" *ngFor="let t of types" draggable="true" (dragstart)="onDragStart($event, t)">
          <span class="palette-swatch" [style.background]="typeColor(t)"></span>
          {{ typeLabel(t) }}
        </div>
      </aside>

      <!-- Zone de dessin -->
      <div class="stage-wrap">
        <div class="empty-state" *ngIf="!loading && components.length === 0">
          Aucun composant technique pour l'instant — glissez une icône depuis la palette.
        </div>
        <div #stageHost class="stage-host" (dragover)="onDragOver($event)" (drop)="onDrop($event)"></div>
      </div>
    </div>

    <!-- ── Modale : création d'un nœud ──────────────────────────────────── -->
    <div class="pending-form" *ngIf="pendingCreate as p">
      <form class="card form-card" (submit)="confirmCreate($event)">
        <h3>Nouveau composant — {{ typeLabel(p.type) }}</h3>
        <label class="field">
          Nom
          <input type="text" [value]="p.nom" (input)="p.nom = $any($event.target).value" required autofocus />
        </label>
        <label class="field">
          Description
          <textarea
            placeholder="Rôle du composant et justification du choix technologique."
            [value]="p.description"
            (input)="p.description = $any($event.target).value"
          ></textarea>
        </label>
        <div class="pending-actions">
          <button type="button" class="btn btn-ghost" (click)="cancelCreate()">Annuler</button>
          <button type="submit" class="btn btn-primary">Créer</button>
        </div>
      </form>
    </div>

    <!-- ── Modale : modification d'un nœud ──────────────────────────────── -->
    <div class="pending-form" *ngIf="pendingEdit as draft">
      <form class="card form-card" (submit)="confirmEdit($event)">
        <h3>Modifier le composant</h3>
        <label class="field">
          Nom
          <input type="text" [value]="draft.nom" (input)="draft.nom = $any($event.target).value" required autofocus />
        </label>
        <label class="field">
          Description
          <textarea [value]="draft.description" (input)="draft.description = $any($event.target).value"></textarea>
        </label>
        <div class="pending-actions">
          <button type="button" class="btn btn-ghost" (click)="pendingEdit = null">Annuler</button>
          <button type="submit" class="btn btn-primary">Enregistrer</button>
        </div>
      </form>
    </div>

    <!-- ── Modale : supprimer un chemin de communication ───────────────── -->
    <div class="pending-form" *ngIf="pendingRelationDelete as pd">
      <div class="card form-card">
        <h3>Supprimer ce chemin de communication ?</h3>
        <p class="hint">Cette action est irréversible.</p>
        <div class="pending-actions">
          <button type="button" class="btn btn-ghost" (click)="pendingRelationDelete = null">Annuler</button>
          <button type="button" class="btn btn-danger" (click)="confirmDeleteRelation(pd)">Supprimer</button>
        </div>
      </div>
    </div>

    <!-- ── Modale : type du lien de communication ───────────────────────── -->
    <div class="pending-form" *ngIf="pendingLien as pl">
      <form class="card form-card" (submit)="confirmLien($event)">
        <h3>Nouveau chemin de communication</h3>
        <p class="lien-hint">
          <strong>{{ nodeNom(pl.fromId) }}</strong>
          &nbsp;&#8594;&nbsp;
          <strong>{{ nodeNom(pl.toId) }}</strong>
        </p>
        <label class="field">
          Type de lien réseau
          <select [value]="pl.typeLien" (change)="pl.typeLien = $any($event.target).value">
            <option *ngFor="let t of liensDisponibles" [value]="t">{{ lienLabel(t) }}</option>
          </select>
        </label>
        <div class="lien-preview-wrap">
          <svg width="120" height="16" xmlns="http://www.w3.org/2000/svg">
            <line x1="4" y1="8" x2="116" y2="8"
              [attr.stroke]="lienColorFor(pl.typeLien)"
              stroke-width="2"
              [attr.stroke-dasharray]="lienDashFor(pl.typeLien)" />
          </svg>
          <span class="lien-preview-label" [style.color]="lienColorFor(pl.typeLien)">
            {{ lienLabel(pl.typeLien) }}
          </span>
        </div>
        <div class="pending-actions">
          <button type="button" class="btn btn-ghost" (click)="cancelLien()">Annuler</button>
          <button type="submit" class="btn btn-primary">Créer le lien</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .hint { color: var(--color-text-muted); font-size: 0.85rem; margin: 0; max-width: 680px; }
    .header-actions { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }
    .tech-layout { display: flex; gap: 1.25rem; align-items: flex-start; }
    .palette {
      width: 210px; flex-shrink: 0; background: var(--color-white);
      border-radius: var(--radius-lg); border: 1px solid var(--color-border); padding: 1.1rem;
    }
    .palette h4 { margin: 0 0 0.75rem; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-text-muted); }
    .palette .item {
      display: flex; align-items: center; gap: 0.55rem;
      padding: 0.5rem 0.55rem; border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); margin-bottom: 0.4rem;
      cursor: grab; font-size: 0.86rem; background: var(--color-surface); user-select: none;
    }
    .palette .item:active { cursor: grabbing; }
    .palette-swatch { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; }
    .stage-wrap {
      position: relative; flex: 1; min-width: 0; background: var(--color-white);
      border-radius: var(--radius-lg); border: 1px solid var(--color-border); overflow: hidden;
    }
    .stage-host { width: 100%; height: 62vh; min-height: 400px; cursor: grab; }
    .stage-wrap .empty-state {
      position: absolute; inset: 0; display: flex; align-items: center;
      justify-content: center; pointer-events: none; color: var(--color-text-muted);
      text-align: center; padding: 2rem;
    }
    .pending-form {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.25);
      display: flex; align-items: center; justify-content: center; z-index: 50;
    }
    .pending-form .card { width: 340px; }
    .pending-actions { display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 0.5rem; }
    .lien-hint { font-size: 0.88rem; margin: 0 0 0.75rem; color: var(--color-text); font-weight: 500; }
    .lien-preview-wrap {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.6rem 0.75rem; margin-bottom: 0.75rem;
      border: 1px solid var(--color-border); border-radius: 8px;
      background: var(--color-surface);
    }
    .lien-preview-label { font-size: 0.82rem; font-style: italic; font-weight: 600; }
  `],
})
export class TechnologieCanevasComponent implements AfterViewInit, OnDestroy {
  @Output() changed = new EventEmitter<void>();
  @ViewChild('stageHost') stageHost!: ElementRef<HTMLDivElement>;

  types = TYPES;
  pngFormat = PNG_FORMAT;
  loading = true;
  layingOut = false;

  components: TechComponent[] = [];
  relations: CanevasRelation[] = [];

  selectedComponent: TechComponent | null = null;
  pendingCreate: PendingCreate | null = null;
  pendingEdit: PendingEdit | null = null;
  pendingRelationDelete: PendingRelationDelete | null = null;
  pendingLien: PendingLien | null = null;

  /** Accesseurs template pour les types de lien. */
  liensDisponibles = LIENS_DISPONIBLES;
  lienLabel(t: TypeLienCommunication): string { return LIEN_LABEL[t]; }
  lienColorFor(t: TypeLienCommunication): string { return LIEN_COLOR[t]; }
  /** Retourne la valeur SVG stroke-dasharray pour l'aperçu (chaîne vide = trait plein). */
  lienDashFor(t: TypeLienCommunication): string {
    const dash = LIEN_DASH[t];
    return dash ? dash.join(' ') : '';
  }

  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private relLayer!: Konva.Layer;   // couche dédiée aux chemins de communication
  private nodeGroups = new Map<string, Konva.Group>();  // id → groupe Konva du nœud
  private nodePositions = new Map<string, Pos>();       // id → position courante

  /** Liaison en cours (depuis un point d'ancrage) */
  private linking: { fromId: string; line: Konva.Line } | null = null;

  private readonly positionChange$ = new Subject<{ id: string; x: number; y: number }>();
  private readonly resizeHandler = () => this.resizeStage();
  private readonly globalMouseUp = () => this.cancelLinking();
  private resizeObserver?: ResizeObserver;

  constructor(
    private readonly technologieService: TechnologieService,
    private readonly canevasService: CanevasService,
    private readonly toast: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
  ) {}

  // ── Cycle de vie ─────────────────────────────────────────────────────────

  ngAfterViewInit(): void {
    // Laisser Angular terminer le layout DOM avant d'initialiser Konva :
    // l'hôte peut avoir clientWidth=0 si le composant est rendu dans un *ngIf
    // qui vient de passer à true (l'onglet "Diagramme" n'est pas encore peint).
    // Sans ce délai, Konva crée un <canvas> de taille 0 et chaque dessin
    // déclenche l'erreur "drawImage: canvas element with a width or height of 0".
    setTimeout(() => this.initStage(), 0);
  }

  private initStage(): void {
    const host = this.stageHost.nativeElement;
    const w = host.clientWidth || host.offsetWidth || 800;
    const h = host.clientHeight || host.offsetHeight || 500;

    this.stage = new Konva.Stage({
      container: host,
      width: w,
      height: h,
      draggable: true,
    });

    // Couche 1 : chemins de communication
    this.relLayer = new Konva.Layer();
    this.stage.add(this.relLayer);

    // Couche 2 : nœuds (au-dessus des liens)
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    this.stage.on('wheel', (e) => this.onWheel(e));
    this.stage.on('mousemove', () => this.onStageMouseMove());
    this.stage.on('mouseup', (e) => this.onStageMouseUp(e));
    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('mouseup', this.globalMouseUp);

    // ResizeObserver : redimensionne le stage quand le conteneur change de taille
    // (notamment lorsque l'onglet "Diagramme" devient visible après l'init).
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resizeStage());
      this.resizeObserver.observe(host);
    }

    this.positionChange$.pipe(debounceTime(400)).subscribe(({ id, x, y }) => this.savePosition(id, x, y));

    this.load();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener('mouseup', this.globalMouseUp);
    this.resizeObserver?.disconnect();
    if (this.stage) this.stage.destroy();
  }

  // ── Chargement ────────────────────────────────────────────────────────────

  private load(): void {
    this.loading = true;
    this.technologieService.list().subscribe({
      next: (components) => {
        this.components = components;
        this.canevasService.listRelations().subscribe({
          next: (rels) => {
            // Uniquement les chemins de communication entre nœuds du même type
            this.relations = rels.filter(
              (r) => r.sourceKind === 'TECH_COMPONENT' && r.targetKind === 'TECH_COMPONENT',
            );
            this.loading = false;
            this.maybeAutoLayout();
            this.render();
          },
          error: () => { this.loading = false; this.render(); },
        });
      },
      error: () => {
        this.loading = false;
        this.toast.error('Impossible de charger les composants techniques.');
      },
    });
  }

  private maybeAutoLayout(): void {
    if (this.layingOut || this.components.length === 0) return;
    if (this.components.some((c) => c.positionX != null)) return;
    this.layingOut = true;
    this.technologieService.generateLayout().subscribe({
      next: () => { this.layingOut = false; this.load(); },
      error: () => { this.layingOut = false; },
    });
  }

  async regenererDisposition(): Promise<void> {
    if (this.layingOut) return;
    if (this.components.some((c) => c.positionX != null)) {
      const ok = await this.confirmDialog.confirm(
        'Réorganiser automatiquement tous les composants écrasera leurs positions actuelles. Continuer ?',
      );
      if (!ok) return;
    }
    this.layingOut = true;
    this.technologieService.generateLayout().subscribe({
      next: () => {
        this.layingOut = false;
        this.toast.success('Diagramme réorganisé.');
        this.load();
        this.changed.emit();
      },
      error: () => { this.layingOut = false; this.toast.error('Impossible de réorganiser le diagramme.'); },
    });
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  private render(): void {
    this.layer.destroyChildren();
    this.relLayer.destroyChildren();
    this.nodeGroups.clear();
    this.nodePositions.clear();

    // Résoudre les positions (avec fallback grille)
    let cursorX = 40;
    for (const comp of this.components) {
      const pos: Pos =
        comp.positionX != null && comp.positionY != null
          ? { x: comp.positionX, y: comp.positionY }
          : { x: cursorX, y: ROW_Y };
      cursorX += UNIT_W;
      this.nodePositions.set(comp.id, pos);
    }

    // Dessiner les chemins de communication dans la couche inférieure
    this.redrawRelations();

    // Dessiner les nœuds dans la couche supérieure
    for (const comp of this.components) {
      const group = this.buildNodeGroup(comp, this.nodePositions.get(comp.id)!);
      this.nodeGroups.set(comp.id, group);
      this.layer.add(group);
    }

    this.layer.draw();
    this.relLayer.draw();
  }

  /**
   * Redessine uniquement les chemins de communication (sans recréer les nœuds).
   * Appelé après chaque déplacement de nœud ou modification des relations.
   */
  private redrawRelations(): void {
    this.relLayer.destroyChildren();

    for (const rel of this.relations) {
      const from = this.nodePositions.get(rel.sourceId);
      const to = this.nodePositions.get(rel.targetId);
      if (!from || !to) continue;

      // Centre des faces avant des nœuds (boîte 3D : face avant = décalée de DEPTH en Y)
      const fromCx = from.x + NODE_W / 2;
      const fromCy = from.y + DEPTH + NODE_H / 2;
      const toCx = to.x + NODE_W / 2;
      const toCy = to.y + DEPTH + NODE_H / 2;

      // Résoudre le type de lien réseau depuis le label de la relation
      const lienType = this.extractLienType(rel);
      const lienColor = LIEN_COLOR[lienType];
      const lienDash  = LIEN_DASH[lienType];
      const lienText  = LIEN_LABEL[lienType];

      // Chemin de communication UML : association, trait plein ou tirets selon le type
      const line = new Konva.Line({
        points: [fromCx, fromCy, toCx, toCy],
        stroke: lienColor,
        strokeWidth: 1.8,
        dash: lienDash,
        hitStrokeWidth: 12,
        name: `comm-${rel.id}`,
      });

      // Annotation au milieu du trait (stéréotype du lien)
      const midX = (fromCx + toCx) / 2;
      const midY = (fromCy + toCy) / 2;

      // Fond blanc derrière le label pour lisibilité
      const labelBg = new Konva.Rect({
        x: midX - 40, y: midY - 11,
        width: 80, height: 14,
        fill: '#ffffff', opacity: 0.85, cornerRadius: 3,
        listening: false,
      });

      const label = new Konva.Text({
        x: midX - 40, y: midY - 11,
        width: 80,
        text: lienText,
        fontSize: 8, fontStyle: 'italic',
        fill: lienColor, align: 'center',
        listening: false,
      });

      // Clic droit → supprimer
      line.on('contextmenu', (e) => {
        e.evt.preventDefault();
        this.pendingRelationDelete = { relation: rel };
      });
      line.on('mouseenter', () => {
        document.body.style.cursor = 'pointer';
        line.stroke('#ef4444');
        line.strokeWidth(2.5);
        this.relLayer.batchDraw();
      });
      line.on('mouseleave', () => {
        document.body.style.cursor = 'default';
        line.stroke(lienColor);
        line.strokeWidth(1.8);
        this.relLayer.batchDraw();
      });

      this.relLayer.add(line);
      this.relLayer.add(labelBg);
      this.relLayer.add(label);
    }
    this.relLayer.draw();
  }

  // ── Nœud UML (boîte 3D) ──────────────────────────────────────────────────

  private buildNodeGroup(comp: TechComponent, pos: Pos): Konva.Group {
    const color = TYPE_COLOR[comp.type];
    const fill = TYPE_FILL[comp.type];
    const isSelected = this.selectedComponent?.id === comp.id;
    const frontY = DEPTH;

    const group = new Konva.Group({ x: pos.x, y: pos.y, draggable: true });
    group.setAttr('nodeId', comp.id);

    // ── Corps du nœud (boîte 3D) ────────────────────────────────────────

    // Face du dessus
    group.add(new Konva.Line({
      points: [0, frontY, DEPTH, 0, NODE_W + DEPTH, 0, NODE_W, frontY],
      closed: true, fill, stroke: color, strokeWidth: isSelected ? 2 : 1.2, opacity: 0.9,
    }));
    // Face latérale
    group.add(new Konva.Line({
      points: [NODE_W, frontY, NODE_W + DEPTH, 0, NODE_W + DEPTH, NODE_H, NODE_W, NODE_H + frontY],
      closed: true, fill, stroke: color, strokeWidth: isSelected ? 2 : 1.2, opacity: 0.7,
    }));
    // Face avant
    group.add(new Konva.Rect({
      x: 0, y: frontY, width: NODE_W, height: NODE_H,
      fill, stroke: color, strokeWidth: isSelected ? 2.5 : 1.4,
      shadowBlur: isSelected ? 8 : 0, shadowColor: color, shadowOpacity: 0.5,
    }));
    // En-tête sombre
    group.add(new Konva.Rect({ x: 0, y: frontY, width: NODE_W, height: HEADER_H, fill: '#1E283D' }));
    // Stéréotype
    group.add(new Konva.Text({
      x: 6, y: frontY + 2, width: NODE_W - 12,
      text: `${TYPE_STEREOTYPE[comp.type]} ${TYPE_LABEL[comp.type]}`,
      fontSize: 8, fontStyle: 'italic', fill: '#c9d2e3', align: 'center',
    }));
    // Nom du nœud
    group.add(new Konva.Text({
      x: 6, y: frontY + 12, width: NODE_W - 12, height: HEADER_H - 12,
      text: comp.nom, fontSize: 12, fontStyle: 'bold',
      fill: '#ffffff', align: 'center', verticalAlign: 'middle', wrap: 'none', ellipsis: true,
    }));

    // ── Artefacts déployés ───────────────────────────────────────────────

    const nodeRightX = NODE_W + DEPTH;
    comp.deploiements.forEach((d, i) => {
      const compY = frontY + i * (COMP_H + COMP_GAP_Y);
      const compX = nodeRightX + NODE_TO_COMP_GAP;
      const midY = compY + COMP_H / 2;

      group.add(this.buildDeployDependency(compX, midY, nodeRightX, midY));
      group.add(new Konva.Text({
        x: nodeRightX, y: midY - 15, width: NODE_TO_COMP_GAP,
        text: '«deploy»', fontSize: 8, fontStyle: 'italic', fill: '#5b6478', align: 'center',
      }));
      group.add(this.buildArtifactBox(d.application.nom, compX, compY));
    });

    // ── Points d'ancrage (création de chemins de communication) ──────────

    // 4 ancres : haut, droite, bas, gauche (face avant du nœud)
    const anchors: Konva.Circle[] = [
      { x: NODE_W / 2, y: frontY },
      { x: NODE_W,     y: frontY + NODE_H / 2 },
      { x: NODE_W / 2, y: frontY + NODE_H },
      { x: 0,          y: frontY + NODE_H / 2 },
    ].map(({ x, y }) => {
      const circle = new Konva.Circle({
        x, y, radius: ANCHOR_R,
        fill: color, stroke: '#ffffff', strokeWidth: 1.5,
        opacity: 0,
      });

      circle.on('mousedown', (e) => {
        e.cancelBubble = true;
        group.draggable(false);
        const absX = group.x() + x;
        const absY = group.y() + y;
        this.startLinking(comp.id, { x: absX, y: absY });
      });
      circle.on('mouseenter', () => {
        document.body.style.cursor = 'crosshair';
        circle.radius(ANCHOR_R + 2);
        this.layer.batchDraw();
      });
      circle.on('mouseleave', () => {
        document.body.style.cursor = 'grab';
        circle.radius(ANCHOR_R);
        this.layer.batchDraw();
      });

      group.add(circle);
      return circle;
    });

    // ── Bouton « × » de suppression ─────────────────────────────────────

    const deleteBtn = new Konva.Group({ x: NODE_W, y: 0, opacity: 0 });
    deleteBtn.add(new Konva.Circle({ radius: 8, fill: '#dc2626', stroke: '#ffffff', strokeWidth: 1 }));
    deleteBtn.add(new Konva.Text({
      text: '×', fontSize: 13, fontStyle: 'bold', fill: '#ffffff',
      width: 16, height: 16, offsetX: 8, offsetY: 8.5,
      align: 'center', verticalAlign: 'middle', listening: false,
    }));
    deleteBtn.on('mousedown', (e) => e.cancelBubble = true);
    deleteBtn.on('click', (e) => { e.cancelBubble = true; this.askDeleteComponent(comp); });
    deleteBtn.on('mouseenter', () => document.body.style.cursor = 'pointer');
    deleteBtn.on('mouseleave', () => document.body.style.cursor = 'grab');
    group.add(deleteBtn);

    // ── Événements du groupe ──────────────────────────────────────────────

    group.on('mouseenter', () => {
      document.body.style.cursor = 'grab';
      anchors.forEach((a) => a.opacity(0.85));
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

    group.on('click tap', () => {
      this.selectedComponent = this.selectedComponent?.id === comp.id ? null : comp;
      // Mettre à jour le rendu de sélection (encadré en surbrillance)
      this.render();
    });

    group.on('dragmove', () => {
      this.nodePositions.set(comp.id, { x: group.x(), y: group.y() });
      this.redrawRelations();
    });

    group.on('dragend', () => {
      comp.positionX = group.x();
      comp.positionY = group.y();
      this.positionChange$.next({ id: comp.id, x: group.x(), y: group.y() });
    });

    return group;
  }

  // ── Artefact UML (document à coin plié) ──────────────────────────────────

  private buildArtifactBox(nom: string, x: number, y: number): Konva.Group {
    const box = new Konva.Group({ x, y });
    box.add(new Konva.Rect({
      width: COMP_W, height: COMP_H, fill: '#F5F9FF',
      stroke: '#1F3BB3', strokeWidth: 1.3, cornerRadius: 3,
    }));
    box.add(new Konva.Text({
      x: 8, y: 3, width: COMP_W - 26,
      text: '«artifact»', fontSize: 7.5, fontStyle: 'italic', fill: '#5b6478',
    }));
    box.add(new Konva.Text({
      x: 8, y: 13, width: COMP_W - 26, height: COMP_H - 13,
      text: nom, fontSize: 10.5, fontStyle: 'bold', fill: '#1a1a1a',
      verticalAlign: 'middle', wrap: 'none', ellipsis: true,
    }));
    box.add(this.buildArtifactIcon(COMP_W - 18, 6));
    return box;
  }

  private buildArtifactIcon(x: number, y: number): Konva.Group {
    const w = 12, h = 15, fold = 4;
    const icon = new Konva.Group({ x, y });
    icon.add(new Konva.Line({
      points: [0, 0, w - fold, 0, w, fold, w, h, 0, h],
      closed: true, stroke: '#1F3BB3', strokeWidth: 1, fill: '#ffffff',
    }));
    icon.add(new Konva.Line({
      points: [w - fold, 0, w - fold, fold, w, fold],
      stroke: '#1F3BB3', strokeWidth: 1,
    }));
    return icon;
  }

  /**
   * Dépendance de déploiement UML : trait pointillé, pointe ouverte,
   * de l'Artefact vers le Nœud, stéréotypée «deploy».
   */
  private buildDeployDependency(fromX: number, fromY: number, toX: number, toY: number): Konva.Group {
    const g = new Konva.Group({ listening: false });
    g.add(new Konva.Line({
      points: [fromX, fromY, toX, toY],
      stroke: '#5b6478', strokeWidth: 1.2, dash: [5, 4],
    }));
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const len = 9, spread = Math.PI / 7;
    g.add(new Konva.Line({
      points: [
        toX - len * Math.cos(angle - spread), toY - len * Math.sin(angle - spread),
        toX, toY,
        toX - len * Math.cos(angle + spread), toY - len * Math.sin(angle + spread),
      ],
      stroke: '#5b6478', strokeWidth: 1.2, lineCap: 'round', lineJoin: 'round',
    }));
    return g;
  }

  // ── Liaison interactive (points d'ancrage → chemin de communication) ──────

  private startLinking(fromId: string, from: Pos): void {
    const line = new Konva.Line({
      points: [from.x, from.y, from.x, from.y],
      stroke: '#1e40af', strokeWidth: 2, dash: [5, 4], listening: false,
    });
    this.relLayer.add(line);
    this.relLayer.batchDraw();
    this.linking = { fromId, line };
  }

  private onStageMouseMove(): void {
    if (!this.linking) return;
    const pos = this.stage.getRelativePointerPosition();
    if (!pos) return;
    const pts = this.linking.line.points();
    this.linking.line.points([pts[0], pts[1], pos.x, pos.y]);
    this.relLayer.batchDraw();
  }

  private onStageMouseUp(e: Konva.KonvaEventObject<MouseEvent>): void {
    if (!this.linking) return;
    const fromId = this.linking.fromId;
    this.nodeGroups.get(fromId)?.draggable(true);
    const targetId = this.resolveNodeIdFromEvent(e.target);
    this.linking.line.destroy();
    this.linking = null;
    document.body.style.cursor = 'default';
    this.relLayer.batchDraw();

    if (!targetId || targetId === fromId) return;

    // Vérifier que la relation n'existe pas déjà dans les deux sens
    const duplicate = this.relations.some(
      (r) =>
        (r.sourceId === fromId && r.targetId === targetId) ||
        (r.sourceId === targetId && r.targetId === fromId),
    );
    if (duplicate) {
      this.toast.error('Un chemin de communication existe déjà entre ces deux nœuds.');
      return;
    }

    // Ouvrir la modale de choix du type de lien
    this.pendingLien = { fromId, toId: targetId, typeLien: 'TCP_IP' };
  }

  private cancelLinking(): void {
    if (!this.linking) return;
    this.nodeGroups.get(this.linking.fromId)?.draggable(true);
    this.linking.line.destroy();
    this.linking = null;
    document.body.style.cursor = 'default';
    this.relLayer?.batchDraw();
  }

  /** Remonte l'arbre Konva pour trouver l'attribut `nodeId` sur un groupe nœud. */
  private resolveNodeIdFromEvent(target: Konva.Node): string | null {
    let node: Konva.Node | null = target;
    while (node && node !== this.stage) {
      const id = node.getAttr('nodeId');
      if (id) return id as string;
      node = node.getParent();
    }
    return null;
  }

  // ── Création d'un lien de communication (modale de choix du type) ───────────

  /**
   * Confirme la création d'un chemin de communication avec le type réseau choisi.
   * `type` reste ASSOCIATION (type UML correct pour un chemin de communication) ;
   * le type de lien réseau est stocké dans le champ `label` dédié.
   */
  confirmLien(event: Event): void {
    event.preventDefault();
    const p = this.pendingLien;
    if (!p) return;

    this.canevasService
      .createRelation({
        sourceKind: 'TECH_COMPONENT', sourceId: p.fromId,
        targetKind: 'TECH_COMPONENT', targetId: p.toId,
        type: 'ASSOCIATION',
        label: p.typeLien,   // "VPN" | "HTTPS" | "FIBRE" | etc.
      })
      .subscribe({
        next: (rel) => {
          this.relations = [...this.relations, rel];
          this.pendingLien = null;
          this.redrawRelations();
          this.toast.success('Chemin de communication créé.');
        },
        error: () => this.toast.error('Impossible de créer ce chemin de communication.'),
      });
  }

  cancelLien(): void {
    this.pendingLien = null;
  }

  /** Extrait le TypeLienCommunication depuis le champ `label` de la relation. */
  private extractLienType(rel: CanevasRelation): TypeLienCommunication {
    const code = rel.label as TypeLienCommunication | undefined;
    if (code && LIENS_DISPONIBLES.includes(code)) return code;
    return 'TCP_IP';
  }

  /** Nom du nœud source pour l'affichage dans la modale. */
  nodeNom(id: string): string {
    return this.components.find((c) => c.id === id)?.nom ?? '?';
  }

  // ── Suppression d'un chemin de communication (clic droit) ─────────────────

  confirmDeleteRelation(pd: PendingRelationDelete): void {
    this.canevasService.deleteRelation(pd.relation.id).subscribe({
      next: () => {
        this.relations = this.relations.filter((r) => r.id !== pd.relation.id);
        this.pendingRelationDelete = null;
        this.redrawRelations();
        this.toast.success('Chemin de communication supprimé.');
      },
      error: () => this.toast.error('Impossible de supprimer ce chemin de communication.'),
    });
  }

  // ── Actions sur les nœuds ─────────────────────────────────────────────────

  openEdit(): void {
    if (!this.selectedComponent) return;
    this.pendingEdit = {
      nom: this.selectedComponent.nom,
      description: this.selectedComponent.description ?? '',
    };
  }

  confirmEdit(event: Event): void {
    event.preventDefault();
    if (!this.selectedComponent || !this.pendingEdit?.nom.trim()) return;
    this.technologieService.update(this.selectedComponent.id, this.pendingEdit).subscribe({
      next: (updated) => {
        this.components = this.components.map((c) => c.id === updated.id ? { ...c, ...updated } : c);
        this.pendingEdit = null;
        this.selectedComponent = null;
        this.render();
        this.changed.emit();
      },
      error: () => this.toast.error('Impossible de modifier ce composant.'),
    });
  }

  private askDeleteComponent(comp: TechComponent): void {
    this.confirmDialog.confirm(`Supprimer le composant « ${comp.nom} » ?`).then((ok) => {
      if (!ok) return;
      this.technologieService.delete(comp.id).subscribe({
        next: () => {
          this.components = this.components.filter((c) => c.id !== comp.id);
          this.relations = this.relations.filter(
            (r) => r.sourceId !== comp.id && r.targetId !== comp.id,
          );
          if (this.selectedComponent?.id === comp.id) this.selectedComponent = null;
          this.render();
          this.changed.emit();
          this.toast.success('Composant supprimé.');
        },
        error: () => this.toast.error('Impossible de supprimer ce composant.'),
      });
    });
  }

  async removeSelected(): Promise<void> {
    if (!this.selectedComponent) return;
    this.askDeleteComponent(this.selectedComponent);
  }

  // ── Persistance de position ───────────────────────────────────────────────

  private savePosition(id: string, x: number, y: number): void {
    // Ignorer les positions invalides (NaN/Infinity) qui surviendraient si le
    // stage n'est pas encore correctement dimensionné.
    if (!isFinite(x) || !isFinite(y)) return;
    this.technologieService.update(id, { positionX: x, positionY: y }).subscribe({
      error: () => this.toast.error("Impossible d'enregistrer la position."),
    });
  }

  // ── Accesseurs template ───────────────────────────────────────────────────

  typeLabel(type: TypeTechComponent): string { return TYPE_LABEL[type]; }
  typeColor(type: TypeTechComponent): string { return TYPE_COLOR[type]; }

  // ── Export PNG ────────────────────────────────────────────────────────────

  exportPng(): void {
    if (!this.stage || this.stage.width() === 0 || this.stage.height() === 0) {
      this.toast.error('Le diagramme n\'est pas encore visible. Ouvrez l\'onglet Diagramme avant d\'exporter.');
      return;
    }
    downloadDataUrl(this.stage.toDataURL({ pixelRatio: 2 }), 'diagramme-de-deploiement.png');
  }

  // ── Drop depuis la palette ────────────────────────────────────────────────

  onDragStart(event: DragEvent, type: TypeTechComponent): void {
    event.dataTransfer?.setData('application/x-archivision-type-tech', type);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const type = event.dataTransfer?.getData('application/x-archivision-type-tech') as TypeTechComponent | undefined;
    if (!type) return;
    const rect = this.stageHost.nativeElement.getBoundingClientRect();
    const scale = this.stage.scaleX();
    const x = (event.clientX - rect.left - this.stage.x()) / scale;
    const y = (event.clientY - rect.top - this.stage.y()) / scale;
    this.pendingCreate = { type, x, y, nom: '', description: '' };
  }

  cancelCreate(): void { this.pendingCreate = null; }

  confirmCreate(event: Event): void {
    event.preventDefault();
    const p = this.pendingCreate;
    if (!p || !p.nom.trim()) return;
    // Coordonnées invalides si le stage n'était pas encore dimensionné lors du drop
    const positionX = isFinite(p.x) ? p.x : undefined;
    const positionY = isFinite(p.y) ? p.y : undefined;
    this.technologieService
      .create({ nom: p.nom.trim(), type: p.type, description: p.description || undefined, positionX, positionY })
      .subscribe({
        next: (created) => {
          this.components = [...this.components, { ...created, deploiements: created.deploiements ?? [] }];
          this.pendingCreate = null;
          this.render();
          this.toast.success('Composant ajouté.');
          this.changed.emit();
        },
        error: () => this.toast.error("Impossible d'ajouter ce composant."),
      });
  }

  // ── Zoom / pan / resize ───────────────────────────────────────────────────

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
    const newScale = Math.min(Math.max(e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy, 0.3), 2.5);
    this.stage.scale({ x: newScale, y: newScale });
    this.stage.position({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
    this.stage.batchDraw();
  }

  private resizeStage(): void {
    if (!this.stage) return;
    const host = this.stageHost.nativeElement;
    const w = host.clientWidth || host.offsetWidth;
    const h = host.clientHeight || host.offsetHeight;
    if (w > 0) this.stage.width(w);
    if (h > 0) this.stage.height(h);
  }
}
