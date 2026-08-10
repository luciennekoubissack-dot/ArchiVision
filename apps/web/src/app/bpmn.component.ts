import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BpmnElement, BpmnProcessus, BpmnProcessusDetail, BpmnService, TypeBpmn } from './bpmn.service';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';

const TYPE_LABEL: Record<TypeBpmn, string> = {
  EVENEMENT_DEBUT: 'Événement de début',
  EVENEMENT_FIN: 'Événement de fin',
  EVENEMENT_INTERMEDIAIRE: 'Événement intermédiaire',
  TACHE: 'Tâche',
  PASSERELLE_EXCLUSIVE: 'Passerelle exclusive',
  PASSERELLE_PARALLELE: 'Passerelle parallèle',
};
const TYPES: TypeBpmn[] = Object.keys(TYPE_LABEL) as TypeBpmn[];

@Component({
  selector: 'app-bpmn',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header"><h2>Processus métier (BPMN)</h2></div>

    <form class="card form-card" (submit)="createProcessus($event)">
      <h3>Nouveau processus</h3>
      <div class="grid-2">
        <label class="field">Nom<input type="text" [value]="newProcessus.nom" (input)="newProcessus.nom = $any($event.target).value" required /></label>
        <label class="field">Description<input type="text" [value]="newProcessus.description || ''" (input)="newProcessus.description = $any($event.target).value" /></label>
      </div>
      <button type="submit" class="btn btn-primary" [disabled]="creatingProcessus">Créer</button>
    </form>

    <div class="layout">
      <section class="card processus-list">
        <h3>Processus ({{ processus.length }})</h3>
        <div class="empty-state" *ngIf="processus.length === 0">Aucun processus défini.</div>
        <ul class="list" *ngIf="processus.length > 0">
          <li
            class="list-item"
            *ngFor="let p of processus"
            [class.selected]="selected?.id === p.id"
            (click)="select(p)"
          >
            <div>
              <strong>{{ p.nom }}</strong>
              <p class="muted" *ngIf="p.description">{{ p.description }}</p>
              <span class="badge badge-neutral">{{ p._count?.elements || 0 }} élément(s)</span>
            </div>
            <button class="btn btn-danger" (click)="removeProcessus(p, $event)">Supprimer</button>
          </li>
        </ul>
      </section>

      <section class="card processus-detail" *ngIf="selected">
        <h3>{{ selected.nom }}</h3>

        <form class="inline-form" (submit)="addElement($event)">
          <input type="text" placeholder="Nom de l'étape" [value]="newElement.nom" (input)="newElement.nom = $any($event.target).value" required />
          <select [value]="newElement.type" (change)="newElement.type = $any($event.target).value">
            <option *ngFor="let t of types" [value]="t">{{ typeLabel(t) }}</option>
          </select>
          <button type="submit" class="btn btn-outline" [disabled]="addingElement">Ajouter l'étape</button>
        </form>

        <ul class="list" *ngIf="selected.elements.length > 0">
          <li class="list-item" *ngFor="let el of selected.elements">
            <div>
              <strong>{{ el.nom }}</strong>
              <span class="badge badge-neutral">{{ typeLabel(el.type) }}</span>
            </div>
            <button class="btn btn-danger" (click)="removeElement(el)">Supprimer</button>
          </li>
        </ul>
        <div class="empty-state" *ngIf="selected.elements.length === 0">Aucune étape pour l'instant.</div>

        <h4 *ngIf="selected.elements.length > 1">Flux de séquence</h4>
        <form class="inline-form" *ngIf="selected.elements.length > 1" (submit)="addFlow($event)">
          <select [value]="newFlow.sourceId" (change)="newFlow.sourceId = $any($event.target).value">
            <option value="" disabled>Depuis…</option>
            <option *ngFor="let el of selected.elements" [value]="el.id">{{ el.nom }}</option>
          </select>
          <select [value]="newFlow.targetId" (change)="newFlow.targetId = $any($event.target).value">
            <option value="" disabled>Vers…</option>
            <option *ngFor="let el of selected.elements" [value]="el.id">{{ el.nom }}</option>
          </select>
          <button type="submit" class="btn btn-outline" [disabled]="addingFlow">Relier</button>
        </form>

        <ul class="list" *ngIf="allFlows.length > 0">
          <li class="list-item" *ngFor="let flow of allFlows">
            <div>{{ elementName(flow.sourceId) }} → {{ elementName(flow.targetId) }}</div>
            <button class="btn btn-danger" (click)="removeFlow(flow.id)">Supprimer</button>
          </li>
        </ul>
      </section>
    </div>
  `,
  styles: [
    `
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
      .form-card { margin-bottom: 1.5rem; }
      .layout { display: grid; grid-template-columns: 340px 1fr; gap: 1.25rem; align-items: start; }
      .list { list-style: none; display: grid; gap: 0.6rem; margin-top: 1rem; }
      .list-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding: 0.85rem; border: 1px solid var(--color-border); border-radius: 12px; cursor: pointer; }
      .processus-list .list-item.selected { border-color: var(--color-primary); background: var(--color-primary-light); }
      .processus-detail .list-item { cursor: default; }
      .muted { color: var(--color-text-muted); margin-top: 0.25rem; font-size: 0.88rem; }
      .inline-form { display: flex; gap: 0.5rem; margin: 1rem 0; flex-wrap: wrap; }
      .inline-form input, .inline-form select { padding: 0.6rem 0.75rem; border: 1px solid var(--color-border); border-radius: 8px; font: inherit; }
      h4 { margin-top: 1.5rem; }

      @media (max-width: 900px) {
        .layout { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class BpmnComponent implements OnInit {
  types = TYPES;
  processus: BpmnProcessus[] = [];
  selected: BpmnProcessusDetail | null = null;

  newProcessus: { nom: string; description?: string } = { nom: '' };
  creatingProcessus = false;

  newElement: { nom: string; type: TypeBpmn } = { nom: '', type: 'TACHE' };
  addingElement = false;

  newFlow: { sourceId: string; targetId: string } = { sourceId: '', targetId: '' };
  addingFlow = false;

  constructor(
    private bpmnService: BpmnService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.loadProcessus();
  }

  typeLabel(type: TypeBpmn): string {
    return TYPE_LABEL[type];
  }

  get allFlows() {
    if (!this.selected) return [];
    return this.selected.elements.flatMap((el) => el.flowsSource ?? []);
  }

  elementName(id: string): string {
    return this.selected?.elements.find((el) => el.id === id)?.nom ?? '?';
  }

  loadProcessus(): void {
    this.bpmnService.list().subscribe({
      next: (processus) => (this.processus = processus),
      error: () => this.toast.error('Impossible de charger les processus.'),
    });
  }

  createProcessus(event: Event): void {
    event.preventDefault();
    this.creatingProcessus = true;
    this.bpmnService.create(this.newProcessus).subscribe({
      next: () => {
        this.newProcessus = { nom: '' };
        this.creatingProcessus = false;
        this.loadProcessus();
        this.toast.success('Processus créé.');
      },
      error: () => {
        this.creatingProcessus = false;
        this.toast.error('Impossible de créer ce processus.');
      },
    });
  }

  async removeProcessus(p: BpmnProcessus, event: Event): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirmDialog.confirm(`Supprimer le processus « ${p.nom} » ?`);
    if (!confirmed) return;
    this.bpmnService.delete(p.id).subscribe({
      next: () => {
        if (this.selected?.id === p.id) this.selected = null;
        this.loadProcessus();
        this.toast.success('Processus supprimé.');
      },
      error: () => this.toast.error('Impossible de supprimer ce processus.'),
    });
  }

  select(p: BpmnProcessus): void {
    this.bpmnService.get(p.id).subscribe({
      next: (detail) => (this.selected = detail),
      error: () => this.toast.error('Impossible de charger ce processus.'),
    });
  }

  addElement(event: Event): void {
    event.preventDefault();
    if (!this.selected) return;
    this.addingElement = true;
    this.bpmnService.addElement(this.selected.id, this.newElement).subscribe({
      next: () => {
        this.newElement = { nom: '', type: 'TACHE' };
        this.addingElement = false;
        this.select(this.selected!);
        this.loadProcessus();
        this.toast.success('Étape ajoutée.');
      },
      error: () => {
        this.addingElement = false;
        this.toast.error("Impossible d'ajouter cette étape.");
      },
    });
  }

  async removeElement(el: BpmnElement): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Supprimer l'étape « ${el.nom} » ?`);
    if (!confirmed || !this.selected) return;
    this.bpmnService.deleteElement(el.id).subscribe({
      next: () => {
        this.select(this.selected!);
        this.loadProcessus();
        this.toast.success('Étape supprimée.');
      },
      error: () => this.toast.error("Impossible de supprimer cette étape."),
    });
  }

  addFlow(event: Event): void {
    event.preventDefault();
    if (!this.selected || !this.newFlow.sourceId || !this.newFlow.targetId) return;
    if (this.newFlow.sourceId === this.newFlow.targetId) {
      this.toast.error('La source et la cible doivent être différentes.');
      return;
    }
    this.addingFlow = true;
    this.bpmnService.addFlow(this.selected.id, this.newFlow).subscribe({
      next: () => {
        this.newFlow = { sourceId: '', targetId: '' };
        this.addingFlow = false;
        this.select(this.selected!);
        this.toast.success('Flux créé.');
      },
      error: () => {
        this.addingFlow = false;
        this.toast.error('Impossible de créer ce flux.');
      },
    });
  }

  removeFlow(flowId: string): void {
    if (!this.selected) return;
    this.bpmnService.deleteFlow(flowId).subscribe({
      next: () => {
        this.select(this.selected!);
        this.toast.success('Flux supprimé.');
      },
      error: () => this.toast.error('Impossible de supprimer ce flux.'),
    });
  }
}
