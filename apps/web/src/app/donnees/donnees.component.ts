import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DataEntity, DataRelation, DonneesService, TypeCardinalite } from './donnees.service';
import { DonneesCanevasComponent } from './donnees-canevas.component';
import { ToastService } from '../shared/toast.service';
import { ConfirmDialogService } from '../shared/confirm-dialog.service';
import { PaginationComponent } from '../shared/pagination.component';
import { DEFAULT_PAGE_SIZE } from '../shared/pagination.interface';

type Tab = 'entites' | 'relations' | 'diagramme';

const CARDINALITE_LABEL: Record<TypeCardinalite, string> = {
  UN_A_UN: '1 — 1',
  UN_A_PLUSIEURS: '1 — N',
  PLUSIEURS_A_PLUSIEURS: 'N — N',
};
const CARDINALITES: TypeCardinalite[] = Object.keys(CARDINALITE_LABEL) as TypeCardinalite[];

const ICONS: Record<string, string> = {
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash:
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
};

@Component({
  selector: 'app-donnees',
  standalone: true,
  imports: [CommonModule, DonneesCanevasComponent, PaginationComponent],
  template: `
    <p class="muted step-question">Quelles informations sont nécessaires au fonctionnement de l'entreprise ? Où sont-elles stockées et qui en est responsable ?</p>

    <div class="tabs">
      <button class="tab" [class.active]="tab === 'entites'" (click)="tab = 'entites'">Entités</button>
      <button class="tab" [class.active]="tab === 'relations'" (click)="tab = 'relations'">Relations</button>
      <button class="tab" [class.active]="tab === 'diagramme'" (click)="tab = 'diagramme'">Diagramme de classe</button>
    </div>

    <section *ngIf="tab === 'entites'">
      <div class="page-header">
        <h3>Entités ({{ entitiesTotal }})</h3>
        <button type="button" class="btn btn-primary" (click)="openCreateEntity()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
          Ajouter une entité
        </button>
      </div>

      <section class="card" *ngFor="let entity of entities">
        <div class="entity-header">
          <div>
            <strong>{{ entity.nom }}</strong>
            <p class="muted" *ngIf="entity.description">{{ entity.description }}</p>
            <p class="muted" *ngIf="entity.proprietaire">Propriétaire : {{ entity.proprietaire }}</p>
          </div>
          <div class="row-actions">
            <button type="button" class="icon-btn icon-btn-view" title="Consulter" (click)="openEntityView(entity)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('eye')"></svg>
            </button>
            <button type="button" class="icon-btn icon-btn-edit" title="Modifier" (click)="openEntityEdit(entity)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('edit')"></svg>
            </button>
            <button type="button" class="icon-btn icon-btn-danger" title="Supprimer" (click)="removeEntity(entity)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('trash')"></svg>
            </button>
          </div>
        </div>

        <table class="attr-table" *ngIf="entity.attributs.length > 0">
          <thead><tr><th>Attribut</th><th>Type</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let attr of entity.attributs">
              <td>{{ attr.nom }}</td>
              <td>{{ attr.type }}</td>
              <td><button class="btn btn-ghost" (click)="removeAttribute(entity, attr.id)">Retirer</button></td>
            </tr>
          </tbody>
        </table>

        <form class="inline-form" (submit)="addAttribute(entity, $event)">
          <input type="text" placeholder="Nom de l'attribut" [value]="newAttr.nom" (input)="newAttr.nom = $any($event.target).value" required />
          <input type="text" placeholder="Type (ex. string, int, date)" [value]="newAttr.type" (input)="newAttr.type = $any($event.target).value" required />
          <button type="submit" class="btn btn-outline">Ajouter</button>
        </form>
      </section>

      <div class="empty-state" *ngIf="entities.length === 0">Aucune entité de données définie.</div>
      <app-pagination [page]="entitiesPage" [total]="entitiesTotal" [pageSize]="entitiesPageSize" (pageChange)="onEntitiesPageChange($event)" />
    </section>

    <section *ngIf="tab === 'relations'">
      <div class="page-header">
        <h3>Relations ({{ relationsTotal }})</h3>
        <button type="button" class="btn btn-primary" (click)="openCreateRelation()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
          Ajouter une relation
        </button>
      </div>

      <section class="card">
        <div class="empty-state" *ngIf="relations.length === 0">Aucune relation.</div>
        <div class="table-scroll" *ngIf="relations.length > 0">
          <table class="table">
            <thead><tr><th>Source</th><th>Cardinalité</th><th>Cible</th><th>Libellé</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let r of relations">
                <td>{{ r.source.nom }}</td>
                <td>{{ cardinaliteLabel(r.cardinalite) }}</td>
                <td>{{ r.target.nom }}</td>
                <td>{{ r.label || '—' }}</td>
                <td class="row-actions">
                  <button type="button" class="icon-btn icon-btn-danger" title="Supprimer" (click)="removeRelation(r)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('trash')"></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-pagination [page]="relationsPage" [total]="relationsTotal" [pageSize]="relationsPageSize" (pageChange)="onRelationsPageChange($event)" />
      </section>
    </section>

    <section *ngIf="tab === 'diagramme'">
      <app-donnees-canevas (changed)="loadEntities(); loadRelations()" />
    </section>

    <!-- ── Popover : ajouter une entité ──────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="createEntityPopover" (click)="closeCreateEntity()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="createEntity($event)">
        <div class="popover-head">
          <h3>Ajouter une entité</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeCreateEntity()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <label class="field">Nom<input type="text" [value]="newEntity.nom" (input)="newEntity.nom = $any($event.target).value" required /></label>
        <label class="field">Description<textarea [value]="newEntity.description || ''" (input)="newEntity.description = $any($event.target).value"></textarea></label>
        <label class="field">Propriétaire<input type="text" placeholder="Qui en est responsable ?" [value]="newEntity.proprietaire || ''" (input)="newEntity.proprietaire = $any($event.target).value" /></label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCreateEntity()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creatingEntity">{{ creatingEntity ? 'Création…' : 'Créer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Popover : consulter une entité ────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="entityViewTarget as e" (click)="closeEntityView()">
      <div class="popover-card" (click)="$event.stopPropagation()">
        <div class="popover-head">
          <h3>Fiche entité</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeEntityView()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <dl class="fiche-list">
          <dt>Nom</dt><dd>{{ e.nom }}</dd>
          <dt>Description</dt><dd>{{ e.description || '—' }}</dd>
          <dt>Propriétaire</dt><dd>{{ e.proprietaire || '—' }}</dd>
          <dt>Attributs</dt><dd>{{ e.attributs.length }}</dd>
        </dl>
      </div>
    </div>

    <!-- ── Popover : modifier une entité ─────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="entityEditTarget && entityEditDraft as draft" (click)="closeEntityEdit()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="saveEntityEdit($event)">
        <div class="popover-head">
          <h3>Modifier « {{ entityEditTarget.nom }} »</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeEntityEdit()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <label class="field">Nom<input type="text" [value]="draft.nom" (input)="draft.nom = $any($event.target).value" required /></label>
        <label class="field">Description<textarea [value]="draft.description || ''" (input)="draft.description = $any($event.target).value"></textarea></label>
        <label class="field">Propriétaire<input type="text" placeholder="Qui en est responsable ?" [value]="draft.proprietaire || ''" (input)="draft.proprietaire = $any($event.target).value" /></label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeEntityEdit()">Annuler</button>
          <button type="submit" class="btn btn-success" [disabled]="savingEntity">{{ savingEntity ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Popover : ajouter une relation ────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="createRelationPopover" (click)="closeCreateRelation()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="createRelation($event)">
        <div class="popover-head">
          <h3>Ajouter une relation</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeCreateRelation()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <div class="grid-2">
          <label class="field">
            Source
            <select [value]="newRelation.sourceId" (change)="newRelation.sourceId = $any($event.target).value">
              <option value="" disabled>Choisir une entité</option>
              <option *ngFor="let e of entitiesAll" [value]="e.id">{{ e.nom }}</option>
            </select>
          </label>
          <label class="field">
            Cible
            <select [value]="newRelation.targetId" (change)="newRelation.targetId = $any($event.target).value">
              <option value="" disabled>Choisir une entité</option>
              <option *ngFor="let e of entitiesAll" [value]="e.id">{{ e.nom }}</option>
            </select>
          </label>
        </div>
        <label class="field">
          Cardinalité
          <select [value]="newRelation.cardinalite" (change)="newRelation.cardinalite = $any($event.target).value">
            <option *ngFor="let c of cardinalites" [value]="c">{{ cardinaliteLabel(c) }}</option>
          </select>
        </label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCreateRelation()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creatingRelation">{{ creatingRelation ? 'Création…' : 'Créer' }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
      .entity-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; gap: 1rem; }
      .row-actions { display: flex; gap: 0.4rem; flex-shrink: 0; }
      .table-scroll { overflow-x: auto; }
      .table { width: 100%; min-width: 500px; border-collapse: collapse; }
      .table th, .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); }
      .muted { color: var(--color-text-muted); margin-top: 0.25rem; font-size: 0.9rem; }
      .attr-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
      .attr-table th { text-align: left; padding: 0.5rem 0.6rem; font-size: 0.8rem; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); }
      .attr-table td { padding: 0.5rem 0.6rem; border-bottom: 1px solid var(--color-border); font-size: 0.9rem; }
      .inline-form { display: flex; gap: 0.5rem; flex-wrap: wrap; }
      .inline-form input { padding: 0.6rem 0.75rem; border: 1px solid var(--color-border); border-radius: 8px; font: inherit; }
      .card { margin-bottom: 1.25rem; }
      .list { list-style: none; display: grid; gap: 0.6rem; }
      .list-item { display: flex; justify-content: space-between; align-items: center; padding: 0.85rem; border: 1px solid var(--color-border); border-radius: 12px; }
    `,
  ],
})
export class DonneesComponent implements OnInit {
  tab: Tab = 'entites';
  cardinalites = CARDINALITES;

