import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Application, Criticite, UrbanisationService } from './urbanisation.service';
import { ApplicationsCanevasComponent } from './applications-canevas.component';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';

type Tab = 'portefeuille' | 'diagramme';

const CRITICITE_BADGE: Record<Criticite, string> = {
  HAUTE: 'badge-danger',
  MOYENNE: 'badge-warning',
  BASSE: 'badge-success',
};

const ICONS: Record<string, string> = {
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash:
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
};

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, ApplicationsCanevasComponent],
  template: `
    <p class="muted step-question">Quelles applications supportent les processus métier ?</p>

    <div class="tabs">
      <button class="tab" [class.active]="tab === 'portefeuille'" (click)="tab = 'portefeuille'">Portefeuille</button>
      <button class="tab" [class.active]="tab === 'diagramme'" (click)="tab = 'diagramme'">Diagramme de composants</button>
    </div>

    <section *ngIf="tab === 'portefeuille'">
      <div class="page-header">
        <h3>Applications ({{ applications.length }})</h3>
        <button type="button" class="btn btn-primary" (click)="openCreate()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
          Ajouter une application
        </button>
      </div>

      <section class="card">
        <div class="empty-state" *ngIf="applications.length === 0">Aucune application dans le portefeuille.</div>
        <div class="table-scroll" *ngIf="applications.length > 0">
          <table class="table">
            <thead><tr><th>Nom</th><th>Criticité</th><th>Description</th><th>Services</th><th>Affectations</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let app of applications">
                <td>{{ app.nom }}</td>
                <td><span class="badge" [class]="criticiteBadge(app.criticite)">{{ app.criticite }}</span></td>
                <td>{{ app.description || '—' }}</td>
                <td>{{ app._count?.services || 0 }}</td>
                <td>{{ app._count?.zones || 0 }}</td>
                <td class="row-actions">
                  <button type="button" class="icon-btn icon-btn-view" title="Consulter" (click)="openView(app)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('eye')"></svg>
                  </button>
                  <button type="button" class="icon-btn icon-btn-edit" title="Modifier" (click)="openEdit(app)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('edit')"></svg>
                  </button>
                  <button type="button" class="icon-btn icon-btn-danger" title="Supprimer" (click)="remove(app)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('trash')"></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <section *ngIf="tab === 'diagramme'">
      <app-applications-canevas (changed)="load()" />
    </section>

    <!-- ── Popover : ajouter une application ─────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="createPopover" (click)="closeCreate()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="create($event)">
        <div class="popover-head">
          <h3>Ajouter une application</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeCreate()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
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
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCreate()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creating">{{ creating ? 'Création…' : 'Créer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Popover : consulter une application ───────────────────────────── -->
    <div class="popover-backdrop" *ngIf="viewTarget as app" (click)="closeView()">
      <div class="popover-card" (click)="$event.stopPropagation()">
        <div class="popover-head">
          <h3>Fiche application</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeView()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <dl class="fiche-list">
          <dt>Nom</dt><dd>{{ app.nom }}</dd>
          <dt>Criticité</dt><dd>{{ app.criticite }}</dd>
          <dt>Description</dt><dd>{{ app.description || '—' }}</dd>
        </dl>
        <hr />
        <h4>Services fournis</h4>
        <div class="empty-state" *ngIf="!app.services || app.services.length === 0">Aucun service défini.</div>
        <ul class="zone-list" *ngIf="app.services && app.services.length > 0">
          <li *ngFor="let s of app.services">
            <div>
              <strong>{{ s.nom }}</strong>
              <p class="muted" *ngIf="s.description">{{ s.description }}</p>
            </div>
            <button class="btn btn-ghost" (click)="removeService(app, s.id)">Retirer</button>
          </li>
        </ul>
        <form class="inline-form" (submit)="addService(app, $event)">
          <input type="text" placeholder="Nom du service" [value]="newService.nom" (input)="newService.nom = $any($event.target).value" required />
          <input type="text" placeholder="Description (facultatif)" [value]="newService.description || ''" (input)="newService.description = $any($event.target).value" />
          <button type="submit" class="btn btn-outline">Ajouter</button>
        </form>
        <hr />
        <h4>Affectations</h4>
        <div class="empty-state" *ngIf="!app.zones || app.zones.length === 0">Non affectée à un îlot pour l'instant.</div>
        <ul class="zone-list" *ngIf="app.zones && app.zones.length > 0">
          <li *ngFor="let z of app.zones">
            {{ z.zone.nom }}
            <button class="btn btn-ghost" (click)="desaffecter(app, z.zone.id)">Désaffecter</button>
          </li>
        </ul>
      </div>
    </div>

    <!-- ── Popover : modifier une application ────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="editTarget && editDraft as draft" (click)="closeEdit()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="saveEdit($event)">
        <div class="popover-head">
          <h3>Modifier « {{ editTarget.nom }} »</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeEdit()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <div class="grid-2">
          <label class="field">Nom<input type="text" [value]="draft.nom" (input)="draft.nom = $any($event.target).value" required /></label>
          <label class="field">
            Criticité
            <select [value]="draft.criticite" (change)="draft.criticite = $any($event.target).value">
              <option value="HAUTE">Haute</option>
              <option value="MOYENNE">Moyenne</option>
              <option value="BASSE">Basse</option>
            </select>
          </label>
        </div>
        <label class="field">Description<textarea [value]="draft.description || ''" (input)="draft.description = $any($event.target).value"></textarea></label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeEdit()">Annuler</button>
          <button type="submit" class="btn btn-success" [disabled]="saving">{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
      .table-scroll { overflow-x: auto; }
      .table { width: 100%; min-width: 600px; border-collapse: collapse; }
      .table th, .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); }
      .row-actions { display: flex; gap: 0.4rem; white-space: nowrap; }
      .muted { color: var(--color-text-muted); margin-top: 0.35rem; font-size: 0.9rem; }
      hr { border: none; border-top: 1px solid var(--color-border); margin: 1rem 0; }
      .zone-list { list-style: none; display: grid; gap: 0.4rem; }
      .zone-list li { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.6rem; border: 1px solid var(--color-border); border-radius: 8px; }
      .inline-form { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.6rem; }
      .inline-form input { padding: 0.6rem 0.75rem; border: 1px solid var(--color-border); border-radius: 8px; font: inherit; flex: 1; min-width: 140px; }
    `,
  ],
})
export class ApplicationsComponent implements OnInit {
  tab: Tab = 'portefeuille';
  applications: Application[] = [];
  newApp: { nom: string; description?: string; criticite: Criticite } = { nom: '', criticite: 'MOYENNE' };
  creating = false;
  createPopover = false;
  viewTarget: Application | null = null;
  editTarget: Application | null = null;
  editDraft: { nom: string; description?: string; criticite: Criticite } | null = null;
  saving = false;
  newService: { nom: string; description?: string } = { nom: '' };

