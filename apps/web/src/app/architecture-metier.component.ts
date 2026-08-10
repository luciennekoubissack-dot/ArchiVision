import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ArchimateService,
  CapaciteMetier,
  ElementArchimate,
  RelationArchimate,
  TypeElement,
  TypeRelation,
} from './archimate.service';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';

type Tab = 'capacites' | 'elements' | 'relations';

const TYPE_ELEMENT_LABEL: Record<TypeElement, string> = {
  VISION: 'Vision',
  OBJECTIF_ARCHIMATE: "Objectif d'architecture",
  PRINCIPE: 'Principe',
  EXIGENCE: 'Exigence',
  ACTEUR_METIER: 'Acteur métier',
  ROLE_METIER: 'Rôle métier',
  PROCESSUS_METIER: 'Processus métier',
  SERVICE_METIER: 'Service métier',
  OBJET_METIER: 'Objet métier',
};
const TYPES_ELEMENT: TypeElement[] = Object.keys(TYPE_ELEMENT_LABEL) as TypeElement[];

const TYPE_RELATION_LABEL: Record<TypeRelation, string> = {
  ASSIGNATION: 'Assignation',
  COMPOSITION: 'Composition',
  REALISATION: 'Réalisation',
  ASSOCIATION: 'Association',
};
const TYPES_RELATION: TypeRelation[] = Object.keys(TYPE_RELATION_LABEL) as TypeRelation[];

