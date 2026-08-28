import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ArchimateService, ElementArchimate, TypeElement } from './archimate.service';
import { UrbanisationService } from './urbanisation.service';
import { MembresService } from './membres.service';
import { AuthService } from './auth.service';
import { Organisation, OrganisationService } from './organisation.service';

Chart.register(...registerables);

const TYPE_LABEL: Record<TypeElement, string> = {
  VISION: 'Visions',
  OBJECTIF_ARCHIMATE: "Objectifs d'architecture",
  PRINCIPE: 'Principes',
  EXIGENCE: 'Exigences',
  ACTEUR_METIER: 'Acteurs',
  ROLE_METIER: 'Rôles',
  PROCESSUS_METIER: 'Processus',
  SERVICE_METIER: 'Services métier',
  OBJET_METIER: 'Objets métier',
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
    <section class="card hero-banner">
      <div class="hero-user" *ngIf="auth.currentUser() as user">
        <span class="hero-avatar">
          <img *ngIf="user.avatarUrl" [src]="user.avatarUrl" [alt]="user.nom" />
          <ng-container *ngIf="!user.avatarUrl">{{ initials(user.nom) }}</ng-container>
        </span>
        <div>
          <p class="hero-greeting">{{ greeting }}, {{ firstName(user.nom) }}</p>
          <p class="hero-sub">Bienvenue sur le tableau de bord de votre organisation.</p>
        </div>
      </div>

      <div class="hero-org" *ngIf="organisation">
        <span class="org-logo">
          <img *ngIf="organisation.logoUrl" [src]="organisation.logoUrl" [alt]="organisation.nom" />
          <ng-container *ngIf="!organisation.logoUrl">{{ orgInitial }}</ng-container>
        </span>
        <div class="org-info">
          <span class="org-name">{{ organisation.nom }}</span>
          <span class="org-location" *ngIf="organisation.pays">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ organisation.pays }}
          </span>
        </div>
      </div>
    </section>

    <section class="kpi-row">
      <div class="card kpi card-hover" *ngFor="let kpi of kpis">
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
          Aucun élément ArchiMate pour l'instant .
        </div>
        <div class="chart-wrap" [style.display]="counts.elements > 0 ? 'block' : 'none'">
          <canvas #elementsChart></canvas>
        </div>
      </section>
    </section>
  `,
  styles: [
    `
      .hero-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1.25rem;
        margin-bottom: 1.5rem;
      }
      .hero-user { display: flex; align-items: center; gap: 1rem; }
      .hero-avatar {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: var(--color-primary-light);
        color: var(--color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 1.1rem;
        flex-shrink: 0;
        overflow: hidden;
      }
      .hero-avatar img { width: 100%; height: 100%; object-fit: cover; }
      .hero-greeting { font-size: 1.2rem; font-weight: 800; color: var(--color-text); }
      .hero-sub { font-size: 0.86rem; color: var(--color-text-muted); margin-top: 0.15rem; }

      .hero-org {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: var(--color-surface);
        border-radius: var(--radius-md);
        padding: 0.6rem 1rem 0.6rem 0.6rem;
      }
      .org-logo {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-sm);
        overflow: hidden;
        flex-shrink: 0;
        background: var(--color-white);
        color: var(--color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 1rem;
      }
      .org-logo img { width: 100%; height: 100%; object-fit: cover; }
      .org-info { display: flex; flex-direction: column; min-width: 0; }
      .org-name { font-weight: 700; font-size: 0.92rem; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px; }
      .org-location { display: flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; color: var(--color-text-muted); margin-top: 0.1rem; }

      @media (max-width: 700px) {
        .hero-org { width: 100%; }
      }

      .kpi-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .kpi { display: flex; align-items: center; gap: 0.9rem; }
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
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('elementsChart') elementsChartRef?: ElementRef<HTMLCanvasElement>;

  kpis = KPIS;
  counts = { capacites: 0, elements: 0, applications: 0, zones: 0, membres: null as number | null };
  loaded = false;
  organisation?: Organisation;
  private elements: ElementArchimate[] = [];
  private viewReady = false;
  private elementsChart?: Chart;

  constructor(
    private archimateService: ArchimateService,
    private urbanisationService: UrbanisationService,
    private membresService: MembresService,
    private organisationService: OrganisationService,
    public auth: AuthService,
  ) {}

  get orgInitial(): string {
    return this.organisation?.nom?.[0]?.toUpperCase() ?? '';
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  firstName(nom: string): string {
    return nom.trim().split(/\s+/)[0] ?? nom;
  }

  initials(nom: string): string {
    const parts = nom.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  ngOnInit(): void {
    const membres$ = this.auth.hasRole('ADMINISTRATEUR')
      ? this.membresService.list().pipe(catchError(() => of(null)))
      : of(null);

    this.organisationService.getMine().subscribe({
      next: (organisation) => (this.organisation = organisation),
      error: () => {},
    });

    forkJoin({
      capacites: this.archimateService.listCapacites(),
      elements: this.archimateService.listElements(),
      applications: this.urbanisationService.listApplications(),
      zones: this.urbanisationService.listZones(),
      membres: membres$,
    }).subscribe(({ capacites, elements, applications, zones, membres }) => {
      this.elements = elements;
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

  ngOnDestroy(): void {
    this.elementsChart?.destroy();
  }

  private renderCharts(): void {
    // Le canvas est toujours dans le DOM (visibilité pilotée par [style.display]),
    // donc le ViewChild est déjà résolu quand les données arrivent en asynchrone —
    // contrairement à un *ngIf sur le canvas, qui retarderait sa disponibilité
    // d'un cycle de détection de changements.
    if (!this.viewReady) return;
    this.renderElementsChart();
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
            backgroundColor: ['#3b5bdb', '#6c5dd3', '#12a0a0', '#1f9d55', '#d98a1f'],
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
}