  constructor(
    private urbanisationService: UrbanisationService,
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

  openCreate(): void {
    this.newApp = { nom: '', criticite: 'MOYENNE' };
    this.createPopover = true;
  }

  closeCreate(): void {
    this.createPopover = false;
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
        this.creating = false;
        this.closeCreate();
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

  openView(app: Application): void {
    this.viewTarget = app;
    this.newService = { nom: '' };
    if (app.zones && app.services) return; // déjà chargé
    // GET /applications/:id renvoie les zones affectées et les services, absents de la liste.
    this.urbanisationService.getApplication(app.id).subscribe({
      next: (detail) => {
        app.zones = detail.zones;
        app.services = detail.services;
      },
      error: () => this.toast.error("Impossible de charger le détail de cette application."),
    });
  }

  closeView(): void {
    this.viewTarget = null;
  }

  addService(app: Application, event: Event): void {
    event.preventDefault();
    if (!this.newService.nom.trim()) return;
    this.urbanisationService.addService(app.id, this.newService).subscribe({
      next: (service) => {
        app.services = [...(app.services ?? []), service];
        app._count = { zones: app._count?.zones ?? 0, services: (app._count?.services ?? 0) + 1 };
        this.newService = { nom: '' };
        this.toast.success('Service ajouté.');
      },
      error: () => this.toast.error("Impossible d'ajouter ce service."),
    });
  }

  removeService(app: Application, serviceId: string): void {
    this.urbanisationService.removeService(serviceId).subscribe({
      next: () => {
        app.services = (app.services ?? []).filter((s) => s.id !== serviceId);
        if (app._count) app._count.services = Math.max(0, app._count.services - 1);
        this.toast.success('Service retiré.');
      },
      error: () => this.toast.error('Impossible de retirer ce service.'),
    });
  }

  openEdit(app: Application): void {
    this.editTarget = app;
    this.editDraft = { nom: app.nom, description: app.description ?? '', criticite: app.criticite };
  }

  closeEdit(): void {
    this.editTarget = null;
    this.editDraft = null;
  }

  saveEdit(event: Event): void {
    event.preventDefault();
    if (!this.editTarget || !this.editDraft || !this.editDraft.nom.trim()) return;
    this.saving = true;
    this.urbanisationService.updateApplication(this.editTarget.id, this.editDraft).subscribe({
      next: (updated) => {
        this.applications = this.applications.map((a) => (a.id === updated.id ? { ...a, ...updated } : a));
        this.saving = false;
        this.closeEdit();
        this.toast.success('Application modifiée.');
      },
      error: () => {
        this.saving = false;
        this.toast.error('Impossible de modifier cette application.');
      },
    });
  }

  desaffecter(app: Application, zoneId: string): void {
    this.urbanisationService.desaffecter(zoneId, app.id).subscribe({
      next: () => {
        app.zones = (app.zones ?? []).filter((z) => z.zone.id !== zoneId);
        this.load();
        this.toast.success('Application désaffectée.');
      },
      error: () => this.toast.error('Impossible de désaffecter cette application.'),
    });
  }
}