  entities: DataEntity[] = [];
  entitiesPage = 1;
  entitiesTotal = 0;
  entitiesPageSize = DEFAULT_PAGE_SIZE;
  /** Toutes les entités, sans pagination : source des menus déroulants Source/Cible du formulaire Relations. */
  entitiesAll: DataEntity[] = [];
  newEntity: { nom: string; description?: string; proprietaire?: string } = { nom: '' };
  creatingEntity = false;
  createEntityPopover = false;
  entityViewTarget: DataEntity | null = null;
  entityEditTarget: DataEntity | null = null;
  entityEditDraft: { nom: string; description?: string; proprietaire?: string } | null = null;
  savingEntity = false;

  newAttr: { nom: string; type: string } = { nom: '', type: '' };

  relations: DataRelation[] = [];
  relationsPage = 1;
  relationsTotal = 0;
  relationsPageSize = DEFAULT_PAGE_SIZE;
  newRelation: { sourceId: string; targetId: string; cardinalite: TypeCardinalite } = {
    sourceId: '',
    targetId: '',
    cardinalite: 'UN_A_PLUSIEURS',
  };
  creatingRelation = false;
  createRelationPopover = false;

  constructor(
    private donneesService: DonneesService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadEntities();
    this.loadEntitiesAll();
    this.loadRelations();
  }