@Component({
  selector: 'app-architecture-metier',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header"><h2>Architecture métier</h2></div>

    <div class="tabs">
      <button class="tab" [class.active]="tab === 'capacites'" (click)="tab = 'capacites'">Capacités</button>
      <button class="tab" [class.active]="tab === 'elements'" (click)="tab = 'elements'">Éléments</button>
      <button class="tab" [class.active]="tab === 'relations'" (click)="tab = 'relations'">Relations</button>
    </div>

    <!-- ── Capacités ─────────────────────────────────────────────────────── -->
    <section *ngIf="tab === 'capacites'">
      <form class="card form-card" (submit)="createCapacite($event)">
        <h3>Nouvelle capacité</h3>
        <label class="field">Nom<input type="text" [value]="newCapacite.nom" (input)="newCapacite.nom = $any($event.target).value" required /></label>
        <label class="field">Description<textarea [value]="newCapacite.description || ''" (input)="newCapacite.description = $any($event.target).value"></textarea></label>
        <button type="submit" class="btn btn-primary" [disabled]="creatingCapacite">Créer</button>
      </form>
      <section class="card">
        <h3>Capacités ({{ capacites.length }})</h3>
        <div class="empty-state" *ngIf="capacites.length === 0">Aucune capacité métier.</div>
        <ul class="list" *ngIf="capacites.length > 0">
          <li class="list-item" *ngFor="let capacite of capacites">
            <div>
              <strong>{{ capacite.nom }}</strong>
              <p class="muted" *ngIf="capacite.description">{{ capacite.description }}</p>
              <span class="badge badge-neutral">{{ capacite._count?.elements || 0 }} élément(s) rattaché(s)</span>
            </div>
            <button class="btn btn-danger" (click)="removeCapacite(capacite)">Supprimer</button>
          </li>
        </ul>
      </section>
    </section>

    <!-- ── Éléments ──────────────────────────────────────────────────────── -->
    <section *ngIf="tab === 'elements'">
      <form class="card form-card" (submit)="createElement($event)">
        <h3>Nouvel élément</h3>
        <div class="grid-2">
          <label class="field">Nom<input type="text" [value]="newElement.nom" (input)="newElement.nom = $any($event.target).value" required /></label>
          <label class="field">
            Type
            <select [value]="newElement.type" (change)="newElement.type = $any($event.target).value">
              <option *ngFor="let t of typesElement" [value]="t">{{ typeElementLabel(t) }}</option>
            </select>
          </label>
        </div>
        <label class="field">
          Capacité métier (optionnel)
          <select [value]="newElement.capaciteMetierId || ''" (change)="newElement.capaciteMetierId = $any($event.target).value || undefined">
            <option value="">— Aucune —</option>
            <option *ngFor="let c of capacites" [value]="c.id">{{ c.nom }}</option>
          </select>
        </label>
        <label class="field">Description<textarea [value]="newElement.description || ''" (input)="newElement.description = $any($event.target).value"></textarea></label>
        <button type="submit" class="btn btn-primary" [disabled]="creatingElement">Créer</button>
      </form>

      <section class="card">
        <div class="page-header">
          <h3>Éléments ({{ elements.length }})</h3>
          <select [value]="typeFilter || ''" (change)="filterByType($any($event.target).value)">
            <option value="">Tous les types</option>
            <option *ngFor="let t of typesElement" [value]="t">{{ typeElementLabel(t) }}</option>
          </select>
        </div>
        <div class="empty-state" *ngIf="elements.length === 0">Aucun élément ArchiMate.</div>
        <ul class="list" *ngIf="elements.length > 0">
          <li class="list-item" *ngFor="let element of elements">
            <div>
              <strong>{{ element.nom }}</strong>
              <span class="badge badge-neutral">{{ typeElementLabel(element.type) }}</span>
              <p class="muted" *ngIf="element.capacite">Capacité : {{ element.capacite.nom }}
                <button class="btn btn-ghost" (click)="detachCapacite(element)">Détacher</button>
              </p>
            </div>
            <button class="btn btn-danger" (click)="removeElement(element)">Supprimer</button>
          </li>
        </ul>
      </section>
    </section>

    <!-- ── Relations ─────────────────────────────────────────────────────── -->
    <section *ngIf="tab === 'relations'">
      <form class="card form-card" (submit)="createRelation($event)">
        <h3>Nouvelle relation</h3>
        <div class="grid-2">
          <label class="field">
            Source
            <select [value]="newRelation.sourceId" (change)="newRelation.sourceId = $any($event.target).value">
              <option value="" disabled>Choisir un élément</option>
              <option *ngFor="let e of elements" [value]="e.id">{{ e.nom }}</option>
            </select>
          </label>
          <label class="field">
            Cible
            <select [value]="newRelation.targetId" (change)="newRelation.targetId = $any($event.target).value">
              <option value="" disabled>Choisir un élément</option>
              <option *ngFor="let e of elements" [value]="e.id">{{ e.nom }}</option>
            </select>
          </label>
        </div>
        <label class="field">
          Type
          <select [value]="newRelation.type" (change)="newRelation.type = $any($event.target).value">
            <option *ngFor="let t of typesRelation" [value]="t">{{ typeRelationLabel(t) }}</option>
          </select>
        </label>
        <p class="field-error" *ngIf="relationError">{{ relationError }}</p>
        <button type="submit" class="btn btn-primary" [disabled]="creatingRelation">Créer</button>
      </form>

      <section class="card">
        <h3>Relations ({{ relations.length }})</h3>
        <div class="empty-state" *ngIf="relations.length === 0">Aucune relation.</div>
        <ul class="list" *ngIf="relations.length > 0">
          <li class="list-item" *ngFor="let relation of relations">
            <div>
              <strong>{{ relation.source.nom }}</strong> → <strong>{{ relation.target.nom }}</strong>
              <span class="badge badge-neutral">{{ typeRelationLabel(relation.type) }}</span>
            </div>
            <button class="btn btn-danger" (click)="removeRelation(relation)">Supprimer</button>
          </li>
        </ul>
      </section>
    </section>
  `,
  styles: [
    `
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
      .form-card { margin-bottom: 1.5rem; }
      .list { list-style: none; display: grid; gap: 0.75rem; }
      .list-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding: 1rem; border: 1px solid var(--color-border); border-radius: 12px; }
      .muted { color: var(--color-text-muted); margin-top: 0.35rem; font-size: 0.9rem; }
      .badge { margin-left: 0.5rem; }
    `,
  ],
})
export class ArchitectureMetierComponent implements OnInit {
  tab: Tab = 'capacites';
  typesElement = TYPES_ELEMENT;
  typesRelation = TYPES_RELATION;

  capacites: CapaciteMetier[] = [];
  newCapacite: { nom: string; description?: string } = { nom: '' };
  creatingCapacite = false;

  elements: ElementArchimate[] = [];
  typeFilter: TypeElement | '' = '';
  newElement: { nom: string; type: TypeElement; description?: string; capaciteMetierId?: string } = {
    nom: '',
    type: 'ACTEUR_METIER',
  };
  creatingElement = false;

  relations: RelationArchimate[] = [];
  newRelation: { type: TypeRelation; sourceId: string; targetId: string } = {
    type: 'ASSIGNATION',
    sourceId: '',
    targetId: '',
  };
  creatingRelation = false;
  relationError = '';

  constructor(
    private archimateService: ArchimateService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.loadCapacites();
    this.loadElements();
    this.loadRelations();
  }

  typeElementLabel(type: TypeElement): string {
    return TYPE_ELEMENT_LABEL[type];
  }
  typeRelationLabel(type: TypeRelation): string {
    return TYPE_RELATION_LABEL[type];
  }

  // ── Capacités ────────────────────────────────────────────────────────────

  loadCapacites(): void {
    this.archimateService.listCapacites().subscribe({
      next: (capacites) => (this.capacites = capacites),
      error: () => this.toast.error('Impossible de charger les capacités.'),
    });
  }

  createCapacite(event: Event): void {
    event.preventDefault();
    this.creatingCapacite = true;
    this.archimateService.createCapacite(this.newCapacite).subscribe({
      next: (capacite) => {
        this.capacites = [...this.capacites, capacite];
        this.newCapacite = { nom: '' };
        this.creatingCapacite = false;
        this.toast.success('Capacité créée.');
      },
      error: () => {
        this.creatingCapacite = false;
        this.toast.error('Impossible de créer cette capacité.');
      },
    });
  }

  async removeCapacite(capacite: CapaciteMetier): Promise<void> {
    const count = capacite._count?.elements ?? 0;
    const warning = count > 0 ? ` ${count} élément(s) y sont rattaché(s) et seront détachés.` : '';
    const confirmed = await this.confirmDialog.confirm(`Supprimer la capacité « ${capacite.nom} » ?${warning}`);
    if (!confirmed) return;
    this.archimateService.deleteCapacite(capacite.id).subscribe({
      next: () => {
        this.capacites = this.capacites.filter((c) => c.id !== capacite.id);
        this.toast.success('Capacité supprimée.');
      },
      error: () => this.toast.error('Impossible de supprimer cette capacité.'),
    });
  }

  // ── Éléments ─────────────────────────────────────────────────────────────

  loadElements(): void {
    this.archimateService.listElements(this.typeFilter || undefined).subscribe({
      next: (elements) => (this.elements = elements),
      error: () => this.toast.error('Impossible de charger les éléments.'),
    });
  }

  filterByType(type: string): void {
    this.typeFilter = (type as TypeElement) || '';
    this.loadElements();
  }

  createElement(event: Event): void {
    event.preventDefault();
    this.creatingElement = true;
    this.archimateService.createElement(this.newElement).subscribe({
      next: () => {
        this.newElement = { nom: '', type: 'ACTEUR_METIER' };
        this.creatingElement = false;
        this.loadElements();
        this.toast.success('Élément créé.');
      },
      error: () => {
        this.creatingElement = false;
        this.toast.error("Impossible de créer cet élément.");
      },
    });
  }

  detachCapacite(element: ElementArchimate): void {
    this.archimateService.updateElement(element.id, { capaciteMetierId: null }).subscribe({
      next: () => {
        this.loadElements();
        this.toast.success('Élément détaché de sa capacité.');
      },
      error: () => this.toast.error('Impossible de détacher cet élément.'),
    });
  }

  async removeElement(element: ElementArchimate): Promise<void> {
    const relCount = (element._count?.relationsSource ?? 0) + (element._count?.relationsTarget ?? 0);
    const warning = relCount > 0 ? ` ${relCount} relation(s) impliquant cet élément seront également supprimées.` : '';
    const confirmed = await this.confirmDialog.confirm(`Supprimer l'élément « ${element.nom} » ?${warning}`);
    if (!confirmed) return;
    this.archimateService.deleteElement(element.id).subscribe({
      next: () => {
        this.loadElements();
        this.loadRelations();
        this.toast.success('Élément supprimé.');
      },
      error: () => this.toast.error('Impossible de supprimer cet élément.'),
    });
  }

  // ── Relations ────────────────────────────────────────────────────────────

  loadRelations(): void {
    this.archimateService.listRelations().subscribe({
      next: (relations) => (this.relations = relations),
      error: () => this.toast.error('Impossible de charger les relations.'),
    });
  }

  createRelation(event: Event): void {
    event.preventDefault();
    this.relationError = '';
    if (!this.newRelation.sourceId || !this.newRelation.targetId) {
      this.relationError = 'Choisissez une source et une cible.';
      return;
    }
    if (this.newRelation.sourceId === this.newRelation.targetId) {
      this.relationError = 'La source et la cible doivent être différentes.';
      return;
    }
    this.creatingRelation = true;
    this.archimateService.createRelation(this.newRelation).subscribe({
      next: (relation) => {
        this.relations = [relation, ...this.relations];
        this.newRelation = { type: 'ASSIGNATION', sourceId: '', targetId: '' };
        this.creatingRelation = false;
        this.toast.success('Relation créée.');
      },
      error: () => {
        this.creatingRelation = false;
        this.toast.error('Impossible de créer cette relation.');
      },
    });
  }

  async removeRelation(relation: RelationArchimate): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      `Supprimer la relation « ${relation.source.nom} → ${relation.target.nom} » ?`,
    );
    if (!confirmed) return;
    this.archimateService.deleteRelation(relation.id).subscribe({
      next: () => {
        this.relations = this.relations.filter((r) => r.id !== relation.id);
        this.toast.success('Relation supprimée.');
      },
      error: () => this.toast.error('Impossible de supprimer cette relation.'),
    });
  }
}
