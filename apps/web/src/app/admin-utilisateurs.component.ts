import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, UtilisateurAdmin } from './admin.service';
import { ToastService } from './toast.service';

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRATEUR: 'Administrateur',
  ARCHITECTE: 'Architecte',
};

@Component({
  selector: 'app-admin-utilisateurs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header"><h2>Utilisateurs ({{ utilisateurs.length }})</h2></div>

    <section class="card">
      <div class="empty-state" *ngIf="utilisateurs.length === 0">Aucun utilisateur pour l'instant.</div>
      <table class="table" *ngIf="utilisateurs.length > 0">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Organisation</th>
            <th>Inscrit le</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let u of utilisateurs">
            <td><strong>{{ u.nom }}</strong></td>
            <td>{{ u.email }}</td>
            <td><span class="badge badge-neutral">{{ roleLabel(u.role) }}</span></td>
            <td>{{ u.organisation?.nom || '—' }}</td>
            <td>{{ u.createdAt | date: 'dd/MM/yyyy' }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  `,
  styles: [
    `
      .table { width: 100%; border-collapse: collapse; }
      .table th { text-align: left; padding: 0.6rem 0.75rem; font-size: 0.8rem; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); }
      .table td { padding: 0.75rem; border-bottom: 1px solid var(--color-border); font-size: 0.92rem; }
    `,
  ],
})
export class AdminUtilisateursComponent implements OnInit {
  utilisateurs: UtilisateurAdmin[] = [];

  constructor(private adminService: AdminService, private toast: ToastService) {}

  ngOnInit(): void {
    this.adminService.listUtilisateurs().subscribe({
      next: (utilisateurs) => (this.utilisateurs = utilisateurs),
      error: () => this.toast.error('Impossible de charger les utilisateurs.'),
    });
  }

  roleLabel(role: string): string {
    return ROLE_LABEL[role] ?? role;
  }
}
