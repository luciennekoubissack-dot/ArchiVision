import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrganisationService } from '../organisation/organisation.service';
import { CompletudeSummary, DomaineCompletude } from '../api-client/models/completude-entity';

interface DomainRow {
  label: string;
  route: string;
  data: DomaineCompletude;
  color: string;
}

@Component({
  selector: 'app-completude-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="card completude-card">
      <div class="completude-header">
        <h3>Couverture AS-IS → TO-BE</h3>
        <div class="maturite-badge" [class]="maturiteClass">
          <span class="maturite-value">{{ summary?.maturite ?? '…' }}</span>
          <span class="maturite-label">/ 100</span>
          <span class="maturite-desc">Maturité</span>
        </div>
      </div>

      <div class="completude-loading" *ngIf="!summary">Calcul en cours…</div>

      <div class="domains" *ngIf="summary">
        <div class="domain-row" *ngFor="let d of domainRows">
          <a class="domain-label" [routerLink]="d.route">{{ d.label }}</a>
          <div class="bar-wrap">
            <div
              class="bar-fill"
              [style.width.%]="d.data.pct"
              [style.background]="barColor(d.data.pct)"
            ></div>
          </div>
          <span class="bar-pct" [style.color]="barColor(d.data.pct)">{{ d.data.pct }}%</span>
          <span class="bar-detail">{{ d.data.avecToBe }}/{{ d.data.total }}</span>
        </div>
      </div>

      <p class="completude-hint" *ngIf="summary">
        Le score de maturité combine : couverture TO-BE (40 %), écarts adressés par des solutions (40 %)
        et solutions terminées (20 %).
      </p>
    </section>
  `,
  styles: [`
    .completude-card { margin-bottom: 1.5rem; }
    .completude-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      gap: 1rem;
    }
    .completude-header h3 { margin: 0; font-size: 1.05rem; }

    .maturite-badge {
      display: flex;
      align-items: baseline;
      gap: 0.2rem;
      flex-direction: column;
      text-align: center;
      padding: 0.6rem 1rem;
      border-radius: var(--radius-lg);
      min-width: 72px;
      flex-shrink: 0;
    }
    .maturite-badge.green  { background: #f0fdf4; border: 1.5px solid #16a34a; }
    .maturite-badge.orange { background: #fff7ed; border: 1.5px solid #ea580c; }
    .maturite-badge.red    { background: #fef2f2; border: 1.5px solid #dc2626; }
    .maturite-value { font-size: 1.6rem; font-weight: 800; line-height: 1; }
    .maturite-label { font-size: 0.78rem; color: var(--color-text-muted); }
    .maturite-desc  { font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

    .completude-loading { color: var(--color-text-muted); font-size: 0.9rem; padding: 0.5rem 0; }

    .domains { display: grid; gap: 0.6rem; }
    .domain-row {
      display: grid;
      grid-template-columns: 180px 1fr 44px 56px;
      align-items: center;
      gap: 0.75rem;
    }
    .domain-label {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--color-primary);
      text-decoration: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .domain-label:hover { text-decoration: underline; }
    .bar-wrap {
      height: 10px;
      background: var(--color-border);
      border-radius: 999px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.4s ease;
    }
    .bar-pct {
      font-size: 0.85rem;
      font-weight: 700;
      text-align: right;
    }
    .bar-detail {
      font-size: 0.78rem;
      color: var(--color-text-muted);
      text-align: right;
    }
    .completude-hint {
      font-size: 0.78rem;
      color: var(--color-text-muted);
      margin-top: 1rem;
      margin-bottom: 0;
    }

    @media (max-width: 600px) {
      .domain-row { grid-template-columns: 120px 1fr 36px; }
      .bar-detail { display: none; }
    }
  `],
})
export class CompletudeDashboardComponent implements OnInit {
  @Input() compact = false;

  summary: CompletudeSummary | null = null;

  constructor(private organisationService: OrganisationService) {}

  ngOnInit(): void {
    this.organisationService.getCompletude().subscribe({
      next: (s) => (this.summary = s),
      error: () => { /* silencieux — ne pas bloquer le dashboard */ },
    });
  }

  get domainRows(): DomainRow[] {
    if (!this.summary) return [];
    return [
      { label: 'Objectifs stratégiques', route: '/organisation', data: this.summary.objectifs, color: '' },
      { label: 'Architecture Métier', route: '/architecture-metier', data: this.summary.metier, color: '' },
      { label: 'Architecture Données', route: '/donnees', data: this.summary.donnees, color: '' },
      { label: 'Architecture Applicative', route: '/architecture-systeme', data: this.summary.applicatif, color: '' },
      { label: 'Architecture Techno.', route: '/technologie', data: this.summary.technologique, color: '' },
    ];
  }

  get maturiteClass(): string {
    const m = this.summary?.maturite ?? 0;
    if (m >= 70) return 'green';
    if (m >= 40) return 'orange';
    return 'red';
  }

  barColor(pct: number): string {
    if (pct >= 70) return '#16a34a';
    if (pct >= 40) return '#ea580c';
    return '#dc2626';
  }
}
