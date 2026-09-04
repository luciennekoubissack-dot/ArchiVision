import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BpmnElement, BpmnProcessus, BpmnService, TypeBpmn, TypeProcessus } from '../vision/bpmn.service';
import { DomainTab, DOMAIN_LABEL, DOMAIN_TO_DOMAINE_ECART, EtatGap, GapAnalysisService, GapRow } from './gap-analysis.service';
import { SolutionGap, SolutionService } from '../opportunites/solution.service';
import { ObjectifService } from '../organisation/objectif.service';
import { ObjectifProgressionItemEntity, ProcessusProgressionEntity } from '../api-client/models/processus-progression-entity';
import { ToastService } from '../shared/toast.service';

type MainTab = 'processus' | DomainTab;

interface GapDomainState {
  loaded: boolean;
  rows: GapRow[];
  conserves: GapRow[];
  elimines: GapRow[];
  modifies: GapRow[];
  nouveaux: GapRow[];
  realises: GapRow[];
}

function emptyGapState(): GapDomainState {
  return { loaded: false, rows: [], conserves: [], elimines: [], modifies: [], nouveaux: [], realises: [] };
}

const DOMAIN_EMPTY_MESSAGE: Record<DomainTab, string> = {
  objectifs: "Aucun objectif défini. Rendez-vous dans Préparation de l'organisation pour en ajouter.",
  metier: 'Aucun élément ArchiMate défini. Rendez-vous dans Architecture métier pour en ajouter.',
  donnees: 'Aucune entité de données définie. Rendez-vous dans Architecture des données pour en ajouter.',
  applicatif: 'Aucune application définie. Rendez-vous dans Architecture Système pour en ajouter.',
  technologique: 'Aucun composant technologique défini. Rendez-vous dans Architecture technologique pour en ajouter.',
};

const TYPE_PROCESSUS_ORDER: TypeProcessus[] = ['PILOTAGE', 'METIER', 'SUPPORT'];
const TYPE_PROCESSUS_LABEL: Record<TypeProcessus, string> = {
  PILOTAGE: 'Processus de pilotage',
  METIER: 'Processus métier',
  SUPPORT: 'Processus support',
};

