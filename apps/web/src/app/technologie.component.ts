import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TechComponent, TechnologieService, TypeTechComponent } from './technologie.service';
import { Application, UrbanisationService } from './urbanisation.service';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';

const TYPE_LABEL: Record<TypeTechComponent, string> = {
  SERVEUR: 'Serveur',
  RESEAU: 'Réseau',
  CLOUD: 'Cloud',
  BASE_DE_DONNEES: 'Base de données',
  MIDDLEWARE: 'Middleware',
};
const TYPES: TypeTechComponent[] = Object.keys(TYPE_LABEL) as TypeTechComponent[];

@Component({
  selector: 'app-technologie',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header"><h2>Architecture technologique</h2></div>

    <form class="card form-card" (submit)="createComponent($event)">
      <h3>Nouveau composant</h3>
      <div class="grid-2">
        <label class="field">Nom<input type="text" [value]="newComponent.nom" (input)="newComponent.nom = $any($event.target).value" required /></label>
        <label class="field">
          Type
          <select [value]="newComponent.type" (change)="newComponent.type = $any($event.target).value">
            <option *ngFor="let t of types" [value]="t">{{ typeLabel(t) }}</option>
          </select>
        </label>
      </div>
      <label class="field">Description<textarea [value]="newComponent.description || ''" (input)="newComponent.description = $any($event.target).value"></textarea></label>
      <button type="submit" class="btn btn-primary" [disabled]="creating">Créer</button>
    </form>

    <section class="card" *ngFor="let comp of components">
      <div class="component-header">
        <div>
          <strong>{{ comp.nom }}</strong>
          <span class="badge badge-neutral">{{ typeLabel(comp.type) }}</span>
          <p class="muted" *ngIf="comp.description">{{ comp.description }}</p>
        </div>
        <button class="btn btn-danger" (click)="removeComponent(comp)">Supprimer</button>
      </div>

      <ul class="list" *ngIf="comp.deploiements.length > 0">
        <li class="list-item" *ngFor="let d of comp.deploiements">
          <span>{{ d.application.nom }}</span>
          <button class="btn btn-ghost" (click)="undeploy(comp, d)">Retirer</button>
        </li>
      </ul>
      <div class="empty-state" *ngIf="comp.deploiements.length === 0">Aucune application déployée ici.</div>

      <form class="inline-form" (submit)="deploy(comp, $event)">
        <select [value]="deployTarget[comp.id] || ''" (change)="deployTarget[comp.id] = $any($event.target).value">
          <option value="" disabled>Choisir une application</option>
          <option *ngFor="let app of applications" [value]="app.id">{{ app.nom }}</option>
        </select>
        <button type="submit" class="btn btn-outline">Déployer</button>
      </form>
    </section>

    <div class="empty-state" *ngIf="components.length === 0">Aucun composant technique défini.</div>
  `,
  styles: [
    `
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
      .form-card { margin-bottom: 1.5rem; }
      .card { margin-bottom: 1.25rem; }
      .component-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
      .muted { color: var(--color-text-muted); margin-top: 0.25rem; font-size: 0.9rem; }
      .list { list-style: none; display: grid; gap: 0.5rem; margin-bottom: 1rem; }
      .list-item { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.75rem; border: 1px solid var(--color-border); border-radius: 10px; }
      .inline-form { display: flex; gap: 0.5rem; }
      .inline-form select { padding: 0.6rem 0.75rem; border: 1px solid var(--color-border); border-radius: 8px; font: inherit; flex: 1; }
    `,
  ],
})
export class TechnologieComponent implements OnInit {
  types = TYPES;
  components: TechComponent[] = [];
  applications: Application[] = [];
  deployTarget: Record<string, string> = {};

  newComponent: { nom: string; type: TypeTechComponent; description?: string } = { nom: '', type: 'SERVEUR' };
  creating = false;

  constructor(
    private technologieService: TechnologieService,
    private urbanisationService: UrbanisationService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.loadComponents();
    this.urbanisationService.listApplications().subscribe({
      next: (applications) => (this.applications = applications),
      error: () => this.toast.error('Impossible de charger les applications.'),
    });
  }

  typeLabel(type: TypeTechComponent): string {
    return TYPE_LABEL[type];
  }

  loadComponents(): void {
    this.technologieService.list().subscribe({
      next: (components) => (this.components = components),
      error: () => this.toast.error('Impossible de charger les composants techniques.'),
    });
  }

  createComponent(event: Event): void {
    event.preventDefault();
    this.creating = true;
    this.technologieService.create(this.newComponent).subscribe({
      next: () => {
        this.newComponent = { nom: '', type: 'SERVEUR' };
        this.creating = false;
        this.loadComponents();
        this.toast.success('Composant créé.');
      },
      error: () => {
        this.creating = false;
        this.toast.error('Impossible de créer ce composant.');
      },
    });
  }

  async removeComponent(comp: TechComponent): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Supprimer le composant « ${comp.nom} » ?`);
    if (!confirmed) return;
    this.technologieService.delete(comp.id).subscribe({
      next: () => {
        this.loadComponents();
        this.toast.success('Composant supprimé.');
      },
      error: () => this.toast.error('Impossible de supprimer ce composant.'),
    });
  }

  deploy(comp: TechComponent, event: Event): void {
    event.preventDefault();
    const applicationId = this.deployTarget[comp.id];
    if (!applicationId) return;
    this.technologieService.deployer({ applicationId, techComponentId: comp.id }).subscribe({
      next: () => {
        delete this.deployTarget[comp.id];
        this.loadComponents();
        this.toast.success('Application déployée.');
      },
      error: (err) => {
        this.toast.error(
          err?.status === 409 ? 'Cette application est déjà déployée ici.' : 'Impossible de déployer cette application.',
        );
      },
    });
  }

  undeploy(comp: TechComponent, deploiement: { applicationId: string }): void {
    this.technologieService.undeployer(comp.id, deploiement.applicationId).subscribe({
      next: () => {
        this.loadComponents();
        this.toast.success('Application retirée.');
      },
      error: () => this.toast.error("Impossible de retirer cette application."),
    });
  }
}
