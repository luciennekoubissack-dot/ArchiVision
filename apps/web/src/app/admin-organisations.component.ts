import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, OrganisationAdmin, OrganisationDetailAdmin, StatutOrganisation } from './admin.service';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';

type Filtre = 'TOUTES' | StatutOrganisation;

const STATUT_LABEL: Record<StatutOrganisation, string> = {
  EN_ATTENTE: 'En attente',
  VALIDEE: 'Validée',
  REJETEE: 'Rejetée',
};

const STATUT_BADGE: Record<StatutOrganisation, string> = {
  EN_ATTENTE: 'badge-warning',
  VALIDEE: 'badge-success',
  REJETEE: 'badge-danger',
};

@Component({
  selector: 'app-admin-organisations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tabs">
      <button class="tab" [class.active]="filtre === 'TOUTES'" (click)="selectFiltre('TOUTES')">Toutes</button>
      <button class="tab" [class.active]="filtre === 'EN_ATTENTE'" (click)="selectFiltre('EN_ATTENTE')">En attente</button>
      <button class="tab" [class.active]="filtre === 'VALIDEE'" (click)="selectFiltre('VALIDEE')">Validées</button>
      <button class="tab" [class.active]="filtre === 'REJETEE'" (click)="selectFiltre('REJETEE')">Rejetées</button>
    </div>

    <section class="card">
      <div class="empty-state" *ngIf="organisations.length === 0">Aucune organisation dans cette catégorie.</div>
      <table class="table" *ngIf="organisations.length > 0">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Secteur</th>
            <th>Pays</th>
            <th>Membres</th>
            <th>Statut</th>
            <th>Inscrite le</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <ng-container *ngFor="let org of organisations">
            <tr>
              <td><strong>{{ org.nom }}</strong></td>
              <td>{{ org.secteur || '—' }}</td>
              <td>{{ org.pays || '—' }}</td>
              <td>{{ org._count.users }}</td>
              <td><span class="badge" [class]="statutBadge(org.statut)">{{ statutLabel(org.statut) }}</span></td>
              <td>{{ org.createdAt | date: 'dd/MM/yyyy' }}</td>
              <td class="actions">
                <button class="btn btn-ghost" (click)="toggleDetail(org)">
                  {{ expandedId === org.id ? 'Masquer' : 'Détails' }}
                </button>
                <button class="btn btn-outline" *ngIf="org.statut === 'EN_ATTENTE'" (click)="valider(org)">Valider</button>
                <button class="btn btn-ghost" *ngIf="org.statut === 'EN_ATTENTE'" (click)="rejeter(org)">Rejeter</button>
                <button class="btn btn-danger" (click)="remove(org)">Supprimer</button>
              </td>
            </tr>
            <tr *ngIf="expandedId === org.id">
              <td colspan="7" class="detail-row">
                <div class="empty-state" *ngIf="!detail">Chargement…</div>
                <div *ngIf="detail">
                  <h4>Employés ({{ detail.users.length }})</h4>
                  <ul class="employee-list" *ngIf="detail.users.length > 0">
                    <li *ngFor="let u of detail.users">
                      <strong>{{ u.nom }}</strong> — {{ u.email }} — <span class="badge badge-neutral">{{ u.role }}</span>
                    </li>
                  </ul>
                  <p class="muted" *ngIf="detail.users.length === 0">Aucun employé pour l'instant.</p>
                </div>
              </td>
            </tr>
          </ng-container>
        </tbody>
      </table>
    </section>
  `,
  styles: [
    `
      .table { width: 100%; border-collapse: collapse; }
      .table th { text-align: left; padding: 0.6rem 0.75rem; font-size: 0.8rem; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); }
      .table td { padding: 0.75rem; border-bottom: 1px solid var(--color-border); font-size: 0.92rem; }
      .actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }
      .detail-row { background: var(--color-surface); }
      .employee-list { list-style: none; display: grid; gap: 0.5rem; margin-top: 0.5rem; }
      h4 { font-size: 0.95rem; }
      .muted { color: var(--color-text-muted); margin-top: 0.5rem; }
    `,
  ],
})
export class AdminOrganisationsComponent implements OnInit {
  organisations: OrganisationAdmin[] = [];
  filtre: Filtre = 'TOUTES';
  expandedId: string | null = null;
  detail: OrganisationDetailAdmin | null = null;

  constructor(
    private adminService: AdminService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  statutLabel(statut: StatutOrganisation): string {
    return STATUT_LABEL[statut];
  }

  statutBadge(statut: StatutOrganisation): string {
    return STATUT_BADGE[statut];
  }

  selectFiltre(filtre: Filtre): void {
    this.filtre = filtre;
    this.load();
  }

  private load(): void {
    const statut = this.filtre === 'TOUTES' ? undefined : this.filtre;
    this.adminService.listOrganisations(statut).subscribe({
      next: (organisations) => (this.organisations = organisations),
      error: () => this.toast.error('Impossible de charger les organisations.'),
    });
  }

  toggleDetail(org: OrganisationAdmin): void {
    if (this.expandedId === org.id) {
      this.expandedId = null;
      this.detail = null;
      return;
    }
    this.expandedId = org.id;
    this.detail = null;
    this.adminService.getOrganisation(org.id).subscribe({
      next: (detail) => (this.detail = detail),
      error: () => this.toast.error('Impossible de charger le détail de cette organisation.'),
    });
  }

  valider(org: OrganisationAdmin): void {
    this.adminService.valider(org.id).subscribe({
      next: ({ email }) => {
        this.toast.success(`Organisation validée. Email simulé envoyé à ${email.to}.`);
        this.load();
      },
      error: () => this.toast.error("Impossible de valider cette organisation."),
    });
  }

  rejeter(org: OrganisationAdmin): void {
    this.adminService.rejeter(org.id).subscribe({
      next: ({ email }) => {
        this.toast.success(`Organisation rejetée. Email simulé envoyé à ${email.to}.`);
        this.load();
      },
      error: () => this.toast.error("Impossible de rejeter cette organisation."),
    });
  }

  async remove(org: OrganisationAdmin): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      `Supprimer définitivement « ${org.nom} » ? Toutes ses données (membres, capacités, applications, zones…) seront perdues.`,
    );
    if (!confirmed) return;
    this.adminService.remove(org.id).subscribe({
      next: () => {
        this.toast.success('Organisation supprimée.');
        if (this.expandedId === org.id) {
          this.expandedId = null;
          this.detail = null;
        }
        this.load();
      },
      error: () => this.toast.error("Impossible de supprimer cette organisation."),
    });
  }
}
