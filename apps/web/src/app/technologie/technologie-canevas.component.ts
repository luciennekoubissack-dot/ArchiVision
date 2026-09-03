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

const TYPES: TypeTechComponent[] = ['SERVEUR', 'ORDINATEUR_PORTABLE', 'ROUTEUR_RESEAU', 'CAPTEUR_IOT_CONSOMMATION', 'SMARTPHONE_PROFESSIONNEL', 'STOCKAGE_NAS', 'BASE_DE_DONNEES_POSTGRESQL', 'SERVEUR_APPLICATIONS', 'API_REST', 'LOGICIEL_CYBERSECURITE', 'SYSTEME_EXPLOITATION_LINUX', 'PLATEFORME_CLOUD', 'PARE_FEU', 'SWITCH', 'VPN', 'CONNEXION_INTERNET_FIBRE', 'AUTRE'];
const PNG_FORMAT: DownloadFormatOption[] = [{ value: 'png', label: 'PNG' }];

interface PendingCreate {
  type: TypeTechComponent;
  x: number;
  y: number;
  nom: string;
  description: string;
}

interface PendingEdit {
  nom: string;
  description: string;
}

// Notation UML « déploiement » (UML 2.5, OMG formal/2017-12-05, clause 19) :
// - Le TechComponent est un Nœud (boîte 3D en perspective), stéréotypé «device»
//   pour le matériel physique (serveur, équipement réseau) ou
//   «executionEnvironment» (un seul mot, casse UML) pour un environnement
//   d'exécution logiciel (cloud, SGBD, middleware). « nœud » seul n'est pas un
//   stéréotype : Node est déjà la métaclasse UML, une boîte 3D sans mot-clé =
//   un Nœud générique.
// - Chaque application déployée est un Artefact (icône document à coin plié,
//   PAS l'icône Composant à encoches) relié au nœud par une dépendance de
//   déploiement : trait pointillé, pointe de flèche OUVERTE (en V, non pleine),
//   orientée de l'Artefact VERS le Nœud (client → fournisseur, sens recommandé
//   par UML 2.4+), mot-clé «deploy».
// - Chemin de communication entre nœuds (association, trait plein éventuellement
//   stéréotypé «TCP/IP»...) : non représenté ici, le modèle ne relie pas les
//   composants entre eux.
// Voir apps/web/src/assets/diagramme-deploiement-template.png pour la mise en
// page générale (nœuds + artefacts reliés par des dépendances).
const NODE_W = 150;
const NODE_H = 64;
const DEPTH = 14;
const HEADER_H = 26;
const COMP_W = 140;
const COMP_H = 30;
const COMP_GAP_Y = 20;
const NODE_TO_COMP_GAP = 55;
const GAP_X = 40;
const ROW_Y = 60;
const UNIT_W = NODE_W + DEPTH + NODE_TO_COMP_GAP + COMP_W + GAP_X;

const TYPE_LABEL: Record<TypeTechComponent, string> = {
  SERVEUR: 'Serveur',
  RESEAU: 'Réseau',
  CLOUD: 'Cloud',
  BASE_DE_DONNEES: 'Base de données',
  MIDDLEWARE: 'Middleware',
  ORDINATEUR_PORTABLE: 'Ordinateur portable', ROUTEUR_RESEAU: 'Routeur réseau', CAPTEUR_IOT_CONSOMMATION: 'Capteur IoT de consommation énergétique', SMARTPHONE_PROFESSIONNEL: 'Smartphone professionnel', STOCKAGE_NAS: 'Stockage NAS',
  BASE_DE_DONNEES_POSTGRESQL: 'Base de données PostgreSQL', SERVEUR_APPLICATIONS: "Serveur d'applications", API_REST: 'API REST', LOGICIEL_CYBERSECURITE: 'Logiciel de cybersécurité', SYSTEME_EXPLOITATION_LINUX: "Système d'exploitation Linux", PLATEFORME_CLOUD: 'Plateforme Cloud (AWS ou Azure)', PARE_FEU: 'Pare-feu', SWITCH: 'Switchs', VPN: 'VPN', CONNEXION_INTERNET_FIBRE: 'Connexion Internet fibre', AUTRE: 'Autre',
};

