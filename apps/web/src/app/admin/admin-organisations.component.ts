import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AdminService, OrganisationAdmin, OrganisationDetailAdmin, StatutOrganisation } from './admin.service';
import { ToastService } from '../shared/toast.service';
import { ConfirmDialogService } from '../shared/confirm-dialog.service';
import { PaginationComponent } from '../shared/pagination.component';
import { DEFAULT_PAGE_SIZE } from '../shared/pagination.interface';

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

const ICONS: Record<string, string> = {
  trash:
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
};

@Component({
  selector: 'app-admin-organisations',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  template: `
    <div class="page-header"><h3>Entreprises ({{ total }})</h3></div>

    <div class="tabs">
      <button class="tab" [class.active]="filtre === 'TOUTES'" (click)="selectFiltre('TOUTES')">Toutes</button>
      <button class="tab" [class.active]="filtre === 'EN_ATTENTE'" (click)="selectFiltre('EN_ATTENTE')">En attente</button>
      <button class="tab" [class.active]="filtre === 'VALIDEE'" (click)="selectFiltre('VALIDEE')">Validées</button>
      <button class="tab" [class.active]="filtre === 'REJETEE'" (click)="selectFiltre('REJETEE')">Rejetées</button>
    </div>

    <section class="card">
      <div class="empty-state" *ngIf="organisations.length === 0">Aucune organisation dans cette catégorie.</div>
      <div class="table-scroll" *ngIf="organisations.length > 0">
        <table class="table">
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
                <td class="row-actions">
                  <button type="button" class="btn btn-ghost" (click)="toggleDetail(org)">
                    {{ expandedId === org.id ? 'Masquer' : org.statut === 'EN_ATTENTE' ? 'Vérifier' : 'Détails' }}
                  </button>
                  <button type="button" class="icon-btn icon-btn-danger" title="Supprimer" (click)="remove(org)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('trash')"></svg>
                  </button>
                </td>
              </tr>
              <tr *ngIf="expandedId === org.id">
                <td colspan="7" class="detail-row">
                  <div class="empty-state" *ngIf="!detail">Chargement…</div>
                  <div class="review" *ngIf="detail">
                    <div class="review-grid">
                      <div><span class="review-label">Nom</span><strong>{{ detail.nom }}</strong></div>
                      <div><span class="review-label">Localisation</span><strong>{{ localisation(detail) }}</strong></div>
                      <div><span class="review-label">Secteur</span><strong>{{ detail.secteur || 'Non renseigné' }}</strong></div>
                      <div><span class="review-label">Responsable</span><strong>{{ responsableLabel(detail) }}</strong></div>
                      <div class="review-full"><span class="review-label">Objectif</span><strong>{{ detail.vision || 'Non renseigné' }}</strong></div>
                    </div>

                    <p class="review-warning" *ngIf="champsManquants(detail).length > 0">
                      Informations incomplètes : {{ champsManquants(detail).join(', ') }}. La validation reste bloquée tant que ces champs ne sont pas remplis.
                    </p>

                    <div class="review-actions" *ngIf="detail.statut === 'EN_ATTENTE'">
                      <button
                        class="btn btn-outline"
                        [disabled]="champsManquants(detail).length > 0"
                        [title]="champsManquants(detail).length > 0 ? 'Champs obligatoires incomplets' : 'Valider cette organisation'"
                        (click)="valider(detail)"
                      >
                        Valider
                      </button>
                      <button class="btn btn-ghost" (click)="rejeter(detail)">Rejeter</button>
                    </div>

                    <details class="employees">
                      <summary>Employés ({{ detail.users.length }})</summary>
                      <ul class="employee-list" *ngIf="detail.users.length > 0">
                        <li *ngFor="let u of detail.users">
                          <strong>{{ u.nom }}</strong>, {{ u.email }} <span class="badge badge-neutral">{{ u.role }}</span>
                        </li>
                      </ul>
                      <p class="muted" *ngIf="detail.users.length === 0">Aucun employé pour l'instant.</p>
                    </details>
                  </div>
                </td>
              </tr>
            </ng-container>
          </tbody>
        </table>
      </div>
      <app-pagination [page]="page" [total]="total" [pageSize]="pageSize" (pageChange)="onPageChange($event)" />
    </section>
  `,
  styles: [
    `
      .table-scroll { overflow-x: auto; }
      .table { width: 100%; border-collapse: collapse; }
      .table th { text-align: left; padding: 0.6rem 0.75rem; font-size: 0.8rem; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); }
      .table td { padding: 0.75rem; border-bottom: 1px solid var(--color-border); font-size: 0.92rem; }
      .row-actions { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
      .detail-row { background: var(--color-surface); }
      .review { display: grid; gap: 1rem; padding: 0.5rem 0; }
      .review-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem 1.5rem; }
      .review-grid > div { display: flex; flex-direction: column; gap: 0.15rem; }
      .review-grid .review-full { grid-column: 1 / -1; }
      .review-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-text-muted); }
      .review-warning { color: var(--color-danger); font-size: 0.85rem; background: var(--color-danger-light, rgba(220, 38, 38, 0.08)); padding: 0.6rem 0.75rem; border-radius: 8px; }
      .review-actions { display: flex; gap: 0.5rem; }
      .employees { font-size: 0.9rem; }
      .employees summary { cursor: pointer; color: var(--color-text-muted); }
      .employee-list { list-style: none; display: grid; gap: 0.5rem; margin-top: 0.5rem; }
      .muted { color: var(--color-text-muted); margin-top: 0.5rem; }
      @media (max-width: 640px) { .review-grid { grid-template-columns: 1fr; } }
    `,
  ],
})
export class AdminOrganisationsComponent implements OnInit {
  organisations: OrganisationAdmin[] = [];
  filtre: Filtre = 'TOUTES';
  expandedId: string | null = null;
  detail: OrganisationDetailAdmin | null = null;
  page = 1;
  total = 0;
  pageSize = DEFAULT_PAGE_SIZE;