const TYPE_BPMN_LABEL: Record<TypeBpmn, string> = {
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

interface GapElement extends BpmnElement {
  exclusive: boolean;
}

@Component({
  selector: 'app-ecarts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p class="muted step-question">
      Une fois les objectifs connus et les processus décrits, quels écarts existent entre l'état actuel
      (AS-IS) et la cible souhaitée (TO-BE) ? Cette analyse compare ce qui doit disparaître, apparaître ou
      rester inchangé, domaine par domaine.
    </p>

    <div class="tabs">
      <button class="tab" [class.active]="mainTab === 'processus'" (click)="mainTab = 'processus'">Processus</button>
      <button class="tab" [class.active]="mainTab === 'objectifs'" (click)="selectDomain('objectifs')">Objectifs</button>
      <button class="tab" [class.active]="mainTab === 'metier'" (click)="selectDomain('metier')">Architecture métier</button>
      <button class="tab" [class.active]="mainTab === 'donnees'" (click)="selectDomain('donnees')">Données</button>
      <button class="tab" [class.active]="mainTab === 'applicatif'" (click)="selectDomain('applicatif')">Applicatif</button>
      <button class="tab" [class.active]="mainTab === 'technologique'" (click)="selectDomain('technologique')">Technologique</button>
    </div>

    <!-- ── Domaines architecturaux ───────────────────────────────────────── -->
    <section *ngIf="mainTab !== 'processus'">
      <div class="summary">
        <div class="stat">
          <span class="stat-value">{{ currentDomain.conserves.length }}</span>
          <span class="stat-label">Conservés</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ currentDomain.elimines.length }}</span>
          <span class="stat-label">Éliminés</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ currentDomain.modifies.length }}</span>
          <span class="stat-label">Modifiés</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ currentDomain.nouveaux.length }}</span>
          <span class="stat-label">Nouveaux</span>
        </div>
        <div class="stat stat-success">
          <span class="stat-value">{{ currentDomain.realises.length }}</span>
          <span class="stat-label">Réalisés</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ nonAdressesCount }}</span>
          <span class="stat-label">Non adressés</span>
        </div>
      </div>

      <div class="empty-state" *ngIf="!currentDomain.loaded">Chargement…</div>
      <div class="empty-state" *ngIf="currentDomain.loaded && currentDomain.rows.length === 0">
        {{ emptyMessage }}
      </div>

      <section class="card" *ngIf="currentDomain.loaded && currentDomain.rows.length > 0">
        <h3>Matrice d'écarts — {{ domainLabel }}</h3>
        <p class="muted hint">
          Chaque ligne compare un élément de référence (Baseline, état actuel) à sa cible (Target, état
          futur). « Réalisé » signifie que toutes les solutions liées à cet écart ont l'avancement TERMINEE.
        </p>
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th>Baseline (AS-IS)</th>
                <th>Target (TO-BE)</th>
                <th>État</th>
                <th>Couverture solution</th>
                <th *ngIf="mainTab === 'objectifs'">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of currentDomain.rows">
                <td>{{ row.asIs?.nom ?? '—' }}</td>
                <td>{{ row.toBe.length > 0 ? namesOf(row.toBe) : '—' }}</td>
                <td><span class="badge" [class]="etatBadge(row.etat)">{{ row.etat }}</span></td>
                <td>
                  <span class="badge badge-success"  *ngIf="coverageOf(row) === 'realise'">Réalisé</span>
                  <span class="badge badge-primary"   *ngIf="coverageOf(row) === 'en_cours'">En cours</span>
                  <span class="badge badge-warning"   *ngIf="coverageOf(row) === 'adresse'">Adressé</span>
                  <span class="badge badge-neutral"   *ngIf="coverageOf(row) === 'non_adresse'">Non adressé</span>
                </td>
                <td *ngIf="mainTab === 'objectifs'">
                  <button
                    *ngIf="row.asIs && row.etat !== 'Conservé' && row.etat !== 'Réalisé' && canMarquerAtteint(row)"
                    class="btn btn-sm btn-success"
                    [disabled]="marquerEnCours === row.asIs!.id"
                    (click)="marquerAtteint(row)"
                    title="Toutes les solutions liées sont TERMINEE : marquer cet objectif comme atteint."
                  >
                    {{ marquerEnCours === row.asIs!.id ? 'Mise à jour…' : 'Marquer atteint' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <!-- ── Onglet Processus ──────────────────────────────────────────────── -->
    <div class="layout" *ngIf="mainTab === 'processus'">
      <section class="card processus-list">
        <h3>Processus ({{ processus.length }})</h3>
        <div class="empty-state" *ngIf="processus.length === 0">Aucun processus défini.</div>
        <div class="processus-groupe" *ngFor="let t of typesProcessus">
          <ng-container *ngIf="processusParType(t).length > 0">
            <h4>{{ typeProcessusLabel(t) }}</h4>
            <div class="table-scroll">
              <table class="table">
                <tbody>
                  <tr
                    *ngFor="let p of processusParType(t)"
                    [class.selected]="selected?.id === p.id"
                    (click)="select(p)"
                  >
                    <td>
                      {{ p.nom }}
                      <span class="badge badge-muted" *ngIf="(p.objectifs?.length ?? 0) > 0">
                        {{ p.objectifs!.length }} objectif{{ p.objectifs!.length > 1 ? 's' : '' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-container>
        </div>
      </section>

      <section class="card ecart-detail" *ngIf="selected">
        <h3>{{ selected.nom }}</h3>

        <!-- Barre de progression du processus -->
        <div class="progression-block" *ngIf="progression">
          <div class="progression-header">
            <span class="progression-label">Taux de transition AS-IS vers TO-BE</span>
            <span class="progression-pct">{{ progression.tauxTransition }}%</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" [style.width.%]="progression.tauxTransition"></div>
          </div>
          <div class="progression-stats">
            <span>{{ progression.elementsAsIs }} à faire évoluer</span>
            <span>{{ progression.elementsInchanges }} inchangés</span>
            <span>{{ progression.elementsToBe }} nouveaux</span>
          </div>
        </div>

        <!-- Compteurs éléments -->
        <div class="summary" *ngIf="loadedElements">
          <div class="stat">
            <span class="stat-value">{{ onlyAsIs.length }}</span>
            <span class="stat-label">À faire évoluer</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ common.length }}</span>
            <span class="stat-label">Inchangés</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ onlyToBe.length }}</span>
            <span class="stat-label">Nouveaux</span>
          </div>
        </div>

        <!-- Objectifs visés avec progression -->
        <div class="objectifs-vises" *ngIf="progression && progression.objectifs.length > 0">
          <h4>Objectifs stratégiques visés</h4>
          <div class="objectif-progress-row" *ngFor="let obj of progression.objectifs">
            <div class="obj-header">
              <span class="obj-nom">{{ obj.nom }}</span>
              <span class="badge badge-neutral">{{ obj.statut }}</span>
              <span class="badge badge-success" *ngIf="obj.peutEtreMarqueAtteint">Peut être marqué atteint</span>
            </div>
            <div class="obj-solutions">
              <span class="solution-count">
                {{ obj.solutionsTerminees }}/{{ obj.solutionsTotal }} solution{{ obj.solutionsTotal !== 1 ? 's' : '' }} terminée{{ obj.solutionsTerminees !== 1 ? 's' : '' }}
              </span>
              <div class="progress-bar-track progress-bar-sm">
                <div
                  class="progress-bar-fill"
                  [class.progress-complete]="obj.solutionsTotal > 0 && obj.solutionsTerminees === obj.solutionsTotal"
                  [style.width.%]="obj.solutionsTotal > 0 ? (obj.solutionsTerminees / obj.solutionsTotal) * 100 : 0"
                ></div>
              </div>
              <button
                *ngIf="obj.peutEtreMarqueAtteint"
                class="btn btn-sm btn-success"
                [disabled]="marquerEnCours === obj.id"
                (click)="marquerAtteintById(obj)"
              >
                {{ marquerEnCours === obj.id ? 'Mise à jour…' : 'Marquer atteint' }}
              </button>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="loadedElements && asIs.length === 0 && toBe.length === 0">
          Aucune étape renseignée pour ce processus. Rendez-vous dans Procédure pour construire son diagramme.
        </div>

        <div class="compare-grid" *ngIf="loadedElements && (asIs.length > 0 || toBe.length > 0)">
          <div class="compare-col">
            <h4>État actuel — AS-IS</h4>
            <div class="empty-state" *ngIf="asIs.length === 0">Rien renseigné en AS-IS.</div>
            <ul class="list" *ngIf="asIs.length > 0">
              <li class="list-item" *ngFor="let el of asIs">
                <div>
                  <strong>{{ el.nom }}</strong>
                  <span class="badge badge-neutral">{{ typeLabel(el.type) }}</span>
                </div>
                <span class="badge badge-warning" *ngIf="el.exclusive">À faire évoluer</span>
              </li>
            </ul>
          </div>
          <div class="compare-col">
            <h4>Cible — TO-BE</h4>
            <div class="empty-state" *ngIf="toBe.length === 0">Rien renseigné en TO-BE.</div>
            <ul class="list" *ngIf="toBe.length > 0">
              <li class="list-item" *ngFor="let el of toBe">
                <div>
                  <strong>{{ el.nom }}</strong>
                  <span class="badge badge-neutral">{{ typeLabel(el.type) }}</span>
                </div>
                <span class="badge badge-success" *ngIf="el.exclusive">Nouveau</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .layout { display: grid; grid-template-columns: 320px 1fr; gap: 1.25rem; align-items: start; }
      .processus-groupe { margin-bottom: 1.25rem; }
      .processus-groupe h4 { margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
      .list { list-style: none; display: grid; gap: 0.5rem; }
      .list-item { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; padding: 0.7rem 0.85rem; border: 1px solid var(--color-border); border-radius: 10px; }
      .processus-list .table-scroll { overflow-x: auto; }
      .processus-list .table { width: 100%; border-collapse: collapse; }
      .processus-list .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); }
      .processus-list .table tbody tr { cursor: pointer; }
      .processus-list .table tbody tr.selected { background: var(--color-primary-light); }

      .summary { display: flex; gap: 1rem; margin: 1rem 0 1.5rem; flex-wrap: wrap; }
      .stat { flex: 1; min-width: 110px; text-align: center; padding: 1rem; border-radius: var(--radius-lg); background: var(--color-surface); }
      .stat.stat-success { background: #f0fdf4; }
      .stat-value { display: block; font-size: 1.8rem; font-weight: 800; }
      .stat-label { display: block; color: var(--color-text-muted); font-size: 0.85rem; margin-top: 0.15rem; }

      .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
      .compare-col h4 { margin-bottom: 0.75rem; }

      .hint { color: var(--color-text-muted); font-size: 0.88rem; margin: 0 0 1rem; }
      .table-scroll { overflow-x: auto; }
      .table { width: 100%; min-width: 480px; border-collapse: collapse; }
      .table th, .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); }

      /* Barre de progression processus */
      .progression-block { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1rem; margin-bottom: 1.25rem; }
      .progression-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
      .progression-label { font-size: 0.88rem; color: var(--color-text-muted); }
      .progression-pct { font-size: 1.1rem; font-weight: 700; color: var(--color-primary); }
      .progress-bar-track { width: 100%; height: 10px; background: var(--color-border); border-radius: 999px; overflow: hidden; }
      .progress-bar-track.progress-bar-sm { height: 6px; }
      .progress-bar-fill { height: 100%; background: var(--color-primary); border-radius: 999px; transition: width 0.3s ease; }
      .progress-bar-fill.progress-complete { background: #16a34a; }
      .progression-stats { display: flex; gap: 1.25rem; margin-top: 0.5rem; font-size: 0.82rem; color: var(--color-text-muted); }

      /* Objectifs visés */
      .objectifs-vises { margin: 1.25rem 0; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1rem; }
      .objectifs-vises h4 { margin: 0 0 0.85rem; font-size: 0.9rem; }
      .objectif-progress-row { padding: 0.6rem 0; border-bottom: 1px solid var(--color-border); }
      .objectif-progress-row:last-child { border-bottom: none; }
      .obj-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; flex-wrap: wrap; }
      .obj-nom { font-weight: 600; font-size: 0.92rem; }
      .obj-solutions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
      .solution-count { font-size: 0.8rem; color: var(--color-text-muted); min-width: 140px; }
      .progress-bar-track.progress-bar-sm { flex: 1; min-width: 80px; }

      .btn-sm { padding: 0.2rem 0.6rem; font-size: 0.8rem; }
      .btn-success { background: #16a34a; color: white; border: none; border-radius: var(--radius-sm); cursor: pointer; }
      .btn-success:hover:not(:disabled) { background: #15803d; }
      .btn-success:disabled { opacity: 0.5; cursor: not-allowed; }
      .badge-muted { background: var(--color-surface); color: var(--color-text-muted); border: 1px solid var(--color-border); }
      .badge-primary { background: #dbeafe; color: #1d4ed8; }

      @media (max-width: 900px) {
        .layout { grid-template-columns: 1fr; }
        .compare-grid { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class EcartsComponent implements OnInit {
  mainTab: MainTab = 'processus';

  typesProcessus = TYPE_PROCESSUS_ORDER;
  processus: BpmnProcessus[] = [];
  selected: BpmnProcessus | null = null;

  loadedElements = false;
  progression: ProcessusProgressionEntity | null = null;
  asIs: GapElement[] = [];
  toBe: GapElement[] = [];
  onlyAsIs: GapElement[] = [];
  onlyToBe: GapElement[] = [];
  common: BpmnElement[] = [];

  marquerEnCours: string | null = null;

  domains: Record<DomainTab, GapDomainState> = {
    objectifs: emptyGapState(),
    metier: emptyGapState(),
    donnees: emptyGapState(),
    applicatif: emptyGapState(),
    technologique: emptyGapState(),
  };

  private allGaps: SolutionGap[] = [];

  constructor(
    private bpmnService: BpmnService,
    private gapAnalysisService: GapAnalysisService,
    private solutionService: SolutionService,
    private objectifService: ObjectifService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.bpmnService.list().subscribe({
      next: (processus) => (this.processus = processus),
      error: () => this.toast.error('Impossible de charger les processus.'),
    });
    this.solutionService.listGaps().subscribe({
      next: (gaps) => (this.allGaps = gaps),
      error: () => this.toast.error('Impossible de charger les écarts adressés par les solutions.'),
    });
  }

  get currentDomain(): GapDomainState {
    return this.domains[this.mainTab as DomainTab];
  }

  get domainLabel(): string {
    return DOMAIN_LABEL[this.mainTab as DomainTab];
  }

  get emptyMessage(): string {
    return DOMAIN_EMPTY_MESSAGE[this.mainTab as DomainTab];
  }

  namesOf(items: { nom: string }[]): string {
    return items.map((i) => i.nom).join(', ');
  }

  etatBadge(etat: EtatGap): string {
    const map: Record<EtatGap, string> = {
      'Conservé': 'badge-neutral',
      'Éliminé': 'badge-danger',
      'Modifié': 'badge-warning',
      'Nouveau': 'badge-success',
      'Réalisé': 'badge-success',
    };
    return map[etat] ?? 'badge-neutral';
  }

  /**
   * Retourne le niveau de couverture d'une ligne de la matrice :
   * - realise : toutes les solutions liées sont TERMINEE
   * - en_cours : au moins une solution est EN_COURS ou BLOQUE
   * - adresse : au moins une solution est liée (mais pas toutes TERMINEE)
   * - non_adresse : aucune solution liée
   */
  coverageOf(row: GapRow): 'realise' | 'en_cours' | 'adresse' | 'non_adresse' {
    const domaine = DOMAIN_TO_DOMAINE_ECART[this.mainTab as DomainTab];
    const targets = row.toBe.length > 0 ? row.toBe : row.asIs ? [row.asIs] : [];
    const solutionsLiees = targets.flatMap((t) =>
      this.allGaps.filter((g) => g.domaine === domaine && g.elementId === t.id),
    );

    if (solutionsLiees.length === 0) return 'non_adresse';

    const toutesTerminees = solutionsLiees.every((g) => g.solution.avancement === 'TERMINE');
    if (toutesTerminees) return 'realise';

    const unEnCours = solutionsLiees.some(
      (g) => g.solution.avancement === 'EN_COURS' || g.solution.avancement === 'BLOQUE',
    );
    return unEnCours ? 'en_cours' : 'adresse';
  }

  /** Vrai si cet objectif AS-IS peut être marqué atteint (toutes ses solutions sont TERMINEE). */
  canMarquerAtteint(row: GapRow): boolean {
    if (!row.asIs) return false;
    return this.coverageOf(row) === 'realise' && row.etat !== 'Conservé';
  }

  get nonAdressesCount(): number {
    return this.currentDomain.rows.filter((row) => this.coverageOf(row) === 'non_adresse').length;
  }

  selectDomain(tab: DomainTab): void {
    this.mainTab = tab;
    if (this.domains[tab].loaded) return;

    this.gapAnalysisService.rowsFor(tab).subscribe({
      next: (rows) => this.setDomainRows(tab, rows),
      error: () => this.toast.error(`Impossible de charger le domaine « ${DOMAIN_LABEL[tab]} ».`),
    });
  }

  private setDomainRows(tab: DomainTab, rawRows: GapRow[]): void {
    const domaine = DOMAIN_TO_DOMAINE_ECART[tab];
    const rows = this.gapAnalysisService.applyRealise(rawRows, this.allGaps, domaine);

    this.domains[tab] = {
      loaded: true,
      rows,
      conserves: rows.filter((r) => r.etat === 'Conservé'),
      elimines: rows.filter((r) => r.etat === 'Éliminé'),
      modifies: rows.filter((r) => r.etat === 'Modifié'),
      nouveaux: rows.filter((r) => r.etat === 'Nouveau'),
      realises: rows.filter((r) => r.etat === 'Réalisé'),
    };
  }

  typeProcessusLabel(type: TypeProcessus): string {
    return TYPE_PROCESSUS_LABEL[type];
  }

  typeLabel(type: TypeBpmn): string {
    return TYPE_BPMN_LABEL[type];
  }

  processusParType(type: TypeProcessus): BpmnProcessus[] {
    return this.processus.filter((p) => p.type === type);
  }

  select(p: BpmnProcessus): void {
    this.selected = p;
    this.loadedElements = false;
    this.progression = null;

    // Charger le détail du processus (éléments) et la progression en parallèle
    this.bpmnService.get(p.id).subscribe({
      next: (detail) => {
        const elements = detail.elements;
        this.common = elements.filter((el) => el.statut === 'LES_DEUX');
        const onlyAsIsEls = elements.filter((el) => el.statut === 'AS_IS');
        const onlyToBeEls = elements.filter((el) => el.statut === 'TO_BE');

        this.onlyAsIs = onlyAsIsEls.map((el) => ({ ...el, exclusive: true }));
        this.onlyToBe = onlyToBeEls.map((el) => ({ ...el, exclusive: true }));
        this.asIs = [...this.common.map((el) => ({ ...el, exclusive: false })), ...this.onlyAsIs];
        this.toBe = [...this.common.map((el) => ({ ...el, exclusive: false })), ...this.onlyToBe];
        this.loadedElements = true;
      },
      error: () => this.toast.error('Impossible de charger ce processus.'),
    });

    this.bpmnService.getProgression(p.id).subscribe({
      next: (prog) => (this.progression = prog),
      error: () => { /* silencieux : la progression est facultative */ },
    });
  }

  // ── Actions : marquer un objectif comme atteint ───────────────────────────

  /** Depuis la matrice des objectifs. */
  marquerAtteint(row: GapRow): void {
    if (!row.asIs) return;
    this.doMarquerAtteint(row.asIs.id, () => {
      // Recharger le domaine pour refléter le nouveau statut
      this.domains['objectifs'] = emptyGapState();
      this.selectDomain('objectifs');
    });
  }

  /** Depuis la vue processus (objectif lié). */
  marquerAtteintById(obj: ObjectifProgressionItemEntity): void {
    this.doMarquerAtteint(obj.id, () => {
      if (this.selected) this.select(this.selected);
      // Recharger aussi la matrice objectifs si elle a été chargée
      if (this.domains['objectifs'].loaded) {
        this.domains['objectifs'] = emptyGapState();
      }
    });
  }

  private doMarquerAtteint(objectifId: string, onSuccess: () => void): void {
    this.marquerEnCours = objectifId;
    this.objectifService.marquerAtteint(objectifId).subscribe({
      next: () => {
        this.marquerEnCours = null;
        this.toast.success('Objectif marqué comme atteint.');
        onSuccess();
        // Recharger les gaps pour que les compteurs se mettent à jour
        this.solutionService.listGaps().subscribe({ next: (gaps) => (this.allGaps = gaps) });
      },
      error: (err) => {
        this.marquerEnCours = null;
        this.toast.error(err?.error?.message ?? "Impossible de marquer cet objectif comme atteint.");
      },
    });
  }
}
