import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, StatsAdmin } from './admin.service';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="kpi-row" *ngIf="stats as s">
      <div class="card kpi card-hover">
        <span class="icon-badge icon-badge-primary">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        </span>
        <div class="kpi-text">
          <span class="kpi-value">{{ s.organisations.total }}</span>
          <span class="kpi-label">Organisations inscrites</span>
        </div>
      </div>

      <div class="card kpi card-hover">
        <span class="icon-badge icon-badge-warning">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
        </span>
        <div class="kpi-text">
          <span class="kpi-value">{{ s.organisations.enAttente }}</span>
          <span class="kpi-label">En attente de validation</span>
        </div>
      </div>

      <div class="card kpi card-hover">
        <span class="icon-badge icon-badge-success">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </span>
        <div class="kpi-text">
          <span class="kpi-value">{{ s.organisations.validees }}</span>
          <span class="kpi-label">Validées</span>
        </div>
      </div>

      <div class="card kpi card-hover">
        <span class="icon-badge icon-badge-violet">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </span>
        <div class="kpi-text">
          <span class="kpi-value">{{ s.totalUtilisateurs }}</span>
          <span class="kpi-label">Utilisateurs (toutes entreprises)</span>
        </div>
      </div>
    </section>

    <section class="card" *ngIf="stats && stats.organisations.enAttente > 0">
      <h3>{{ stats.organisations.enAttente }} organisation(s) en attente de validation</h3>
      <p class="muted">Consultez la liste des entreprises pour valider ou rejeter les inscriptions.</p>
      <a routerLink="/admin/organisations" class="btn btn-primary" style="margin-top: 1rem;">Voir les entreprises</a>
    </section>
  `,
  styles: [
    `
      .kpi-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .kpi { display: flex; align-items: center; gap: 0.9rem; }
      .kpi-text { display: flex; flex-direction: column; }
      .kpi-value { font-size: 1.9rem; font-weight: 800; color: var(--color-text); line-height: 1.1; }
      .kpi-label { color: var(--color-text-muted); font-size: 0.85rem; margin-top: 0.15rem; }
      .muted { color: var(--color-text-muted); margin-top: 0.4rem; }
    `,
  ],
})
export class AdminDashboardComponent implements OnInit {
  stats: StatsAdmin | null = null;

  constructor(private adminService: AdminService, private toast: ToastService) {}

  ngOnInit(): void {
    this.adminService.stats().subscribe({
      next: (stats) => (this.stats = stats),
      error: () => this.toast.error('Impossible de charger les statistiques.'),
    });
  }
}