  icon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] ?? '');
  }

  openCreateEntity(): void {
    this.newEntity = { nom: '' };
    this.createEntityPopover = true;
  }

  closeCreateEntity(): void {
    this.createEntityPopover = false;
  }

  openEntityView(entity: DataEntity): void {
    this.entityViewTarget = entity;
  }

  closeEntityView(): void {
    this.entityViewTarget = null;
  }

  openEntityEdit(entity: DataEntity): void {
    this.entityEditTarget = entity;
    this.entityEditDraft = {
      nom: entity.nom,
      description: entity.description ?? '',
      proprietaire: entity.proprietaire ?? '',
    };
  }

  closeEntityEdit(): void {
    this.entityEditTarget = null;
    this.entityEditDraft = null;
  }

  saveEntityEdit(event: Event): void {
    event.preventDefault();
    if (!this.entityEditTarget || !this.entityEditDraft || !this.entityEditDraft.nom.trim()) return;
    this.savingEntity = true;
    this.donneesService.update(this.entityEditTarget.id, this.entityEditDraft).subscribe({
      next: () => {
        this.savingEntity = false;
        this.closeEntityEdit();
        this.loadEntities();
        this.toast.success('Entité modifiée.');
      },
      error: () => {
        this.savingEntity = false;
        this.toast.error('Impossible de modifier cette entité.');
      },
    });
  }

  openCreateRelation(): void {
    this.newRelation = { sourceId: '', targetId: '', cardinalite: 'UN_A_PLUSIEURS' };
    this.createRelationPopover = true;
  }

  closeCreateRelation(): void {
    this.createRelationPopover = false;
  }

  cardinaliteLabel(c: TypeCardinalite): string {
    return CARDINALITE_LABEL[c];
  }

  loadEntities(): void {
    this.donneesService.listPaginated(this.entitiesPage, this.entitiesPageSize).subscribe({
      next: (result) => {
        this.entities = result.items;
        this.entitiesTotal = result.total;
      },
      error: () => this.toast.error('Impossible de charger les entités.'),
    });
  }

  loadEntitiesAll(): void {
    this.donneesService.list().subscribe({
      next: (entities) => (this.entitiesAll = entities),
      error: () => this.toast.error('Impossible de charger les entités.'),
    });
  }

  onEntitiesPageChange(page: number): void {
    this.entitiesPage = page;
    this.loadEntities();
  }

  createEntity(event: Event): void {
    event.preventDefault();
    this.creatingEntity = true;
    this.donneesService.create(this.newEntity).subscribe({
      next: () => {
        this.creatingEntity = false;
        this.closeCreateEntity();
        this.loadEntities();
        this.loadEntitiesAll();
        this.toast.success('Entité créée.');
      },
      error: () => {
        this.creatingEntity = false;
        this.toast.error('Impossible de créer cette entité.');
      },
    });
  }

  async removeEntity(entity: DataEntity): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Supprimer l'entité « ${entity.nom} » ?`);
    if (!confirmed) return;
    this.donneesService.delete(entity.id).subscribe({
      next: () => {
        this.loadEntities();
        this.loadEntitiesAll();
        this.loadRelations();
        this.toast.success('Entité supprimée.');
      },
      error: () => this.toast.error('Impossible de supprimer cette entité.'),
    });
  }

  addAttribute(entity: DataEntity, event: Event): void {
    event.preventDefault();
    if (!this.newAttr.nom.trim() || !this.newAttr.type.trim()) return;
    this.donneesService.addAttribute(entity.id, this.newAttr).subscribe({
      next: () => {
        this.newAttr = { nom: '', type: '' };
        this.loadEntities();
        this.loadEntitiesAll();
        this.toast.success('Attribut ajouté.');
      },
      error: () => this.toast.error("Impossible d'ajouter cet attribut."),
    });
  }

  removeAttribute(entity: DataEntity, attributeId: string): void {
    this.donneesService.removeAttribute(attributeId).subscribe({
      next: () => {
        this.loadEntities();
        this.loadEntitiesAll();
        this.toast.success('Attribut retiré.');
      },
      error: () => this.toast.error("Impossible de retirer cet attribut."),
    });
  }

  loadRelations(): void {
    this.donneesService.listRelationsPaginated(this.relationsPage, this.relationsPageSize).subscribe({
      next: (result) => {
        this.relations = result.items;
        this.relationsTotal = result.total;
      },
      error: () => this.toast.error('Impossible de charger les relations.'),
    });
  }

  onRelationsPageChange(page: number): void {
    this.relationsPage = page;
    this.loadRelations();
  }

  createRelation(event: Event): void {
    event.preventDefault();
    if (!this.newRelation.sourceId || !this.newRelation.targetId) {
      this.toast.error('Choisissez une source et une cible.');
      return;
    }
    if (this.newRelation.sourceId === this.newRelation.targetId) {
      this.toast.error('La source et la cible doivent être différentes.');
      return;
    }
    this.creatingRelation = true;
    this.donneesService.createRelation(this.newRelation).subscribe({
      next: () => {
        this.creatingRelation = false;
        this.closeCreateRelation();
        this.loadRelations();
        this.toast.success('Relation créée.');
      },
      error: () => {
        this.creatingRelation = false;
        this.toast.error('Impossible de créer cette relation.');
      },
    });
  }

  async removeRelation(relation: DataRelation): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      `Supprimer la relation « ${relation.source.nom} → ${relation.target.nom} » ?`,
    );
    if (!confirmed) return;
    this.donneesService.removeRelation(relation.id).subscribe({
      next: () => {
        this.loadRelations();
        this.toast.success('Relation supprimée.');
      },
      error: () => this.toast.error('Impossible de supprimer cette relation.'),
    });
  }
}
