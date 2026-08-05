import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ArchimateService, ElementArchimate, TypeElement } from './archimate.service';
import { Application, Criticite, UrbanisationService } from './urbanisation.service';
import { MembresService } from './membres.service';
import { AuthService } from './auth.service';

Chart.register(...registerables);

const TYPE_LABEL: Record<TypeElement, string> = {
  ACTEUR_METIER: 'Acteurs',
  ROLE_METIER: 'Rôles',
  PROCESSUS_METIER: 'Processus',
  SERVICE_METIER: 'Services métier',
  OBJET_METIER: 'Objets métier',
};

const CRITICITE_LABEL: Record<Criticite, string> = {
  HAUTE: 'Haute',
  MOYENNE: 'Moyenne',
  BASSE: 'Basse',
};

interface Kpi {
  key: 'capacites' | 'elements' | 'applications' | 'zones' | 'membres';
  label: string;
  icon: 'layers' | 'network' | 'grid' | 'map' | 'users';
  badge: 'primary' | 'success' | 'warning' | 'info' | 'violet';
}

const KPIS: Kpi[] = [
  { key: 'capacites', label: 'Capacités métier', icon: 'layers', badge: 'primary' },
  { key: 'elements', label: 'Éléments ArchiMate', icon: 'network', badge: 'violet' },
  { key: 'applications', label: 'Applications', icon: 'grid', badge: 'info' },
  { key: 'zones', label: "Zones d'urbanisation", icon: 'map', badge: 'warning' },
  { key: 'membres', label: 'Membres', icon: 'users', badge: 'success' },
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h2>Tableau de bord</h2>
    </div>

    <section class="kpi-row">
      <div class="card kpi card-hover" [class]="'accent-' + kpi.badge" *ngFor="let kpi of kpis">
        <span class="icon-badge" [class]="'icon-badge-' + kpi.badge" [ngSwitch]="kpi.icon">
          <svg *ngSwitchCase="'layers'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          <svg *ngSwitchCase="'network'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5v4M10.3 15.5 7 17.5M13.7 15.5 17 17.5"/></svg>
          <svg *ngSwitchCase="'grid'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
          <svg *ngSwitchCase="'map'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
          <svg *ngSwitchCase="'users'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </span>
        <div class="kpi-text" *ngIf="kpi.key !== 'membres' || counts.membres !== null">
          <span class="kpi-value">{{ counts[kpi.key] }}</span>
          <span class="kpi-label">{{ kpi.label }}</span>
        </div>
      </div>
    </section>

    <section class="chart-grid">
      <section class="card chart-card card-hover">
        <h3>Répartition des éléments ArchiMate par type</h3>
        <div class="empty-state" *ngIf="loaded && counts.elements === 0">
          Aucun élément ArchiMate pour l'instant — la répartition apparaîtra dès que vous en créerez.
        </div>
        <div class="chart-wrap" [style.display]="counts.elements > 0 ? 'block' : 'none'">
          <canvas #elementsChart></canvas>
        </div>
      </section>

      <section class="card chart-card card-hover">
        <h3>Applications par criticité</h3>
        <div class="empty-state" *ngIf="loaded && counts.applications === 0">
          Aucune application pour l'instant — le suivi apparaîtra dès que vous en créerez.
        </div>
        <div class="chart-wrap" [style.display]="counts.applications > 0 ? 'block' : 'none'">
          <canvas #criticiteChart></canvas>
        </div>
      </section>
    </section>
  `,
  styles: [
    `
      .kpi-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .kpi { display: flex; align-items: center; gap: 0.9rem; position: relative; overflow: hidden; }
      .kpi::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 4px;
        background: var(--gradient-primary);
      }
      .kpi.accent-primary::before { background: linear-gradient(90deg, #4c8dff, #2f6fed); }
      .kpi.accent-violet::before { background: linear-gradient(90deg, #8f7ff0, #6d5bd0); }
      .kpi.accent-info::before { background: linear-gradient(90deg, #22c3e6, #0891b2); }
      .kpi.accent-warning::before { background: linear-gradient(90deg, #ffab33, #ea8c00); }
      .kpi.accent-success::before { background: linear-gradient(90deg, #34d17c, #16a34a); }
      .kpi-text { display: flex; flex-direction: column; }
      .kpi-value { font-size: 1.9rem; font-weight: 800; color: var(--color-text); line-height: 1.1; }
      .kpi-label { color: var(--color-text-muted); font-size: 0.85rem; margin-top: 0.15rem; }

      .chart-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1.25rem;
      }
      .chart-card h3 { margin-bottom: 1rem; font-size: 1.05rem; }
      .chart-wrap { position: relative; height: 280px; }
      canvas { max-height: 280px; }
    `,
  ],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('elementsChart') elementsChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('criticiteChart') criticiteChartRef?: ElementRef<HTMLCanvasElement>;

  kpis = KPIS;
  counts = { capacites: 0, elements: 0, applications: 0, zones: 0, membres: null as number | null };
  loaded = false;
  private elements: ElementArchimate[] = [];
  private applications: Application[] = [];
  private viewReady = false;
  private elementsChart?: Chart;
  private criticiteChart?: Chart;

  constructor(
    private archimateService: ArchimateService,
    private urbanisationService: UrbanisationService,
    private membresService: MembresService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    const membres$ = this.auth.hasRole('ARCHITECTE')
      ? this.membresService.list().pipe(catchError(() => of(null)))
      : of(null);

    forkJoin({
      capacites: this.archimateService.listCapacites(),
      elements: this.archimateService.listElements(),
      applications: this.urbanisationService.listApplications(),
      zones: this.urbanisationService.listZones(),
      membres: membres$,
    }).subscribe(({ capacites, elements, applications, zones, membres }) => {
      this.elements = elements;
      this.applications = applications;
      this.counts = {
        capacites: capacites.length,
        elements: elements.length,
        applications: applications.length,
        // L'API renvoie chaque zone comme entrée de premier niveau (en plus de
        // l'imbriquer dans les `enfants` de son parent) : la longueur du tableau
        // à plat est déjà le nombre exact de zones, sans recursion nécessaire.
        zones: zones.length,
        membres: membres ? membres.length : null,
      };
      this.loaded = true;
      this.renderCharts();
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderCharts();
  }

  private renderCharts(): void {
    // Les canvas sont toujours dans le DOM (visibilité pilotée par [style.display]),
    // donc les ViewChild sont déjà résolus quand les données arrivent en asynchrone —
    // contrairement à un *ngIf sur le canvas, qui retarderait leur disponibilité
    // d'un cycle de détection de changements.
    if (!this.viewReady) return;
    this.renderElementsChart();
    this.renderCriticiteChart();
  }

  private renderElementsChart(): void {
    if (!this.elementsChartRef || this.elements.length === 0) return;
    this.elementsChart?.destroy();

    const counts = new Map<string, number>();
    for (const element of this.elements) {
      counts.set(element.type, (counts.get(element.type) ?? 0) + 1);
    }

    this.elementsChart = new Chart(this.elementsChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: [...counts.keys()].map((type) => TYPE_LABEL[type as TypeElement] ?? type),
        datasets: [
          {
            data: [...counts.values()],
            backgroundColor: ['#2f6fed', '#6d5bd0', '#0891b2', '#16a34a', '#ea8c00'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { padding: 14, usePointStyle: true } } },
      },
    });
  }

  private renderCriticiteChart(): void {
    if (!this.criticiteChartRef || this.applications.length === 0) return;
    this.criticiteChart?.destroy();

    const order: Criticite[] = ['HAUTE', 'MOYENNE', 'BASSE'];
    const counts = new Map<Criticite, number>();
    for (const app of this.applications) {
      counts.set(app.criticite, (counts.get(app.criticite) ?? 0) + 1);
    }
    const colors: Record<Criticite, string> = { HAUTE: '#dc2626', MOYENNE: '#ea8c00', BASSE: '#16a34a' };

    this.criticiteChart = new Chart(this.criticiteChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: order.map((c) => CRITICITE_LABEL[c]),
        datasets: [
          {
            data: order.map((c) => counts.get(c) ?? 0),
            backgroundColor: order.map((c) => colors[c]),
            borderRadius: 8,
            maxBarThickness: 56,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  }
}