/** «device» pour le matériel physique, «executionEnvironment» (mot-clé UML) pour un environnement logiciel. */
const TYPE_STEREOTYPE: Record<TypeTechComponent, string> = {
  SERVEUR: '«device»',
  RESEAU: '«device»',
  CLOUD: '«executionEnvironment»',
  BASE_DE_DONNEES: '«executionEnvironment»',
  MIDDLEWARE: '«executionEnvironment»',
  ORDINATEUR_PORTABLE: '«device»', ROUTEUR_RESEAU: '«device»', CAPTEUR_IOT_CONSOMMATION: '«device»', SMARTPHONE_PROFESSIONNEL: '«device»', STOCKAGE_NAS: '«device»',
  BASE_DE_DONNEES_POSTGRESQL: '«executionEnvironment»', SERVEUR_APPLICATIONS: '«executionEnvironment»', API_REST: '«executionEnvironment»', LOGICIEL_CYBERSECURITE: '«executionEnvironment»', SYSTEME_EXPLOITATION_LINUX: '«executionEnvironment»', PLATEFORME_CLOUD: '«executionEnvironment»',
  PARE_FEU: '«device»', SWITCH: '«device»', VPN: '«executionEnvironment»', CONNEXION_INTERNET_FIBRE: '«device»', AUTRE: '«node»',
};

const TYPE_COLOR: Record<TypeTechComponent, string> = {
  SERVEUR: '#1F3BB3',
  RESEAU: '#0F766E',
  CLOUD: '#7C3AED',
  BASE_DE_DONNEES: '#B45309',
  MIDDLEWARE: '#BE185D',
  ORDINATEUR_PORTABLE: '#2563EB', ROUTEUR_RESEAU: '#0F766E', CAPTEUR_IOT_CONSOMMATION: '#0891B2', SMARTPHONE_PROFESSIONNEL: '#2563EB', STOCKAGE_NAS: '#475569',
  BASE_DE_DONNEES_POSTGRESQL: '#B45309', SERVEUR_APPLICATIONS: '#BE185D', API_REST: '#BE185D', LOGICIEL_CYBERSECURITE: '#B91C1C', SYSTEME_EXPLOITATION_LINUX: '#475569', PLATEFORME_CLOUD: '#7C3AED',
  PARE_FEU: '#B91C1C', SWITCH: '#0F766E', VPN: '#7C3AED', CONNEXION_INTERNET_FIBRE: '#0F766E', AUTRE: '#64748B',
};

const TYPE_FILL: Record<TypeTechComponent, string> = {
  SERVEUR: '#DCE4FA',
  RESEAU: '#D6F0EC',
  CLOUD: '#E9E1FB',
  BASE_DE_DONNEES: '#FBE9D6',
  MIDDLEWARE: '#FBDCEA',
  ORDINATEUR_PORTABLE: '#DBEAFE', ROUTEUR_RESEAU: '#D6F0EC', CAPTEUR_IOT_CONSOMMATION: '#CFFAFE', SMARTPHONE_PROFESSIONNEL: '#DBEAFE', STOCKAGE_NAS: '#E2E8F0',
  BASE_DE_DONNEES_POSTGRESQL: '#FBE9D6', SERVEUR_APPLICATIONS: '#FBDCEA', API_REST: '#FBDCEA', LOGICIEL_CYBERSECURITE: '#FEE2E2', SYSTEME_EXPLOITATION_LINUX: '#E2E8F0', PLATEFORME_CLOUD: '#E9E1FB',
  PARE_FEU: '#FEE2E2', SWITCH: '#D6F0EC', VPN: '#E9E1FB', CONNEXION_INTERNET_FIBRE: '#D6F0EC', AUTRE: '#E2E8F0',
};

interface Pos {
  x: number;
  y: number;
}

