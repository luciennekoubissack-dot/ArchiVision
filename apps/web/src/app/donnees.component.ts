import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataEntity, DataRelation, DonneesService, TypeCardinalite } from './donnees.service';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';

type Tab = 'entites' | 'relations';

const CARDINALITE_LABEL: Record<TypeCardinalite, string> = {
  UN_A_UN: '1 — 1',
  UN_A_PLUSIEURS: '1 — N',
  PLUSIEURS_A_PLUSIEURS: 'N — N',
};
const CARDINALITES: TypeCardinalite[] = Object.keys(CARDINALITE_LABEL) as TypeCardinalite[];

@Component({
  selector: 'app-donnees',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header"><h2>Architecture des données</h2></div>

    <div class="tabs">
      <button class="tab" [class.active]="tab === 'entites'" (click)="tab = 'entites'">Entités</button>
      <button class="tab" [class.active]="tab === 'relations'" (click)="tab = 'relations'">Relations</button>
    </div>

    <section *ngIf="tab === 'entites'">
      <form class="card form-card" (submit)="createEntity($event)">
        <h3>Nouvelle entité</h3>
        <label class="field">Nom<input type="text" [value]="newEntity.nom" (input)="newEntity.nom = $any($event.target).value" required /></label>
        <label class="field">Description<textarea [value]="newEntity.description || ''" (input)="newEntity.description = $any($event.target).value"></textarea></label>
        <button type="submit" class="btn btn-primary" [disabled]="creatingEntity">Créer</button>
      </form>

      <section class="card" *ngFor="let entity of entities">
        <div class="entity-header">
          <div>
            <strong>{{ entity.nom }}</strong>
            <p class="muted" *ngIf="entity.description">{{ entity.description }}</p>
          </div>
          <button class="btn btn-danger" (click)="removeEntity(entity)">Supprimer</button>
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
    </section>

    <section *ngIf="tab === 'relations'">
      <form class="card form-card" (submit)="createRelation($event)">
        <h3>Nouvelle relation</h3>
        <div class="grid-2">
          <label class="field">
            Source
            <select [value]="newRelation.sourceId" (change)="newRelation.sourceId = $any($event.target).value">
              <option value="" disabled>Choisir une entité</option>
              <option *ngFor="let e of entities" [value]="e.id">{{ e.nom }}</option>
            </select>
          </label>
          <label class="field">
            Cible
            <select [value]="newRelation.targetId" (change)="newRelation.targetId = $any($event.target).value">
              <option value="" disabled>Choisir une entité</option>
              <option *ngFor="let e of entities" [value]="e.id">{{ e.nom }}</option>
            </select>
          </label>
        </div>
        <label class="field">
          Cardinalité
          <select [value]="newRelation.cardinalite" (change)="newRelation.cardinalite = $any($event.target).value">
            <option *ngFor="let c of cardinalites" [value]="c">{{ cardinaliteLabel(c) }}</option>
          </select>
        </label>
        <button type="submit" class="btn btn-primary" [disabled]="creatingRelation">Créer</button>
      </form>

      <section class="card">
        <h3>Relations ({{ relations.length }})</h3>
        <div class="empty-state" *ngIf="relations.length === 0">Aucune relation.</div>
        <ul class="list" *ngIf="relations.length > 0">
          <li class="list-item" *ngFor="let r of relations">
            <div>
              <strong>{{ r.source.nom }}</strong> ({{ cardinaliteLabel(r.cardinalite) }}) <strong>{{ r.target.nom }}</strong>
            </div>
            <button class="btn btn-danger" (click)="removeRelation(r)">Supprimer</button>
          </li>
        </ul>
      </section>
    </section>
  `,
  styles: [
    `
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
      .form-card { margin-bottom: 1.5rem; }
      .entity-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
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
  newEntity: { nom: string; description?: string } = { nom: '' };
  creatingEntity = false;

  newAttr: { nom: string; type: string } = { nom: '', type: '' };

  relations: DataRelation[] = [];
  newRelation: { sourceId: string; targetId: string; cardinalite: TypeCardinalite } = {
    sourceId: '',
    targetId: '',
    cardinalite: 'UN_A_PLUSIEURS',
  };
  creatingRelation = false;

  constructor(
    private donneesService: DonneesService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.loadEntities();
    this.loadRelations();
  }

  cardinaliteLabel(c: TypeCardinalite): string {
    return CARDINALITE_LABEL[c];
  }

  loadEntities(): void {
    this.donneesService.list().subscribe({
      next: (entities) => (this.entities = entities),
      error: () => this.toast.error('Impossible de charger les entités.'),
    });
  }

  createEntity(event: Event): void {
    event.preventDefault();
    this.creatingEntity = true;
    this.donneesService.create(this.newEntity).subscribe({
      next: () => {
        this.newEntity = { nom: '' };
        this.creatingEntity = false;
        this.loadEntities();
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
        this.toast.success('Attribut ajouté.');
      },
      error: () => this.toast.error("Impossible d'ajouter cet attribut."),
    });
  }

  removeAttribute(entity: DataEntity, attributeId: string): void {
    this.donneesService.removeAttribute(attributeId).subscribe({
      next: () => {
        this.loadEntities();
        this.toast.success('Attribut retiré.');
      },
      error: () => this.toast.error("Impossible de retirer cet attribut."),
    });
  }

  loadRelations(): void {
    this.donneesService.listRelations().subscribe({
      next: (relations) => (this.relations = relations),
      error: () => this.toast.error('Impossible de charger les relations.'),
    });
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
        this.newRelation = { sourceId: '', targetId: '', cardinalite: 'UN_A_PLUSIEURS' };
        this.creatingRelation = false;
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
