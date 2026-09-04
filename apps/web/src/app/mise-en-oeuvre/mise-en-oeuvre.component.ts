import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MiseEnOeuvreService, MiseEnOeuvreStats, SuiviSolution } from './mise-en-oeuvre.service';
import { AvancementSolution } from '../opportunites/solution.service';
import { Projet } from '../roadmap/roadmap.service';
import { ToastService } from '../shared/toast.service';
import { exportToExcel } from '../shared/excel.util';

type Tab = 'suivi' | 'tableau-de-bord' | 'roadmap';

const AVANCEMENT_LABEL: Record<AvancementSolution, string> = {
  NON_DEMARRE: 'Non démarré',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  BLOQUE: 'Bloqué',
};

const AVANCEMENT_BADGE: Record<AvancementSolution, string> = {
  NON_DEMARRE: 'badge-neutral',
  EN_COURS: 'badge-warning',
  TERMINE: 'badge-success',
  BLOQUE: 'badge-danger',
};

const AVANCEMENTS: AvancementSolution[] = ['NON_DEMARRE', 'EN_COURS', 'TERMINE', 'BLOQUE'];

const STATUT_PROJET_LABEL: Record<string, string> = {
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
};
const STATUT_PROJET_BADGE: Record<string, string> = {
  PLANIFIE: 'badge-neutral',
  EN_COURS: 'badge-warning',
  TERMINE: 'badge-success',
};

const ICONS: Record<string, string> = {
  download:
    '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/>',
  check:
    '<polyline points="20 6 9 17 4 12"/>',
  alert:
    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  clock:
    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  target:
    '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
};

