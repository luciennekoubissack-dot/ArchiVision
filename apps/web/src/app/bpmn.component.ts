import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BpmnProcessus, BpmnService, TypeProcessus } from './bpmn.service';
import { BpmnCanevasComponent } from './bpmn-canevas.component';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';

/// Ordre d'affichage façon « maison des processus » : pilotage (toit) en
/// premier, métier (corps, crée la valeur) au centre, support (fondations).
const TYPE_PROCESSUS_ORDER: TypeProcessus[] = ['PILOTAGE', 'METIER', 'SUPPORT'];
const TYPE_PROCESSUS_LABEL: Record<TypeProcessus, string> = {
  PILOTAGE: 'Processus de pilotage',
  METIER: 'Processus métier',
  SUPPORT: 'Processus support',
};
const TYPE_PROCESSUS_HINT: Record<TypeProcessus, string> = {
  PILOTAGE: "Définissent la stratégie et pilotent les autres processus (ex. gouvernance, qualité, contrôle de gestion).",
  METIER: "Créent directement de la valeur pour le client (ex. vente, production, livraison).",
  SUPPORT: "Nécessaires au fonctionnement interne, sans valeur directe pour le client (ex. RH, IT, comptabilité).",
};
const TYPES_PROCESSUS: TypeProcessus[] = Object.keys(TYPE_PROCESSUS_LABEL) as TypeProcessus[];

const ICONS: Record<string, string> = {
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  trash:
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
};

@Component({
  selector: 'app-bpmn',
  standalone: true,
  imports: [CommonModule, BpmnCanevasComponent],
  template: `
    <p class="muted intro">
      Comment fonctionne l'entreprise ? Classez chaque processus selon son rôle : un processus <strong>métier</strong>
      crée directement de la valeur pour le client, un processus <strong>support</strong> fait fonctionner
      l'entreprise en interne, un processus de <strong>pilotage</strong> définit la stratégie et pilote les autres.
    </p>

    <div class="page-header">
      <h3>Processus ({{ processus.length }})</h3>
      <button type="button" class="btn btn-primary" (click)="openCreate()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
        Ajouter un processus
      </button>
    </div>

    <div class="layout">
      <div class="processus-list">
        <div class="card empty-state" *ngIf="processus.length === 0">Aucun processus défini.</div>
        <ng-container *ngFor="let t of typesProcessus">
          <section class="card processus-groupe" *ngIf="processusParType(t).length > 0">
            <h4>{{ typeProcessusLabel(t) }}</h4>
            <p class="muted hint">{{ typeProcessusHint(t) }}</p>
            <ul class="list">
              <li
                class="list-item"
                *ngFor="let p of processusParType(t)"
                [class.selected]="selected?.id === p.id"
                (click)="select(p)"
              >
                <div class="processus-info">
                  <strong>{{ p.nom }}</strong>
                  <p class="muted" *ngIf="p.description">{{ p.description }}</p>
                  <span class="badge badge-neutral">{{ p._count?.elements || 0 }} élément(s)</span>
                </div>
                <button type="button" class="icon-btn icon-btn-danger" title="Supprimer" (click)="removeProcessus(p, $event)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('trash')"></svg>
                </button>
              </li>
            </ul>
          </section>
        </ng-container>
      </div>

      <section class="card processus-detail" *ngIf="selected">
        <h3>{{ selected.nom }}</h3>
        <app-bpmn-canevas [processusId]="selected.id" (changed)="loadProcessus()" />
      </section>
    </div>

    <!-- ── Popover : ajouter un processus ────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="createPopover" (click)="closeCreate()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="createProcessus($event)">
        <div class="popover-head">
          <h3>Ajouter un processus</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeCreate()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <label class="field">Nom<input type="text" [value]="newProcessus.nom" (input)="newProcessus.nom = $any($event.target).value" required /></label>
        <label class="field">Description<input type="text" [value]="newProcessus.description || ''" (input)="newProcessus.description = $any($event.target).value" /></label>
        <label class="field">
          Catégorie
          <select [value]="newProcessus.type" (change)="newProcessus.type = $any($event.target).value">
            <option *ngFor="let t of typesProcessus" [value]="t">{{ typeProcessusLabel(t) }}</option>
          </select>
        </label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCreate()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creatingProcessus">{{ creatingProcessus ? 'Création…' : 'Créer' }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
      .intro { max-width: 760px; margin: -0.5rem 0 1.25rem; }
      .processus-groupe h4 { margin-bottom: 0.15rem; }
      .processus-groupe .hint { margin-top: 0; font-size: 0.85rem; }
      .layout { display: flex; flex-direction: column; gap: 1.25rem; }
      .processus-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; align-items: start; }
      .list { list-style: none; display: grid; gap: 0.6rem; margin-top: 1rem; }
      .list-item { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; padding: 0.85rem; border: 1px solid var(--color-border); border-radius: 12px; cursor: pointer; }
      .processus-info { flex: 1; min-width: 0; }
      .processus-info strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .processus-info p.muted { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .processus-list .list-item.selected { border-color: var(--color-primary); background: var(--color-primary-light); }
      .processus-detail .list-item { cursor: default; }
      .muted { color: var(--color-text-muted); margin-top: 0.25rem; font-size: 0.88rem; }

      @media (max-width: 900px) {
        .layout { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class BpmnComponent implements OnInit {
  typesProcessus = TYPE_PROCESSUS_ORDER;
  processus: BpmnProcessus[] = [];
  selected: BpmnProcessus | null = null;

  newProcessus: { nom: string; description?: string; type: TypeProcessus } = { nom: '', type: 'METIER' };
  creatingProcessus = false;
  createPopover = false;

  constructor(
    private bpmnService: BpmnService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadProcessus();
  }

  icon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] ?? '');
  }

  openCreate(): void {
    this.newProcessus = { nom: '', type: 'METIER' };
    this.createPopover = true;
  }

  closeCreate(): void {
    this.createPopover = false;
  }

  typeProcessusLabel(type: TypeProcessus): string {
    return TYPE_PROCESSUS_LABEL[type];
  }

  typeProcessusHint(type: TypeProcessus): string {
    return TYPE_PROCESSUS_HINT[type];
  }

  processusParType(type: TypeProcessus): BpmnProcessus[] {
    return this.processus.filter((p) => p.type === type);
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
        this.creatingProcessus = false;
        this.closeCreate();
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
    this.selected = p;
  }
}
