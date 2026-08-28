import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Chart, registerables } from 'chart.js';
import { EnqueteReponse, EnqueteReponseItem, EnqueteReponseService } from './enquete-reponse.service';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';
import { importFromExcel } from './excel.util';

Chart.register(...registerables);

type Tab = 'reponses' | 'rapport';

const ICONS: Record<string, string> = {
  upload: '<path d="M12 20V8"/><path d="M7 13l5-5 5 5"/><path d="M4 3h16"/>',
};

@Component({
  selector: 'app-evaluation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p class="muted step-question">Que pensent les parties prenantes de l'architecture mise en œuvre ? Quels enseignements pour la suite ?</p>

    <div class="tabs">
      <button class="tab" [class.active]="tab === 'reponses'" (click)="tab = 'reponses'">Réponses</button>
      <button class="tab" [class.active]="tab === 'rapport'" (click)="selectRapport()">Rapport d'évaluation</button>
    </div>

    <!-- ── Réponses ──────────────────────────────────────────────────────── -->
    <section *ngIf="tab === 'reponses'">
      <div class="page-header">
        <h3>Réponses ({{ reponses.length }})</h3>
        <label class="icon-btn file-btn" title="Importer (Excel/CSV)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('upload')"></svg>
          <input type="file" accept=".xlsx,.xls,.csv" (change)="importReponses($event)" hidden />
        </label>
      </div>
      <p class="hint">Colonnes attendues : « Répondant », « Score » (1 à 5), « Commentaire » (optionnel).</p>

      <section class="card">
        <div class="empty-state" *ngIf="reponses.length === 0">Aucune réponse importée pour l'instant.</div>
        <div class="table-scroll" *ngIf="reponses.length > 0">
          <table class="table">
            <thead><tr><th>Répondant</th><th>Score</th><th>Commentaire</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let r of reponses">
                <td>{{ r.repondant }}</td>
                <td>{{ r.score }} / 5</td>
                <td>{{ r.commentaire || '—' }}</td>
                <td><button class="btn btn-ghost" (click)="removeReponse(r)">Supprimer</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <!-- ── Rapport d'évaluation ─────────────────────────────────────────── -->
    <section *ngIf="tab === 'rapport'">
      <div class="stats-grid">
        <section class="card stat">
          <span class="stat-value">{{ noteMoyenne ?? '—' }}</span>
          <span class="stat-label">Note moyenne / 5</span>
        </section>
        <section class="card stat">
          <span class="stat-value">{{ reponses.length }}</span>
          <span class="stat-label">Réponses collectées</span>
        </section>
      </div>

      <section class="card" *ngIf="reponses.length > 0">
        <h3>Répartition des scores</h3>
        <div class="chart-container"><canvas #scoresChart></canvas></div>
      </section>

      <section class="card" *ngIf="commentaires.length > 0">
        <h3>Commentaires</h3>
        <div class="table-scroll">
          <table class="table">
            <thead><tr><th>Répondant</th><th>Score</th><th>Commentaire</th></tr></thead>
            <tbody>
              <tr *ngFor="let c of commentaires">
                <td>{{ c.repondant }}</td>
                <td>{{ c.score }} / 5</td>
                <td>{{ c.commentaire }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `,
  styles: [
    `
      .muted { color: var(--color-text-muted); margin-top: 0.25rem; font-size: 0.9rem; }
      .hint { color: var(--color-text-muted); font-size: 0.85rem; margin: -0.75rem 0 1.25rem; }
      .file-btn { cursor: pointer; }
      .table-scroll { overflow-x: auto; }
      .table { width: 100%; min-width: 560px; border-collapse: collapse; }
      .table th, .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); }
      .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
      .stat { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; padding: 1.5rem 1rem; }
      .stat-value { font-size: 2rem; font-weight: 800; }
      .stat-label { color: var(--color-text-muted); font-size: 0.9rem; }
      .chart-container { height: 260px; }
      .card { margin-bottom: 1.25rem; }
      .list { list-style: none; display: grid; gap: 0.6rem; }
      .list-item { padding: 0.75rem 1rem; border: 1px solid var(--color-border); border-radius: 10px; }
    `,
  ],
})
export class EvaluationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scoresChart') scoresChartRef?: ElementRef<HTMLCanvasElement>;

  tab: Tab = 'reponses';
  reponses: EnqueteReponse[] = [];

  private viewReady = false;
  private chart?: Chart;

  constructor(
    private enqueteService: EnqueteReponseService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  icon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] ?? '');
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  get noteMoyenne(): number | null {
    if (this.reponses.length === 0) return null;
    const somme = this.reponses.reduce((acc, r) => acc + r.score, 0);
    return Math.round((somme / this.reponses.length) * 10) / 10;
  }

  get commentaires(): EnqueteReponse[] {
    return this.reponses.filter((r) => r.commentaire);
  }

  load(): void {
    this.enqueteService.list().subscribe({
      next: (reponses) => (this.reponses = reponses),
      error: () => this.toast.error('Impossible de charger les réponses.'),
    });
  }

  selectRapport(): void {
    this.tab = 'rapport';
    setTimeout(() => this.renderChart());
  }

  async importReponses(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (!file) return;

    try {
      const rows = await importFromExcel(file);
      const items: EnqueteReponseItem[] = rows
        .map((row) => ({
          repondant: String(row['Répondant'] ?? '').trim(),
          score: Number(row['Score']),
          commentaire: row['Commentaire'] ? String(row['Commentaire']) : undefined,
        }))
        .filter((item) => item.repondant && item.score >= 1 && item.score <= 5);

      if (items.length === 0) {
        this.toast.error('Aucune ligne valide trouvée dans ce fichier.');
        return;
      }

      this.enqueteService.import(items).subscribe({
        next: (reponses) => {
          this.reponses = reponses;
          this.toast.success(`${items.length} réponse(s) importée(s).`);
        },
        error: () => this.toast.error("Impossible d'importer ces réponses."),
      });
    } catch {
      this.toast.error("Impossible de lire ce fichier.");
    }
  }

  async removeReponse(r: EnqueteReponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Supprimer la réponse de « ${r.repondant} » ?`);
    if (!confirmed) return;
    this.enqueteService.delete(r.id).subscribe({
      next: () => {
        this.reponses = this.reponses.filter((x) => x.id !== r.id);
        this.toast.success('Réponse supprimée.');
      },
      error: () => this.toast.error('Impossible de supprimer cette réponse.'),
    });
  }

  private renderChart(): void {
    if (!this.viewReady || !this.scoresChartRef || this.reponses.length === 0) return;
    this.chart?.destroy();

    const counts = [1, 2, 3, 4, 5].map((score) => this.reponses.filter((r) => r.score === score).length);

    this.chart = new Chart(this.scoresChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['1', '2', '3', '4', '5'],
        datasets: [{ data: counts, backgroundColor: '#3b5bdb', borderRadius: 8, maxBarThickness: 56 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        plugins: { legend: { display: false } },
      },
    });
  }
}