@Component({
  selector: 'app-mise-en-oeuvre',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p class="muted step-question">
      Où en est la mise en œuvre des solutions retenues ? Quel est leur avancement et quels blocages rencontrez-vous ?
    </p>

    <div class="tabs">
      <button class="tab" [class.active]="tab === 'tableau-de-bord'" (click)="tab = 'tableau-de-bord'">Tableau de bord</button>
      <button class="tab" [class.active]="tab === 'suivi'" (click)="tab = 'suivi'">Suivi des solutions</button>
      <button class="tab" [class.active]="tab === 'roadmap'" (click)="tab = 'roadmap'">Projets associés</button>
    </div>

    <!-- ── Tableau de bord ────────────────────────────────────────────── -->
    <ng-container *ngIf="tab === 'tableau-de-bord'">
      <div class="page-header">
        <h3>Tableau de bord de mise en œuvre</h3>
        <button
          type="button"
          class="btn btn-outline"
          [disabled]="suivi.length === 0"
          (click)="exportExcel()"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
               [innerHTML]="icon('download')">
          </svg>
          Exporter (Excel)
        </button>
      </div>

      <!-- KPIs -->
      <div class="stats-grid" *ngIf="stats">
        <section class="card stat">
          <div class="stat-icon stat-icon-blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 [innerHTML]="icon('target')">
            </svg>
          </div>
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">Solutions retenues</span>
        </section>

        <section class="card stat">
          <div class="stat-icon stat-icon-yellow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 [innerHTML]="icon('clock')">
            </svg>
          </div>
          <span class="stat-value">{{ stats.enCours }}</span>
          <span class="stat-label">En cours</span>
        </section>

        <section class="card stat">
          <div class="stat-icon stat-icon-green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 [innerHTML]="icon('check')">
            </svg>
          </div>
          <span class="stat-value">{{ stats.termine }}</span>
          <span class="stat-label">Terminées</span>
        </section>

        <section class="card stat">
          <div class="stat-icon stat-icon-red">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 [innerHTML]="icon('alert')">
            </svg>
          </div>
          <span class="stat-value">{{ stats.bloque }}</span>
          <span class="stat-label">Bloquées</span>
        </section>
      </div>

      <!-- Barre de progression globale -->
      <section class="card progress-card" *ngIf="stats && stats.total > 0">
        <div class="progress-header">
          <span class="progress-label">Taux d'avancement global</span>
          <span class="progress-pct">{{ stats.tauxAvancement }}&nbsp;%</span>
        </div>
        <div class="progress-track">
          <div
            class="progress-bar"
            [style.width.%]="stats.tauxAvancement"
            [class.bar-green]="stats.tauxAvancement >= 75"
            [class.bar-yellow]="stats.tauxAvancement >= 25 && stats.tauxAvancement < 75"
            [class.bar-red]="stats.tauxAvancement < 25"
          ></div>
        </div>
        <p class="progress-detail muted">
          {{ stats.termine }} terminée(s) sur {{ stats.total }} solution(s) retenue(s)
          <span *ngIf="stats.nonDemarre > 0"> · {{ stats.nonDemarre }} non démarrée(s)</span>
          <span *ngIf="stats.bloque > 0" class="text-danger"> · {{ stats.bloque }} bloquée(s)</span>
        </p>
      </section>

      <div class="empty-state card" *ngIf="!loading && suivi.length === 0">
        Aucune solution retenue pour l'instant. Rendez-vous dans
        <strong>Opportunités &amp; solutions</strong> pour sélectionner des solutions à mettre en œuvre.
      </div>
    </ng-container>

    <!-- ── Suivi des solutions ─────────────────────────────────────────── -->
    <ng-container *ngIf="tab === 'suivi'">
      <div class="page-header">
        <h3>Suivi des solutions retenues ({{ suivi.length }})</h3>
      </div>

      <div class="empty-state card" *ngIf="!loading && suivi.length === 0">
        Aucune solution retenue. Définissez vos solutions dans le module
        <strong>Opportunités &amp; solutions</strong>.
      </div>

      <section class="card" *ngIf="suivi.length > 0">
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th>Solution</th>
                <th>Plan de mise en œuvre</th>
                <th>Avancement</th>
                <th>Commentaire de suivi</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of suivi">
                <td class="td-nom">{{ item.solution.nom }}</td>
                <td>{{ item.solution.planMiseOeuvre || '—' }}</td>
                <td class="td-avancement">
                  <span class="badge" [class]="avancementBadge(item.solution.avancement)">
                    {{ avancementLabel(item.solution.avancement) }}
                  </span>
                  <select
                    [value]="item.solution.avancement"
                    (change)="changeAvancement(item, $any($event.target).value)"
                    class="avancement-select"
                  >
                    <option *ngFor="let a of avancements" [value]="a">
                      {{ avancementLabel(a) }}
                    </option>
                  </select>
                </td>
                <td>
                  <textarea
                    class="commentaire"
                    [value]="item.solution.commentaireSuivi || ''"
                    (input)="item.solution.commentaireSuivi = $any($event.target).value"
                    (blur)="saveCommentaire(item)"
                    placeholder="Avancement, blocages, prochaines étapes…"
                    rows="2"
                  ></textarea>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </ng-container>

    <!-- ── Projets roadmap associés ───────────────────────────────────── -->
    <ng-container *ngIf="tab === 'roadmap'">
      <div class="page-header">
        <h3>Projets de la roadmap liés aux solutions</h3>
      </div>

      <div class="empty-state card" *ngIf="!loading && suivi.length === 0">
        Aucune donnée disponible.
      </div>

      <ng-container *ngFor="let item of suivi">
        <section class="card solution-card" *ngIf="item.projetsLies.length > 0">
          <div class="solution-header">
            <span class="badge" [class]="avancementBadge(item.solution.avancement)">
              {{ avancementLabel(item.solution.avancement) }}
            </span>
            <h4>{{ item.solution.nom }}</h4>
          </div>
          <div class="table-scroll">
            <table class="table table-sm">
              <thead>
                <tr><th>Projet</th><th>Statut</th><th>Priorité</th><th>Période</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of item.projetsLies">
                  <td>{{ p.nom }}</td>
                  <td>
                    <span class="badge" [class]="statutProjetBadge(p.statut)">
                      {{ statutProjetLabel(p.statut) }}
                    </span>
                  </td>
                  <td>{{ p.priorite }}</td>
                  <td>
                    <ng-container *ngIf="p.dateDebut || p.dateFin; else noPeriode">
                      {{ p.dateDebut ? (p.dateDebut | date:'dd/MM/yyyy') : '?' }}
                      → {{ p.dateFin ? (p.dateFin | date:'dd/MM/yyyy') : '?' }}
                    </ng-container>
                    <ng-template #noPeriode>—</ng-template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </ng-container>

      <!-- Solutions sans projet roadmap lié -->
      <section class="card" *ngIf="solutionsSansProjets.length > 0">
        <h4 class="sans-projets-titre">Solutions sans projet roadmap identifié</h4>
        <p class="muted sans-projets-hint">
          Ces solutions retenues n'ont pas encore de projet de migration planning associé.
          Ajoutez un projet dans le module <strong>Migration Planning</strong> avec un nom
          contenant le nom de la solution.
        </p>
        <ul class="solution-list">
          <li *ngFor="let item of solutionsSansProjets">
            <span class="badge" [class]="avancementBadge(item.solution.avancement)">
              {{ avancementLabel(item.solution.avancement) }}
            </span>
            {{ item.solution.nom }}
          </li>
        </ul>
      </section>
    </ng-container>
  `,
  styles: [`
    .muted { color: var(--color-text-muted); margin-top: 0.25rem; font-size: 0.9rem; }
    .text-danger { color: var(--color-danger); }

    /* ── KPIs ──────────────────────────────────────────────────────── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .stat {
      display: flex; flex-direction: column; align-items: center;
      gap: 0.35rem; padding: 1.5rem 1rem; text-align: center;
    }
    .stat-icon {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; margin-bottom: 0.25rem;
    }
    .stat-icon-blue  { background: #dbeafe; color: #1d4ed8; }
    .stat-icon-yellow{ background: #fef9c3; color: #b45309; }
    .stat-icon-green { background: #dcfce7; color: #15803d; }
    .stat-icon-red   { background: #fee2e2; color: #b91c1c; }
    .stat-value { font-size: 2rem; font-weight: 800; line-height: 1; }
    .stat-label { color: var(--color-text-muted); font-size: 0.88rem; }

    /* ── Barre de progression ──────────────────────────────────────── */
    .progress-card { padding: 1.25rem 1.5rem; margin-bottom: 1.25rem; }
    .progress-header {
      display: flex; justify-content: space-between; align-items: baseline;
      margin-bottom: 0.6rem;
    }
    .progress-label { font-weight: 600; }
    .progress-pct   { font-size: 1.25rem; font-weight: 800; }
    .progress-track {
      height: 10px; border-radius: 999px;
      background: var(--color-surface); overflow: hidden; margin-bottom: 0.5rem;
    }
    .progress-bar { height: 100%; border-radius: 999px; transition: width 0.4s ease; }
    .bar-green  { background: var(--color-success); }
    .bar-yellow { background: var(--color-warning); }
    .bar-red    { background: var(--color-danger); }
    .progress-detail { margin: 0; font-size: 0.86rem; }

    /* ── Tableau de suivi ──────────────────────────────────────────── */
    .table-scroll { overflow-x: auto; }
    .table { width: 100%; min-width: 640px; border-collapse: collapse; }
    .table th, .table td {
      text-align: left; padding: 0.65rem 0.6rem;
      border-bottom: 1px solid var(--color-border); vertical-align: top;
    }
    .table-sm th, .table-sm td { padding: 0.5rem 0.6rem; font-size: 0.9rem; }
    .td-nom { font-weight: 600; min-width: 140px; }
    .td-avancement { white-space: nowrap; }
    .td-avancement .badge { display: block; margin-bottom: 0.4rem; width: fit-content; }
    .avancement-select {
      padding: 0.35rem 0.5rem; border: 1px solid var(--color-border);
      border-radius: 8px; font: inherit; font-size: 0.86rem;
    }
    .commentaire {
      width: 100%; min-width: 200px; padding: 0.45rem 0.55rem;
      border: 1px solid var(--color-border); border-radius: 8px;
      font: inherit; font-size: 0.86rem; resize: vertical;
    }

    /* ── Onglet Roadmap ────────────────────────────────────────────── */
    .solution-card { margin-bottom: 1rem; }
    .solution-header {
      display: flex; align-items: center; gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .solution-header h4 { margin: 0; font-size: 1rem; }
    .sans-projets-titre { margin: 0 0 0.35rem; }
    .sans-projets-hint  { margin-bottom: 0.75rem; }
    .solution-list {
      list-style: none; display: grid; gap: 0.45rem;
    }
    .solution-list li {
      display: flex; align-items: center; gap: 0.6rem;
      padding: 0.5rem 0.75rem; border: 1px solid var(--color-border);
      border-radius: 8px; font-size: 0.9rem;
      background: var(--color-surface);
    }
  `],
})
export class MiseEnOeuvreComponent implements OnInit {
  tab: Tab = 'tableau-de-bord';
  avancements = AVANCEMENTS;

  loading = true;
  suivi: SuiviSolution[] = [];
  stats: MiseEnOeuvreStats | null = null;

  constructor(
    private readonly miseEnOeuvreService: MiseEnOeuvreService,
    private readonly toast: ToastService,
    private readonly sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  icon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] ?? '');
  }

  avancementLabel(a: AvancementSolution): string { return AVANCEMENT_LABEL[a]; }
  avancementBadge(a: AvancementSolution): string { return AVANCEMENT_BADGE[a]; }
  statutProjetLabel(s: string): string { return STATUT_PROJET_LABEL[s] ?? s; }
  statutProjetBadge(s: string): string { return STATUT_PROJET_BADGE[s] ?? 'badge-neutral'; }

  /** Solutions retenues sans projet roadmap associé. */
  get solutionsSansProjets(): SuiviSolution[] {
    return this.suivi.filter((item) => item.projetsLies.length === 0);
  }

  private load(): void {
    this.loading = true;
    this.miseEnOeuvreService.loadSuivi().subscribe({
      next: ({ suivi, stats }) => {
        this.suivi = suivi;
        this.stats = stats;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Impossible de charger les données de mise en œuvre.');
      },
    });
  }

  changeAvancement(item: SuiviSolution, avancement: AvancementSolution): void {
    this.miseEnOeuvreService
      .updateAvancement(item.solution.id, avancement, item.solution.commentaireSuivi ?? undefined)
      .subscribe({
        next: (updated) => {
          item.solution.avancement = updated.avancement;
          // Recalculer les stats localement sans rappel réseau
          this.refreshStats();
        },
        error: () => this.toast.error("Impossible de mettre à jour l'avancement."),
      });
  }

  saveCommentaire(item: SuiviSolution): void {
    this.miseEnOeuvreService
      .updateAvancement(
        item.solution.id,
        item.solution.avancement,
        item.solution.commentaireSuivi || undefined,
      )
      .subscribe({
        error: () => this.toast.error('Impossible d\'enregistrer le commentaire.'),
      });
  }

  exportExcel(): void {
    const rows = this.suivi.map((item) => ({
      Solution: item.solution.nom,
      'Plan de mise en œuvre': item.solution.planMiseOeuvre ?? '',
      Avancement: AVANCEMENT_LABEL[item.solution.avancement],
      'Commentaire de suivi': item.solution.commentaireSuivi ?? '',
      'Projets liés': item.projetsLies.map((p) => p.nom).join(', '),
    }));
    exportToExcel('mise-en-oeuvre', 'Suivi', rows);
  }

  /** Recalcule les stats en mémoire après un changement d'avancement. */
  private refreshStats(): void {
    const solutions = this.suivi.map((item) => item.solution);
    const total = solutions.length;
    const nonDemarre = solutions.filter((s) => s.avancement === 'NON_DEMARRE').length;
    const enCours    = solutions.filter((s) => s.avancement === 'EN_COURS').length;
    const termine    = solutions.filter((s) => s.avancement === 'TERMINE').length;
    const bloque     = solutions.filter((s) => s.avancement === 'BLOQUE').length;
    const tauxAvancement = total > 0 ? Math.round((termine / total) * 100) : 0;
    this.stats = { total, nonDemarre, enCours, termine, bloque, tauxAvancement };
  }
}