  constructor(
    private adminService: AdminService,
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

  statutLabel(statut: StatutOrganisation): string {
    return STATUT_LABEL[statut];
  }

  statutBadge(statut: StatutOrganisation): string {
    return STATUT_BADGE[statut];
  }

  selectFiltre(filtre: Filtre): void {
    this.filtre = filtre;
    this.page = 1;
    this.load();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.load();
  }

  private load(): void {
    const statut = this.filtre === 'TOUTES' ? undefined : this.filtre;
    this.adminService.listOrganisations(statut, this.page, this.pageSize).subscribe({
      next: (result) => {
        this.organisations = result.items;
        this.total = result.total;
      },
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

  localisation(detail: OrganisationDetailAdmin): string {
    const parts = [detail.ville, detail.pays].filter((p) => !!p && p.trim());
    return parts.length ? parts.join(', ') : 'Non renseignée';
  }

  responsableLabel(detail: OrganisationDetailAdmin): string {
    const admin = detail.users.find((u) => u.role === 'ADMINISTRATEUR');
    return admin ? `${admin.nom} (${admin.email})` : 'Aucun compte administrateur';
  }

  champsManquants(detail: OrganisationDetailAdmin): string[] {
    const manquants: string[] = [];
    if (!detail.nom?.trim()) manquants.push('Nom');
    if (!detail.secteur?.trim()) manquants.push('Secteur');
    if (!detail.pays?.trim()) manquants.push('Pays');
    if (!detail.ville?.trim()) manquants.push('Ville');
    if (!detail.vision?.trim()) manquants.push('Objectif');
    if (!detail.users.some((u) => u.role === 'ADMINISTRATEUR')) manquants.push('Compte administrateur');
    return manquants;
  }

  valider(org: { id: string }): void {
    this.adminService.valider(org.id).subscribe({
      next: ({ email }) => {
        this.toast.success(`Organisation validée. E-mail de connexion envoyé à ${email.to}.`);
        this.collapse();
        this.load();
      },
      error: (err) =>
        this.toast.error(err?.error?.message ?? "Impossible de valider cette organisation."),
    });
  }

  rejeter(org: { id: string }): void {
    this.adminService.rejeter(org.id).subscribe({
      next: ({ email }) => {
        this.toast.success(`Organisation rejetée. E-mail de notification envoyé à ${email.to}.`);
        this.collapse();
        this.load();
      },
      error: (err) =>
        this.toast.error(err?.error?.message ?? "Impossible de rejeter cette organisation."),
    });
  }

  private collapse(): void {
    this.expandedId = null;
    this.detail = null;
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
