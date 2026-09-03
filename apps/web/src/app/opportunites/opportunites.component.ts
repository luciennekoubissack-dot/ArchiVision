import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../auth/auth.service';
import {
  CreateSolutionPayload,
  DomaineEcart,
  GapLinkItem,
  ScoreItem,
  Solution,
  SolutionService,
  StatutSolution,
  UpdateSolutionPayload,
} from './solution.service';
import { CritereEvaluation, CritereEvaluationService } from './critere-evaluation.service';
import { ToastService } from '../shared/toast.service';
import { ConfirmDialogService } from '../shared/confirm-dialog.service';
import { PaginationComponent } from '../shared/pagination.component';
import { DEFAULT_PAGE_SIZE } from '../shared/pagination.interface';
import { DomainTab, DOMAIN_LABEL, DOMAIN_TO_DOMAINE_ECART, GapAnalysisService, GapRow } from '../ecarts/gap-analysis.service';

Chart.register(...registerables);

type Tab = 'solutions' | 'matrice';

interface SolutionDraft {
  nom: string;
  description?: string;
  statut?: StatutSolution;
  planMiseOeuvre?: string;
}

const STATUT_LABEL: Record<StatutSolution, string> = { PROPOSEE: 'Proposée', RETENUE: 'Retenue', REJETEE: 'Rejetée' };
const STATUT_BADGE: Record<StatutSolution, string> = { PROPOSEE: 'badge-neutral', RETENUE: 'badge-success', REJETEE: 'badge-danger' };
const STATUTS: StatutSolution[] = ['PROPOSEE', 'RETENUE', 'REJETEE'];
const SCORES = [0, 1, 2, 3, 4, 5];

const GAP_DOMAINS: DomainTab[] = ['objectifs', 'metier', 'donnees', 'applicatif', 'technologique'];

const DOMAINE_ECART_LABEL: Record<DomaineEcart, string> = {
  OBJECTIF: 'Objectifs',
  METIER: 'Architecture métier',
  DONNEES: 'Données',
  APPLICATIF: 'Applicatif',
  TECHNOLOGIQUE: 'Technologique',
};

/** Un élément sélectionnable dans le sélecteur d'écarts : le nœud principal d'une ligne de la matrice TOGAF (le TO-BE visé, ou l'AS-IS seul pour un écart « Éliminé »). */
interface GapCandidate {
  elementId: string;
  elementNom: string;
  etat: GapRow['etat'];
  contextLabel: string;
}

const ICONS: Record<string, string> = {
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash:
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
};

