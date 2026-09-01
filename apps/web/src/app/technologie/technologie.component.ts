import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TechComponent, TechnologieService, TypeTechComponent } from './technologie.service';
import { ToastService } from '../shared/toast.service';
import { ConfirmDialogService } from '../shared/confirm-dialog.service';
import { TechnologieCanevasComponent } from './technologie-canevas.component';
import { PaginationComponent } from '../shared/pagination.component';
import { DEFAULT_PAGE_SIZE } from '../shared/pagination.interface';

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
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash:
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
};

@Component({
  selector: 'app-technologie',
  standalone: true,
  imports: [CommonModule, TechnologieCanevasComponent, PaginationComponent],
  template: `
    <p class="muted step-question">Sur quelle infrastructure (serveurs, réseaux, cloud, bases de données) tournent les applications, et pourquoi ces choix ?</p>

    <div class="tabs" *ngIf="!hideDiagram">
      <button class="tab" [class.active]="tab === 'composants'" (click)="tab = 'composants'">Composants</button>
      <button class="tab" [class.active]="tab === 'diagramme'" (click)="tab = 'diagramme'">Diagramme de déploiement</button>
    </div>

    <app-technologie-canevas *ngIf="tab === 'diagramme' && !hideDiagram" (changed)="loadComponents()" />

    <section *ngIf="tab === 'composants'">
      <div class="page-header">
        <h3>Composants ({{ componentsTotal }})</h3>
        <button type="button" class="btn btn-primary" (click)="openCreate()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
          Ajouter un composant
        </button>
      </div>

      <section class="card">
        <div class="empty-state" *ngIf="components.length === 0">Aucun composant technique défini.</div>
        <div class="table-scroll" *ngIf="components.length > 0">
          <table class="table">
            <thead><tr><th>Nom</th><th>Type</th><th>Description</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let comp of components">
                <td>{{ comp.nom }}</td>
                <td><span class="badge badge-neutral">{{ typeLabel(comp.type) }}</span></td>
                <td>{{ comp.description || '—' }}</td>
                <td class="row-actions">
                  <button type="button" class="icon-btn icon-btn-edit" title="Modifier" (click)="openEdit(comp)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('edit')"></svg>
                  </button>
                  <button type="button" class="icon-btn icon-btn-danger" title="Supprimer" (click)="removeComponent(comp)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('trash')"></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-pagination [page]="componentsPage" [total]="componentsTotal" [pageSize]="componentsPageSize" (pageChange)="onComponentsPageChange($event)" />
      </section>
    </section>

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
        <label class="field">Description<textarea placeholder="Rôle du composant et justification du choix technologique." [value]="newComponent.description || ''" (input)="newComponent.description = $any($event.target).value"></textarea></label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCreate()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creating">{{ creating ? 'Création…' : 'Créer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Popover : modifier un composant ───────────────────────────────── -->
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
            Type
            <select [value]="draft.type" (change)="draft.type = $any($event.target).value">
              <option *ngFor="let t of types" [value]="t">{{ typeLabel(t) }}</option>
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
      .muted { color: var(--color-text-muted); margin-top: 0.25rem; font-size: 0.9rem; }
    `,
  ],
})
export class TechnologieComponent implements OnInit {
  /** Masque l'onglet et l'aperçu du diagramme (utilisé dans l'assistant « Révision »). */
  @Input() hideDiagram = false;

  tab: Tab = 'composants';
  types = TYPES;
  components: TechComponent[] = [];
  componentsPage = 1;
  componentsTotal = 0;
  componentsPageSize = DEFAULT_PAGE_SIZE;

  newComponent: { nom: string; type: TypeTechComponent; description?: string } = { nom: '', type: 'SERVEUR' };
  creating = false;
  createPopover = false;
  editTarget: TechComponent | null = null;
  editDraft: { nom: string; type: TypeTechComponent; description?: string } | null = null;
  saving = false;

  constructor(
    private technologieService: TechnologieService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadComponents();
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
    this.technologieService.listPaginated(this.componentsPage, this.componentsPageSize).subscribe({
      next: (result) => {
        this.components = result.items;
        this.componentsTotal = result.total;
      },
      error: () => this.toast.error('Impossible de charger les composants techniques.'),
    });
  }

  onComponentsPageChange(page: number): void {
    this.componentsPage = page;
    this.loadComponents();
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

  openEdit(comp: TechComponent): void {
    this.editTarget = comp;
    this.editDraft = { nom: comp.nom, type: comp.type, description: comp.description ?? '' };
  }

  closeEdit(): void {
    this.editTarget = null;
    this.editDraft = null;
  }

  saveEdit(event: Event): void {
    event.preventDefault();
    if (!this.editTarget || !this.editDraft || !this.editDraft.nom.trim()) return;
    this.saving = true;
    this.technologieService.update(this.editTarget.id, this.editDraft).subscribe({
      next: () => {
        this.saving = false;
        this.closeEdit();
        this.loadComponents();
        this.toast.success('Composant modifié.');
      },
      error: () => {
        this.saving = false;
        this.toast.error('Impossible de modifier ce composant.');
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
}