@Component({
  selector: 'app-technologie-canevas',
  standalone: true,
  imports: [CommonModule, DownloadMenuComponent],
  template: `
    <div class="page-header">
      <p class="hint">Glissez un composant de la palette sur le plan pour l'ajouter. Glissez un nœud déjà placé pour le repositionner.</p>
      <div class="header-actions">
        <button
          type="button"
          class="btn btn-outline"
          [disabled]="layingOut || components.length === 0"
          (click)="regenererDisposition()"
        >
          {{ layingOut ? 'Génération…' : 'Réorganiser le diagramme' }}
        </button>
        <button type="button" class="btn btn-outline" [disabled]="!selectedComponent || layingOut" (click)="openEdit()">Modifier</button>
        <button type="button" class="btn btn-outline" [disabled]="!selectedComponent || layingOut" (click)="startLinking()">Lier</button>
        <button type="button" class="btn btn-danger" [disabled]="!selectedComponent || layingOut" (click)="removeSelected()">Supprimer</button>
        <app-download-menu [formats]="pngFormat" [disabled]="components.length === 0" (download)="exportPng()" />
      </div>
    </div>
    <div class="tech-layout">
      <aside class="palette">
        <h4>Composants</h4>
        <div class="item" *ngFor="let t of types" draggable="true" (dragstart)="onDragStart($event, t)">
          <span class="palette-swatch" [style.background]="typeColor(t)"></span>
          {{ typeLabel(t) }}
        </div>
      </aside>

      <div class="stage-wrap">
        <div class="empty-state" *ngIf="!loading && components.length === 0">
          Aucun composant technique pour l'instant — glissez une icône depuis la palette.
        </div>
        <div #stageHost class="stage-host" (dragover)="onDragOver($event)" (drop)="onDrop($event)"></div>
      </div>
    </div>

    <div class="pending-form" *ngIf="pendingCreate as p">
      <form class="card form-card" (submit)="confirmCreate($event)">
        <h3>Nouveau composant — {{ typeLabel(p.type) }}</h3>
        <label class="field">
          Nom
          <input type="text" [value]="p.nom" (input)="p.nom = $any($event.target).value" required autofocus />
        </label>
        <label class="field">
          Description
          <textarea placeholder="Rôle du composant et justification du choix technologique." [value]="p.description" (input)="p.description = $any($event.target).value"></textarea>
        </label>
        <div class="pending-actions">
          <button type="button" class="btn btn-ghost" (click)="cancelCreate()">Annuler</button>
          <button type="submit" class="btn btn-primary">Créer</button>
        </div>
      </form>
    </div>

    <div class="pending-form" *ngIf="pendingEdit as draft">
      <form class="card form-card" (submit)="confirmEdit($event)">
        <h3>Modifier le composant</h3>
        <label class="field">Nom<input type="text" [value]="draft.nom" (input)="draft.nom = $any($event.target).value" required autofocus /></label>
        <label class="field">Description<textarea [value]="draft.description" (input)="draft.description = $any($event.target).value"></textarea></label>
        <div class="pending-actions"><button type="button" class="btn btn-ghost" (click)="pendingEdit = null">Annuler</button><button type="submit" class="btn btn-primary">Enregistrer</button></div>
      </form>
    </div>

    <div class="pending-form" *ngIf="linkSource as source">
      <form class="card form-card" (submit)="confirmLink($event)">
        <h3>Lier un composant</h3>
        <p class="hint">Chemin de communication UML entre « {{ source.nom }} » et un autre nœud.</p>
        <label class="field">Composant cible<select [value]="linkTargetId" (change)="linkTargetId = $any($event.target).value" required><option value="" disabled>Choisir un composant</option><option *ngFor="let component of linkTargets" [value]="component.id">{{ component.nom }}</option></select></label>
        <div class="pending-actions"><button type="button" class="btn btn-ghost" (click)="linkSource = null">Annuler</button><button type="submit" class="btn btn-primary">Créer le lien</button></div>
      </form>
    </div>
  `,
  styles: [
    `
      .hint { color: var(--color-text-muted); font-size: 0.85rem; margin: 0; max-width: 640px; }
      .header-actions { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }
      .tech-layout { display: flex; gap: 1.25rem; align-items: flex-start; }
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
      .palette-swatch { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; }
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
  pendingEdit: PendingEdit | null = null;
  linkSource: TechComponent | null = null;
  linkTargetId = '';
  pendingCreate: PendingCreate | null = null;

  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private readonly positionChange$ = new Subject<{ id: string; x: number; y: number }>();
  private readonly resizeHandler = () => this.resizeStage();

  constructor(
    private readonly technologieService: TechnologieService,
    private readonly toast: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly canevasService: CanevasService,
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
        this.canevasService.listRelations().subscribe((relations) => (this.relations = relations.filter((r) => r.sourceKind === 'TECH_COMPONENT' && r.targetKind === 'TECH_COMPONENT')));
        this.loading = false;
        this.maybeAutoLayout();
        this.render();
      },
      error: () => {
        this.loading = false;
        this.toast.error('Impossible de charger les composants techniques.');
      },
    });
  }

  /** Première ouverture d'un diagramme jamais disposé : disposition automatique. */
  private maybeAutoLayout(): void {
    if (this.layingOut || this.components.length === 0) return;
    if (this.components.some((c) => c.positionX != null)) return;
    this.layingOut = true;
    this.technologieService.generateLayout().subscribe({
      next: () => {
        this.layingOut = false;
        this.load();
      },
      error: () => {
        this.layingOut = false;
      },
    });
  }

  /** Bouton « Réorganiser le diagramme » : recalcule toute la disposition. */
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
      error: () => {
        this.layingOut = false;
        this.toast.error('Impossible de réorganiser le diagramme.');
      },
    });
  }

  private render(): void {
    this.layer.destroyChildren();

    const positions = new Map(this.components.map((component) => [component.id, component.positionX != null && component.positionY != null ? { x: component.positionX, y: component.positionY } : null]));
    for (const relation of this.relations) {
      const source = positions.get(relation.sourceId);
      const target = positions.get(relation.targetId);
      if (source && target) this.layer.add(new Konva.Line({ points: [source.x + NODE_W / 2, source.y + NODE_H / 2, target.x + NODE_W / 2, target.y + NODE_H / 2], stroke: '#5b6478', strokeWidth: 1.4, dash: [7, 4] }));
    }

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
        text: `${TYPE_STEREOTYPE[comp.type]} ${TYPE_LABEL[comp.type]}`,
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
      const midY = compY + COMP_H / 2;

      // Dépendance de déploiement UML : trait pointillé, pointe ouverte,
      // orientée de l'Artefact vers le Nœud (client → fournisseur), «deploy».
      group.add(this.buildDeployDependency(compX, midY, nodeRightX, midY));
      group.add(
        new Konva.Text({
          x: nodeRightX,
          y: midY - 15,
          width: NODE_TO_COMP_GAP,
          text: '«deploy»',
          fontSize: 8,
          fontStyle: 'italic',
          fill: '#5b6478',
          align: 'center',
        }),
      );
      group.add(this.buildArtifactBox(d.application.nom, compX, compY));
    });

    group.on('mouseenter', () => (document.body.style.cursor = 'grab'));
    group.on('mouseleave', () => (document.body.style.cursor = 'default'));
    group.on('click tap', () => (this.selectedComponent = comp));
    group.on('dragend', () => {
      comp.positionX = group.x();
      comp.positionY = group.y();
      this.positionChange$.next({ id: comp.id, x: group.x(), y: group.y() });
    });

    return group;
  }

  /**
   * Boîte « Artefact » UML (et non « Composant » : une application déployée
   * est un livrable exécutable, ce que l'UML modélise comme un Artefact,
   * avec son icône dédiée en forme de document à coin plié) et son
   * stéréotype «artifact» au-dessus du nom.
   */
  private buildArtifactBox(nom: string, x: number, y: number): Konva.Group {
    const box = new Konva.Group({ x, y });
    box.add(new Konva.Rect({ width: COMP_W, height: COMP_H, fill: '#F5F9FF', stroke: '#1F3BB3', strokeWidth: 1.3, cornerRadius: 3 }));
    box.add(
      new Konva.Text({
        x: 8,
        y: 3,
        width: COMP_W - 26,
        text: '«artifact»',
        fontSize: 7.5,
        fontStyle: 'italic',
        fill: '#5b6478',
      }),
    );
    box.add(
      new Konva.Text({
        x: 8,
        y: 13,
        width: COMP_W - 26,
        height: COMP_H - 13,
        text: nom,
        fontSize: 10.5,
        fontStyle: 'bold',
        fill: '#1a1a1a',
        verticalAlign: 'middle',
        wrap: 'none',
        ellipsis: true,
      }),
    );
    box.add(this.buildArtifactIcon(COMP_W - 18, 6));
    return box;
  }

  /** Icône UML d'artefact : rectangle avec le coin supérieur droit plié (icône « document »). */
  private buildArtifactIcon(x: number, y: number): Konva.Group {
    const w = 12;
    const h = 15;
    const fold = 4;
    const icon = new Konva.Group({ x, y });
    icon.add(
      new Konva.Line({
        points: [0, 0, w - fold, 0, w, fold, w, h, 0, h],
        closed: true,
        stroke: '#1F3BB3',
        strokeWidth: 1,
        fill: '#ffffff',
      }),
    );
    icon.add(
      new Konva.Line({
        points: [w - fold, 0, w - fold, fold, w, fold],
        stroke: '#1F3BB3',
        strokeWidth: 1,
      }),
    );
    return icon;
  }

  /**
   * Dépendance UML (trait pointillé + pointe de flèche OUVERTE en V, non
   * pleine) matérialisant la relation «deploy». `from` = bord de l'Artefact,
   * `to` = bord du Nœud : la flèche pointe vers le fournisseur (le Nœud).
   */
  private buildDeployDependency(fromX: number, fromY: number, toX: number, toY: number): Konva.Group {
    const g = new Konva.Group({ listening: false });
    g.add(
      new Konva.Line({
        points: [fromX, fromY, toX, toY],
        stroke: '#5b6478',
        strokeWidth: 1.2,
        dash: [5, 4],
      }),
    );
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const len = 9;
    const spread = Math.PI / 7;
    g.add(
      new Konva.Line({
        points: [
          toX - len * Math.cos(angle - spread),
          toY - len * Math.sin(angle - spread),
          toX,
          toY,
          toX - len * Math.cos(angle + spread),
          toY - len * Math.sin(angle + spread),
        ],
        stroke: '#5b6478',
        strokeWidth: 1.2,
        lineCap: 'round',
        lineJoin: 'round',
      }),
    );
    return g;
  }

  private savePosition(id: string, x: number, y: number): void {
    this.technologieService.update(id, { positionX: x, positionY: y }).subscribe({
      error: () => this.toast.error("Impossible d'enregistrer la position."),
    });
  }

  typeLabel(type: TypeTechComponent): string {
    return TYPE_LABEL[type];
  }

  typeColor(type: TypeTechComponent): string {
    return TYPE_COLOR[type];
  }

  get linkTargets(): TechComponent[] {
    return this.components.filter((component) => component.id !== this.linkSource?.id);
  }

  openEdit(): void {
    if (!this.selectedComponent) return;
    this.pendingEdit = { nom: this.selectedComponent.nom, description: this.selectedComponent.description ?? '' };
  }

  confirmEdit(event: Event): void {
    event.preventDefault();
    if (!this.selectedComponent || !this.pendingEdit?.nom.trim()) return;
    this.technologieService.update(this.selectedComponent.id, this.pendingEdit).subscribe({
      next: (updated) => { this.components = this.components.map((component) => component.id === updated.id ? { ...component, ...updated } : component); this.pendingEdit = null; this.selectedComponent = null; this.render(); this.changed.emit(); },
      error: () => this.toast.error('Impossible de modifier ce composant.'),
    });
  }

  async removeSelected(): Promise<void> {
    if (!this.selectedComponent) return;
    const component = this.selectedComponent;
    if (!await this.confirmDialog.confirm(`Supprimer le composant « ${component.nom} » ?`)) return;
    this.technologieService.delete(component.id).subscribe({
      next: () => { this.components = this.components.filter((item) => item.id !== component.id); this.relations = this.relations.filter((relation) => relation.sourceId !== component.id && relation.targetId !== component.id); this.selectedComponent = null; this.render(); this.changed.emit(); this.toast.success('Composant supprimé.'); },
      error: () => this.toast.error('Impossible de supprimer ce composant.'),
    });
  }

  startLinking(): void {
    if (!this.selectedComponent) return;
    this.linkSource = this.selectedComponent;
    this.linkTargetId = '';
  }

  confirmLink(event: Event): void {
    event.preventDefault();
    if (!this.linkSource || !this.linkTargetId) return;
    this.canevasService.createRelation({ sourceKind: 'TECH_COMPONENT', sourceId: this.linkSource.id, targetKind: 'TECH_COMPONENT', targetId: this.linkTargetId, type: 'ASSOCIATION' }).subscribe({
      next: (relation) => { this.relations = [relation, ...this.relations]; this.linkSource = null; this.selectedComponent = null; this.render(); this.toast.success('Chemin de communication créé.'); },
      error: () => this.toast.error('Impossible de créer ce lien.'),
    });
  }

  /** Ce canevas est le diagramme lui-même (pas de génération SVG backend pour ce module) : export direct du rendu Konva. */
  exportPng(): void {
    downloadDataUrl(this.stage.toDataURL({ pixelRatio: 2 }), 'diagramme-de-deploiement.png');
  }

  // ── Drop depuis la palette ───────────────────────────────────────────────

  onDragStart(event: DragEvent, type: TypeTechComponent): void {
    event.dataTransfer?.setData('application/x-archivision-type-tech', type);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

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

  cancelCreate(): void {
    this.pendingCreate = null;
  }

  confirmCreate(event: Event): void {
    event.preventDefault();
    const p = this.pendingCreate;
    if (!p || !p.nom.trim()) return;

    this.technologieService
      .create({ nom: p.nom.trim(), type: p.type, description: p.description || undefined, positionX: p.x, positionY: p.y })
      .subscribe({
        next: (created) => {
          // Le backend ne renvoie pas `deploiements` à la création (aucun `include`
          // sur cette route) : le normaliser à vide plutôt que de casser le rendu.
          this.components = [...this.components, { ...created, deploiements: created.deploiements ?? [] }];
          this.pendingCreate = null;
          this.render();
          this.toast.success('Composant ajouté.');
          this.changed.emit();
        },
        error: () => this.toast.error("Impossible d'ajouter ce composant."),
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
