import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TechComponent, TechnologieService, TypeTechComponent } from './technologie.service';
import { Application, UrbanisationService } from '../urbanisation/urbanisation.service';
import { ToastService } from '../shared/toast.service';
import { ConfirmDialogService } from '../shared/confirm-dialog.service';
import { TechnologieCanevasComponent } from './technologie-canevas.component';

type Tab = 'composants' | 'diagramme';

const TYPE_LABEL: Record<TypeTechComponent, string> = {
  SERVEUR: 'Serveur',
  RESEAU: 'Réseau',
  CLOUD: 'Cloud',
  BASE_DE_DONNEES: 'Base de données',
  MIDDLEWARE: 'Middleware',
};
const TYPES: TypeTechComponent[] = Object.keys(TYPE_LABEL) as TypeTechComponent[];

const ICONS: Record<string, string> = {
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
};

@Component({
  selector: 'app-technologie',
  standalone: true,
  imports: [CommonModule, TechnologieCanevasComponent],
  template: `
    <p class="muted step-question">Sur quelle infrastructure (serveurs, réseaux, cloud, bases de données) tournent les applications, et pourquoi ces choix ?</p>

    <div class="tabs">
      <button class="tab" [class.active]="tab === 'composants'" (click)="tab = 'composants'">Composants</button>
      <button class="tab" [class.active]="tab === 'diagramme'" (click)="tab = 'diagramme'">Diagramme de déploiement</button>
    </div>

    <app-technologie-canevas *ngIf="tab === 'diagramme'" />

    <ng-container *ngIf="tab === 'composants'">
    <div class="page-header">
      <h3>Composants ({{ components.length }})</h3>
      <button type="button" class="btn btn-primary" (click)="openCreate()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
        Ajouter un composant
      </button>
    </div>

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
    </ng-container>

    <!-- ── Popover : ajouter un composant ────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="createPopover" (click)="closeCreate()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="createComponent($event)">
        <div class="popover-head">
          <h3>Ajouter un composant</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeCreate()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <div class="grid-2">
          <label class="field">Nom<input type="text" [value]="newComponent.nom" (input)="newComponent.nom = $any($event.target).value" required /></label>
          <label class="field">
            Type
            <select [value]="newComponent.type" (change)="newComponent.type = $any($event.target).value">
              <option *ngFor="let t of types" [value]="t">{{ typeLabel(t) }}</option>
            </select>
          </label>
        </div>
        <label class="field">Justification<textarea placeholder="Pourquoi ce choix technologique ?" [value]="newComponent.description || ''" (input)="newComponent.description = $any($event.target).value"></textarea></label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCreate()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creating">{{ creating ? 'Création…' : 'Créer' }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
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
  tab: Tab = 'composants';
  types = TYPES;
  components: TechComponent[] = [];
  applications: Application[] = [];
  deployTarget: Record<string, string> = {};

  newComponent: { nom: string; type: TypeTechComponent; description?: string } = { nom: '', type: 'SERVEUR' };
  creating = false;
  createPopover = false;

  constructor(
    private technologieService: TechnologieService,
    private urbanisationService: UrbanisationService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadComponents();
    this.urbanisationService.listApplications().subscribe({
      next: (applications) => (this.applications = applications),
      error: () => this.toast.error('Impossible de charger les applications.'),
    });
  }

  icon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] ?? '');
  }

  openCreate(): void {
    this.newComponent = { nom: '', type: 'SERVEUR' };
    this.createPopover = true;
  }

  closeCreate(): void {
    this.createPopover = false;
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
        this.creating = false;
        this.closeCreate();
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