@Component({
  selector: 'app-opportunites',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  template: `
    <p class="muted step-question">Quelles solutions candidates peuvent combler les écarts identifiés, et comment se comparent-elles ?</p>

    <div class="tabs">
      <button class="tab" [class.active]="tab === 'solutions'" (click)="selectTab('solutions')">Solutions</button>
      <button class="tab" [class.active]="tab === 'matrice'" (click)="selectTab('matrice')">Matrice d'évaluation</button>
    </div>

    <!-- ── Solutions ─────────────────────────────────────────────────────── -->
    <section *ngIf="tab === 'solutions'">
      <div class="page-header">
        <h3>Solutions ({{ solutionsTotal }})</h3>
        <button type="button" class="btn btn-primary" *ngIf="canWrite" (click)="openCreate()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
          Ajouter une solution
        </button>
      </div>
      <p class="hint" *ngIf="!canWrite">Lecture seule — seuls les rôles Administrateur et Architecte peuvent modifier les solutions.</p>

      <section class="card">
        <div class="empty-state" *ngIf="solutions.length === 0">Aucune solution proposée pour l'instant.</div>
        <div class="table-scroll" *ngIf="solutions.length > 0">
          <table class="table">
            <thead><tr><th>Nom</th><th>Statut</th><th>Note moyenne</th><th>Écarts adressés</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let solution of solutions">
                <td>{{ solution.nom }}</td>
                <td><span class="badge" [class]="statutBadge(solution.statut)">{{ statutLabel(solution.statut) }}</span></td>
                <td>{{ noteMoyenne(solution) ?? '—' }}</td>
                <td>{{ solution.gaps.length }}</td>
                <td class="row-actions">
                  <button type="button" class="icon-btn icon-btn-view" title="Consulter" (click)="openView(solution)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('eye')"></svg>
                  </button>
                  <ng-container *ngIf="canWrite">
                    <button type="button" class="icon-btn icon-btn-edit" title="Écarts adressés" (click)="openGaps(solution)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('link')"></svg>
                    </button>
                    <button type="button" class="icon-btn icon-btn-edit" title="Modifier" (click)="openEdit(solution)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('edit')"></svg>
                    </button>
                    <button type="button" class="icon-btn icon-btn-danger" title="Supprimer" (click)="removeSolution(solution)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('trash')"></svg>
                    </button>
                  </ng-container>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-pagination [page]="solutionsPage" [total]="solutionsTotal" [pageSize]="solutionsPageSize" (pageChange)="onSolutionsPageChange($event)" />
      </section>
    </section>

    <!-- ── Popover : ajouter une solution ────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="createPopover" (click)="closeCreate()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="createSolution($event)">
        <div class="popover-head">
          <h3>Ajouter une solution</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeCreate()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <label class="field">Nom<input type="text" [value]="newSolution.nom" (input)="newSolution.nom = $any($event.target).value" required /></label>
        <label class="field">Description<textarea [value]="newSolution.description || ''" (input)="newSolution.description = $any($event.target).value"></textarea></label>
        <label class="field">
          Statut
          <select [value]="newSolution.statut || 'PROPOSEE'" (change)="newSolution.statut = $any($event.target).value">
            <option *ngFor="let s of statuts" [value]="s">{{ statutLabel(s) }}</option>
          </select>
        </label>
        <label class="field">Plan de mise en œuvre<textarea placeholder="Étapes envisagées pour déployer cette solution" [value]="newSolution.planMiseOeuvre || ''" (input)="newSolution.planMiseOeuvre = $any($event.target).value"></textarea></label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCreate()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creating">{{ creating ? 'Création…' : 'Créer la solution' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Popover : consulter une solution ──────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="viewTarget as s" (click)="closeView()">
      <div class="popover-card" (click)="$event.stopPropagation()">
        <div class="popover-head">
          <h3>Fiche solution</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeView()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <dl class="fiche-list">
          <dt>Nom</dt><dd>{{ s.nom }}</dd>
          <dt>Description</dt><dd>{{ s.description || '—' }}</dd>
          <dt>Statut</dt><dd>{{ statutLabel(s.statut) }}</dd>
          <dt>Note moyenne</dt><dd>{{ noteMoyenne(s) ?? '—' }}</dd>
          <dt>Plan de mise en œuvre</dt><dd>{{ s.planMiseOeuvre || '—' }}</dd>
          <dt>Écarts adressés</dt>
          <dd>
            <span *ngIf="!s.gaps?.length">—</span>
            <ul class="chip-list" *ngIf="s.gaps?.length">
              <li class="chip" *ngFor="let g of s.gaps">{{ domaineLabel(g.domaine) }} : {{ g.elementNom }}</li>
            </ul>
          </dd>
        </dl>
      </div>
    </div>

    <!-- ── Popover : écarts adressés par une solution ────────────────────── -->
    <div class="popover-backdrop" *ngIf="gapsPopoverTarget as gs" (click)="closeGaps()">
      <div class="popover-card popover-card-wide" (click)="$event.stopPropagation()">
        <div class="popover-head">
          <h3>Écarts adressés par « {{ gs.nom }} »</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeGaps()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <p class="hint">Sélectionnez les écarts de la matrice TOGAF (Analyse des écarts) que cette solution adresse.</p>
        <div class="tabs">
          <button type="button" class="tab" *ngFor="let d of gapsDomains" [class.active]="gapsDomain === d" (click)="selectGapsDomain(d)">{{ domainLabelFor(d) }}</button>
        </div>
        <div class="gap-picker">
          <p class="hint" *ngIf="gapsLoadingDomain">Chargement…</p>
          <p class="empty-state" *ngIf="!gapsLoadingDomain && gapsCandidates.length === 0">Aucun écart dans ce domaine.</p>
          <label class="gap-candidate" *ngFor="let c of gapsCandidates; trackBy: trackByElementId">
            <input type="checkbox" [checked]="isGapSelected(gapsDomain, c.elementId)" (change)="toggleGap(gapsDomain, c)" />
            <span class="gap-candidate-label">{{ c.contextLabel }}</span>
            <span class="badge badge-neutral">{{ c.etat }}</span>
          </label>
        </div>
        <p class="hint" *ngIf="draftGaps.length > 0">{{ draftGaps.length }} écart(s) sélectionné(s) au total, tous domaines confondus.</p>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeGaps()">Annuler</button>
          <button type="button" class="btn btn-success" [disabled]="gapsSaving" (click)="saveGaps()">{{ gapsSaving ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </div>
    </div>

    <!-- ── Popover : modifier une solution ───────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="editTarget && editDraft as draft" (click)="closeEdit()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="saveEdit($event)">
        <div class="popover-head">
          <h3>Modifier « {{ editTarget.nom }} »</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeEdit()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <label class="field">Nom<input type="text" [value]="draft.nom" (input)="draft.nom = $any($event.target).value" required /></label>
        <label class="field">Description<textarea [value]="draft.description || ''" (input)="draft.description = $any($event.target).value"></textarea></label>
        <label class="field">
          Statut
          <select [value]="draft.statut || 'PROPOSEE'" (change)="draft.statut = $any($event.target).value">
            <option *ngFor="let s of statuts" [value]="s">{{ statutLabel(s) }}</option>
          </select>
        </label>
        <label class="field">Plan de mise en œuvre<textarea [value]="draft.planMiseOeuvre || ''" (input)="draft.planMiseOeuvre = $any($event.target).value"></textarea></label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeEdit()">Annuler</button>
          <button type="submit" class="btn btn-success" [disabled]="saving">{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Matrice d'évaluation ──────────────────────────────────────────── -->
    <section *ngIf="tab === 'matrice'">
      <div class="page-header">
        <h3>Critères d'évaluation ({{ criteres.length }})</h3>
        <button type="button" class="btn btn-outline" *ngIf="canWrite" (click)="openCritereCreate()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
          Ajouter un critère
        </button>
      </div>

      <section class="card">
        <div class="empty-state" *ngIf="criteres.length === 0">Aucun critère défini — ajoutez-en pour construire la matrice.</div>
        <ul class="chip-list" *ngIf="criteres.length > 0">
          <li class="chip" *ngFor="let critere of criteres">
            {{ critere.nom }}
            <button type="button" class="chip-remove" *ngIf="canWrite" title="Supprimer" (click)="removeCritere(critere)">×</button>
          </li>
        </ul>
      </section>

      <section class="card" *ngIf="solutionsAll.length > 0 && criteres.length > 0">
        <h3>Matrice</h3>
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th>Solution</th>
                <th *ngFor="let critere of criteres">{{ critere.nom }}</th>
                <th>Moyenne</th>
                <th *ngIf="canWrite"></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let solution of solutionsAll">
                <td>{{ solution.nom }}</td>
                <td *ngFor="let critere of criteres">
                  <select
                    [disabled]="!canWrite"
                    [value]="cellValue(solution, critere) ?? ''"
                    (change)="onCellChange(solution, critere, $any($event.target).value)"
                  >
                    <option value="">—</option>
                    <option *ngFor="let n of scores" [value]="n">{{ n }}</option>
                  </select>
                </td>
                <td>{{ noteMoyenne(solution) ?? '—' }}</td>
                <td *ngIf="canWrite">
                  <button type="button" class="btn btn-ghost" [disabled]="savingRow[solution.id]" (click)="saveRow(solution)">
                    {{ savingRow[solution.id] ? 'Enregistrement…' : 'Enregistrer' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card" *ngIf="solutionsAll.length > 0">
        <h3>Comparaison des notes moyennes</h3>
        <div class="chart-container"><canvas #scoresChart></canvas></div>
      </section>
    </section>

    <!-- ── Popover : ajouter un critère ──────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="critereCreatePopover" (click)="closeCritereCreate()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="createCritere($event)">
        <div class="popover-head">
          <h3>Ajouter un critère</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeCritereCreate()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <label class="field">Nom<input type="text" [value]="newCritere.nom" (input)="newCritere.nom = $any($event.target).value" required /></label>
        <label class="field">Description<textarea [value]="newCritere.description || ''" (input)="newCritere.description = $any($event.target).value"></textarea></label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCritereCreate()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creatingCritere">{{ creatingCritere ? 'Création…' : 'Créer le critère' }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .muted { color: var(--color-text-muted); margin-top: 0.25rem; font-size: 0.9rem; }
      .step-question { margin-bottom: 1rem; }
      .hint { color: var(--color-text-muted); margin: -0.75rem 0 1.5rem; font-size: 0.9rem; }
      .card { margin-bottom: 1.25rem; }
      .table-scroll { overflow-x: auto; }
      .table { width: 100%; min-width: 560px; border-collapse: collapse; }
      .table th, .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); }
      .table select { padding: 0.35rem 0.5rem; border: 1px solid var(--color-border); border-radius: 8px; font: inherit; }
      .row-actions { display: flex; gap: 0.4rem; white-space: nowrap; }
      .chip-list { list-style: none; display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0; margin: 0; }
      .chip { display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.7rem; border: 1px solid var(--color-border); border-radius: 999px; font-size: 0.9rem; }
      .chip-remove { border: none; background: none; cursor: pointer; font-size: 1rem; line-height: 1; color: var(--color-text-muted); }
      .chip-remove:hover { color: var(--color-danger); }
      .chart-container { position: relative; height: 260px; }
      .popover-card-wide { max-width: 640px; width: 100%; }
      .gap-picker { max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; margin: 0.75rem 0; }
      .gap-candidate { display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 0.6rem; border: 1px solid var(--color-border); border-radius: 8px; cursor: pointer; }
      .gap-candidate-label { flex: 1; }
    `,
  ],
})
export class OpportunitesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scoresChart') scoresChartRef?: ElementRef<HTMLCanvasElement>;

  tab: Tab = 'solutions';
  statuts = STATUTS;
  scores = SCORES;

  solutions: Solution[] = [];
  solutionsPage = 1;
  solutionsTotal = 0;
  solutionsPageSize = DEFAULT_PAGE_SIZE;
  /** Toutes les solutions, sans pagination : lignes de la matrice et graphique de comparaison. */
  solutionsAll: Solution[] = [];
  criteres: CritereEvaluation[] = [];
  matrixValues: Record<string, Record<string, number>> = {};
  savingRow: Record<string, boolean> = {};

  creating = false;
  createPopover = false;
  newSolution: SolutionDraft = { nom: '', statut: 'PROPOSEE' };

  viewTarget: Solution | null = null;

  editTarget: Solution | null = null;
  editDraft: SolutionDraft | null = null;
  saving = false;

  creatingCritere = false;
  critereCreatePopover = false;
  newCritere: { nom: string; description?: string } = { nom: '' };

  gapsPopoverTarget: Solution | null = null;
  gapsDomains = GAP_DOMAINS;
  gapsDomain: DomainTab = 'objectifs';
  gapsRowsByDomain: Partial<Record<DomainTab, GapRow[]>> = {};
  gapsCandidates: GapCandidate[] = [];
  gapsLoadingDomain = false;
  draftGaps: GapLinkItem[] = [];
  gapsSaving = false;

  private viewReady = false;
  private chart?: Chart;

  constructor(
    private auth: AuthService,
    private solutionService: SolutionService,
    private critereService: CritereEvaluationService,
    private gapAnalysisService: GapAnalysisService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private sanitizer: DomSanitizer,
  ) {}

  get canWrite(): boolean {
    return this.auth.hasRole('ADMINISTRATEUR', 'ARCHITECTE');
  }

  ngOnInit(): void {
    this.critereService.list().subscribe({
      next: (criteres) => (this.criteres = criteres),
      error: () => this.toast.error('Impossible de charger les critères.'),
    });
    this.loadSolutions();
    this.loadSolutionsAll();
  }

  private loadSolutions(): void {
    this.solutionService.listPaginated(this.solutionsPage, this.solutionsPageSize).subscribe({
      next: (result) => {
        this.solutions = result.items;
        this.solutionsTotal = result.total;
      },
      error: () => this.toast.error('Impossible de charger les solutions.'),
    });
  }

  private loadSolutionsAll(): void {
    this.solutionService.list().subscribe({
      next: (solutions) => {
        this.solutionsAll = solutions;
        solutions.forEach((s) => this.initMatrixRow(s));
        this.renderChart();
      },
      error: () => this.toast.error('Impossible de charger les solutions.'),
    });
  }

  onSolutionsPageChange(page: number): void {
    this.solutionsPage = page;
    this.loadSolutions();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  icon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] ?? '');
  }

  selectTab(tab: Tab): void {
    this.tab = tab;
    if (tab === 'matrice') setTimeout(() => this.renderChart());
  }

  statutLabel(s: StatutSolution): string {
    return STATUT_LABEL[s];
  }
  statutBadge(s: StatutSolution): string {
    return STATUT_BADGE[s];
  }

  noteMoyenne(solution: Solution): number | null {
    if (!solution.scores.length) return null;
    const somme = solution.scores.reduce((acc, s) => acc + s.score, 0);
    return Math.round((somme / solution.scores.length) * 10) / 10;
  }

  domaineLabel(d: DomaineEcart): string {
    return DOMAINE_ECART_LABEL[d];
  }

  domainLabelFor(d: DomainTab): string {
    return DOMAIN_LABEL[d];
  }

  // ── Solutions ────────────────────────────────────────────────────────────

  openCreate(): void {
    this.newSolution = { nom: '', statut: 'PROPOSEE' };
    this.createPopover = true;
  }

  closeCreate(): void {
    this.createPopover = false;
  }

  createSolution(event: Event): void {
    event.preventDefault();
    if (!this.newSolution.nom.trim()) return;
    this.creating = true;
    const payload: CreateSolutionPayload = { ...this.newSolution };
    this.solutionService.create(payload).subscribe({
      next: () => {
        this.creating = false;
        this.closeCreate();
        this.toast.success('Solution créée.');
        this.loadSolutions();
        this.loadSolutionsAll();
      },
      error: () => {
        this.creating = false;
        this.toast.error('Impossible de créer cette solution.');
      },
    });
  }

  openView(solution: Solution): void {
    this.viewTarget = solution;
  }

  closeView(): void {
    this.viewTarget = null;
  }

  openEdit(solution: Solution): void {
    this.editTarget = solution;
    this.editDraft = {
      nom: solution.nom,
      description: solution.description ?? '',
      statut: solution.statut,
      planMiseOeuvre: solution.planMiseOeuvre ?? '',
    };
  }

  closeEdit(): void {
    this.editTarget = null;
    this.editDraft = null;
  }

  saveEdit(event: Event): void {
    event.preventDefault();
    if (!this.editTarget || !this.editDraft || !this.editDraft.nom.trim()) return;
    this.saving = true;
    const payload: UpdateSolutionPayload = this.editDraft;
    this.solutionService.update(this.editTarget.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeEdit();
        this.toast.success('Solution modifiée.');
        this.loadSolutions();
        this.loadSolutionsAll();
      },
      error: () => {
        this.saving = false;
        this.toast.error('Impossible de modifier cette solution.');
      },
    });
  }

  async removeSolution(solution: Solution): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Supprimer la solution « ${solution.nom} » ?`);
    if (!confirmed) return;
    this.solutionService.delete(solution.id).subscribe({
      next: () => {
        delete this.matrixValues[solution.id];
        this.toast.success('Solution supprimée.');
        this.loadSolutions();
        this.loadSolutionsAll();
      },
      error: () => this.toast.error('Impossible de supprimer cette solution.'),
    });
  }

  // ── Écarts adressés ──────────────────────────────────────────────────────

  openGaps(solution: Solution): void {
    this.gapsPopoverTarget = solution;
    this.draftGaps = (solution.gaps ?? []).map((g) => ({ domaine: g.domaine, elementId: g.elementId, elementNom: g.elementNom }));
    this.gapsRowsByDomain = {};
    this.gapsCandidates = [];
    this.selectGapsDomain('objectifs');
  }

  closeGaps(): void {
    this.gapsPopoverTarget = null;
  }

  selectGapsDomain(domain: DomainTab): void {
    this.gapsDomain = domain;
    const cached = this.gapsRowsByDomain[domain];
    if (cached) {
      this.gapsCandidates = this.buildCandidates(cached);
      return;
    }
    this.gapsLoadingDomain = true;
    this.gapsCandidates = [];
    this.gapAnalysisService.rowsFor(domain).subscribe({
      next: (rows) => {
        this.gapsRowsByDomain[domain] = rows;
        this.gapsLoadingDomain = false;
        if (this.gapsDomain === domain) this.gapsCandidates = this.buildCandidates(rows);
      },
      error: () => {
        this.gapsLoadingDomain = false;
        this.toast.error(`Impossible de charger le domaine « ${DOMAIN_LABEL[domain]} ».`);
      },
    });
  }

  private buildCandidates(rows: GapRow[]): GapCandidate[] {
    const candidates: GapCandidate[] = [];
    for (const row of rows) {
      if (row.toBe.length > 0) {
        for (const item of row.toBe) {
          candidates.push({
            elementId: item.id,
            elementNom: item.nom,
            etat: row.etat,
            contextLabel: row.asIs ? `${row.asIs.nom} → ${item.nom}` : item.nom,
          });
        }
      } else if (row.asIs) {
        candidates.push({ elementId: row.asIs.id, elementNom: row.asIs.nom, etat: row.etat, contextLabel: row.asIs.nom });
      }
    }
    return candidates;
  }

  trackByElementId(_index: number, candidate: GapCandidate): string {
    return candidate.elementId;
  }

  isGapSelected(domain: DomainTab, elementId: string): boolean {
    const domaine = DOMAIN_TO_DOMAINE_ECART[domain];
    return this.draftGaps.some((g) => g.domaine === domaine && g.elementId === elementId);
  }

  toggleGap(domain: DomainTab, candidate: GapCandidate): void {
    const domaine = DOMAIN_TO_DOMAINE_ECART[domain];
    const idx = this.draftGaps.findIndex((g) => g.domaine === domaine && g.elementId === candidate.elementId);
    if (idx >= 0) this.draftGaps.splice(idx, 1);
    else this.draftGaps.push({ domaine, elementId: candidate.elementId, elementNom: candidate.elementNom });
  }

  saveGaps(): void {
    if (!this.gapsPopoverTarget) return;
    this.gapsSaving = true;
    this.solutionService.updateGaps(this.gapsPopoverTarget.id, this.draftGaps).subscribe({
      next: () => {
        this.gapsSaving = false;
        this.toast.success('Écarts adressés mis à jour.');
        this.closeGaps();
        this.loadSolutions();
        this.loadSolutionsAll();
      },
      error: () => {
        this.gapsSaving = false;
        this.toast.error("Impossible d'enregistrer les écarts adressés.");
      },
    });
  }

  // ── Critères ─────────────────────────────────────────────────────────────

  openCritereCreate(): void {
    this.newCritere = { nom: '' };
    this.critereCreatePopover = true;
  }

  closeCritereCreate(): void {
    this.critereCreatePopover = false;
  }

  createCritere(event: Event): void {
    event.preventDefault();
    if (!this.newCritere.nom.trim()) return;
    this.creatingCritere = true;
    this.critereService.create(this.newCritere).subscribe({
      next: (critere) => {
        this.criteres = [...this.criteres, critere];
        this.creatingCritere = false;
        this.closeCritereCreate();
        this.toast.success('Critère créé.');
      },
      error: () => {
        this.creatingCritere = false;
        this.toast.error('Impossible de créer ce critère.');
      },
    });
  }

  async removeCritere(critere: CritereEvaluation): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Supprimer le critère « ${critere.nom} » ? Les notes associées seront perdues.`);
    if (!confirmed) return;
    this.critereService.delete(critere.id).subscribe({
      next: () => {
        this.criteres = this.criteres.filter((c) => c.id !== critere.id);
        this.toast.success('Critère supprimé.');
      },
      error: () => this.toast.error('Impossible de supprimer ce critère.'),
    });
  }

  // ── Matrice ──────────────────────────────────────────────────────────────

  private initMatrixRow(solution: Solution): void {
    const row: Record<string, number> = {};
    solution.scores.forEach((s) => (row[s.critereId] = s.score));
    this.matrixValues[solution.id] = row;
  }

  cellValue(solution: Solution, critere: CritereEvaluation): number | null {
    return this.matrixValues[solution.id]?.[critere.id] ?? null;
  }

  onCellChange(solution: Solution, critere: CritereEvaluation, value: string): void {
    const row = this.matrixValues[solution.id] ?? (this.matrixValues[solution.id] = {});
    if (value === '') delete row[critere.id];
    else row[critere.id] = Number(value);
  }

  saveRow(solution: Solution): void {
    const row = this.matrixValues[solution.id] ?? {};
    const items: ScoreItem[] = this.criteres
      .filter((c) => row[c.id] !== undefined)
      .map((c) => ({ critereId: c.id, score: row[c.id] }));
    if (items.length === 0) return;

    this.savingRow[solution.id] = true;
    this.solutionService.updateScores(solution.id, items).subscribe({
      next: () => {
        this.savingRow[solution.id] = false;
        this.toast.success('Notes enregistrées.');
        this.loadSolutions();
        this.loadSolutionsAll();
      },
      error: () => {
        this.savingRow[solution.id] = false;
        this.toast.error("Impossible d'enregistrer les notes.");
      },
    });
  }

  // ── Graphique ────────────────────────────────────────────────────────────

  private renderChart(): void {
    if (!this.viewReady || !this.scoresChartRef || this.solutionsAll.length === 0) return;
    this.chart?.destroy();

    // responsive:true fait entrer ce canevas dans une boucle de redimensionnement
    // infinie sur cet onglet précis (fige le navigateur) ; on fixe donc la taille
    // une fois à la création plutôt que de la laisser se recalculer en continu.
    const canvas = this.scoresChartRef.nativeElement;
    canvas.width = canvas.parentElement?.clientWidth || 600;
    canvas.height = 260;

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.solutionsAll.map((s) => s.nom),
        datasets: [
          {
            data: this.solutionsAll.map((s) => this.noteMoyenne(s) ?? 0),
            backgroundColor: '#3b5bdb',
            borderRadius: 8,
            maxBarThickness: 56,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        plugins: { legend: { display: false } },
      },
    });
  }
}
