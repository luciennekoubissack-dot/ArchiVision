import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Application, Criticite, UrbanisationService } from './urbanisation.service';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';

const CRITICITE_BADGE: Record<Criticite, string> = {
  HAUTE: 'badge-danger',
  MOYENNE: 'badge-warning',
  BASSE: 'badge-success',
};

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header"><h2>Portefeuille applicatif</h2></div>

    <form class="card form-card" (submit)="create($event)">
      <h3>Nouvelle application</h3>
      <div class="grid-2">
        <label class="field">Nom<input type="text" [value]="newApp.nom" (input)="newApp.nom = $any($event.target).value" required /></label>
        <label class="field">
          Criticité
          <select [value]="newApp.criticite" (change)="newApp.criticite = $any($event.target).value">
            <option value="HAUTE">Haute</option>
            <option value="MOYENNE">Moyenne</option>
            <option value="BASSE">Basse</option>
          </select>
        </label>
      </div>
      <label class="field">Description<textarea [value]="newApp.description || ''" (input)="newApp.description = $any($event.target).value"></textarea></label>
      <button type="submit" class="btn btn-primary" [disabled]="creating">Créer</button>
    </form>

    <section class="card">
      <h3>Applications ({{ applications.length }})</h3>
      <div class="empty-state" *ngIf="applications.length === 0">Aucune application dans le portefeuille.</div>
      <ul class="list" *ngIf="applications.length > 0">
        <li class="list-item" *ngFor="let app of applications">
          <div class="row">
            <div>
              <strong>{{ app.nom }}</strong>
              <span class="badge" [class]="criticiteBadge(app.criticite)">{{ app.criticite }}</span>
              <p class="muted" *ngIf="app.description">{{ app.description }}</p>
            </div>
            <div class="actions">
              <button class="btn btn-outline" (click)="toggleDetail(app)">
                {{ expandedId === app.id ? 'Masquer' : 'Affectations (' + (app._count?.zones || 0) + ')' }}
              </button>
              <button class="btn btn-danger" (click)="remove(app)">Supprimer</button>
            </div>
          </div>
          <div class="detail" *ngIf="expandedId === app.id">
            <div class="empty-state" *ngIf="!app.zones || app.zones.length === 0">Non affectée à un îlot pour l'instant.</div>
            <ul class="zone-list" *ngIf="app.zones && app.zones.length > 0">
              <li *ngFor="let z of app.zones">
                {{ z.zone.nom }}
                <button class="btn btn-ghost" (click)="desaffecter(app, z.zone.id)">Désaffecter</button>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </section>
  `,
  styles: [
    `
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
      .form-card { margin-bottom: 1.5rem; }
      .list { list-style: none; display: grid; gap: 0.75rem; }
      .list-item { padding: 1rem; border: 1px solid var(--color-border); border-radius: 12px; }
      .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
      .actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
      .muted { color: var(--color-text-muted); margin-top: 0.35rem; font-size: 0.9rem; }
      .badge { margin-left: 0.5rem; }
      .detail { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed var(--color-border); }
      .zone-list { list-style: none; display: grid; gap: 0.4rem; }
      .zone-list li { display: flex; justify-content: space-between; align-items: center; }
    `,
  ],
})
export class ApplicationsComponent implements OnInit {
  applications: Application[] = [];
  newApp: { nom: string; description?: string; criticite: Criticite } = { nom: '', criticite: 'MOYENNE' };
  creating = false;
  expandedId: string | null = null;

  constructor(
    private urbanisationService: UrbanisationService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  criticiteBadge(criticite: Criticite): string {
    return CRITICITE_BADGE[criticite];
  }

  load(): void {
    this.urbanisationService.listApplications().subscribe({
      next: (apps) => (this.applications = apps),
      error: () => this.toast.error('Impossible de charger les applications.'),
    });
  }

  create(event: Event): void {
    event.preventDefault();
    this.creating = true;
    this.urbanisationService.createApplication(this.newApp).subscribe({
      next: (app) => {
        this.applications = [...this.applications, app];
        this.newApp = { nom: '', criticite: 'MOYENNE' };
        this.creating = false;
        this.toast.success('Application créée.');
      },
      error: () => {
        this.creating = false;
        this.toast.error('Impossible de créer cette application.');
      },
    });
  }

  async remove(app: Application): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Supprimer l'application « ${app.nom} » ?`);
    if (!confirmed) return;
    this.urbanisationService.deleteApplication(app.id).subscribe({
      next: () => {
        this.applications = this.applications.filter((a) => a.id !== app.id);
        this.toast.success('Application supprimée.');
      },
      error: () => this.toast.error('Impossible de supprimer cette application.'),
    });
  }

  toggleDetail(app: Application): void {
    if (this.expandedId === app.id) {
      this.expandedId = null;
      return;
    }
    this.expandedId = app.id;
    if (app.zones) return; // déjà chargé
    // GET /applications/:id renvoie les zones affectées, absentes de la liste.
    this.urbanisationService.getApplication(app.id).subscribe({
      next: (detail) => (app.zones = detail.zones),
      error: () => this.toast.error("Impossible de charger les affectations de cette application."),
    });
  }

  desaffecter(app: Application, zoneId: string): void {
    this.urbanisationService.desaffecter(zoneId, app.id).subscribe({
      next: () => {
        this.toast.success('Application désaffectée.');
        this.load();
      },
      error: () => this.toast.error('Impossible de désaffecter cette application.'),
    });
  }
}
