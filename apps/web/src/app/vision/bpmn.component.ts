import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { BpmnProcessus, BpmnService, TypeProcessus } from './bpmn.service';
import { BpmnCanevasComponent } from './bpmn-canevas.component';
import { ToastService } from '../shared/toast.service';
import { ConfirmDialogService } from '../shared/confirm-dialog.service';

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
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
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
            <div class="table-scroll">
              <table class="table">
                <thead><tr><th>Nom</th><th>Description</th><th>Éléments</th><th></th></tr></thead>
                <tbody>
                  <tr
                    *ngFor="let p of processusParType(t)"
                    [class.selected]="selected?.id === p.id"
                    (click)="select(p)"
                  >
                    <td>{{ p.nom }}</td>
                    <td>{{ p.description || '—' }}</td>
                    <td><span class="badge badge-neutral">{{ p._count?.elements || 0 }}</span></td>
                    <td class="row-actions">
                      <button type="button" class="icon-btn" title="Modifier" (click)="openEdit(p, $event)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('edit')"></svg>
                      </button>
                      <button type="button" class="icon-btn icon-btn-danger" title="Supprimer" (click)="removeProcessus(p, $event)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('trash')"></svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </ng-container>
      </div>

      <section class="card processus-detail" *ngIf="selected && !hideDiagram">
        <div class="processus-detail-head">
          <div>
            <span class="badge badge-neutral">{{ typeProcessusLabel(selected.type) }}</span>
            <h3>{{ selected.nom }}</h3>
            <p class="muted" *ngIf="selected.description">{{ selected.description }}</p>
          </div>
          <div class="detail-actions">
            <button
              type="button"
              class="btn btn-ghost"
              *ngIf="selected.etapes"
              [disabled]="regeneratingDiagram"
              (click)="regenererDiagramme()"
            >
              {{ regeneratingDiagram ? 'Génération…' : (selectedElementCount() ? 'Régénérer depuis les étapes' : 'Générer le diagramme depuis les étapes') }}
            </button>
            <button type="button" class="btn btn-ghost" (click)="openEdit(selected, $event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('edit')"></svg>
              Modifier
            </button>
          </div>
        </div>
        <app-bpmn-canevas #canevas [processusId]="selected.id" (changed)="loadProcessus()" />
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
          Étapes
          <span class="field-hint">Une étape par ligne. À la création, une proposition de diagramme (début, tâches, passerelles, fin) est générée puis modifiable dans l'éditeur.</span>
          <textarea
            rows="8"
            [value]="newProcessus.etapes || ''"
            (input)="newProcessus.etapes = $any($event.target).value"
            placeholder="Recevoir la demande&#10;Vérifier les pièces&#10;Le dossier est-il complet ?&#10;= Oui : Instruire la demande&#10;= Non : Réclamer les pièces ; &#8594; &quot;Vérifier les pièces&quot;&#10;Notifier la décision au client"
          ></textarea>
        </label>
        <ng-container [ngTemplateOutlet]="aideEtapes"></ng-container>
        <label class="field">
          Catégorie
          <select (change)="newProcessus.type = $any($event.target).value">
            <option *ngFor="let t of typesProcessus" [value]="t" [selected]="t === newProcessus.type">{{ typeProcessusLabel(t) }}</option>
          </select>
        </label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCreate()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creatingProcessus">{{ creatingProcessus ? 'Création…' : 'Créer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Popover : modifier un processus ───────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="editPopover as e" (click)="closeEdit()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="saveEdit($event)">
        <div class="popover-head">
          <h3>Modifier le processus</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeEdit()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <label class="field">Nom<input type="text" [value]="e.nom" (input)="e.nom = $any($event.target).value" required /></label>
        <label class="field">Description<input type="text" [value]="e.description || ''" (input)="e.description = $any($event.target).value" /></label>
        <label class="field">
          Étapes
          <span class="field-hint">Une étape par ligne. Sert de base à la génération du diagramme, possible tant que le diagramme est vide.</span>
          <textarea rows="8" [value]="e.etapes || ''" (input)="e.etapes = $any($event.target).value"></textarea>
        </label>
        <ng-container [ngTemplateOutlet]="aideEtapes"></ng-container>
        <label class="field">
          Catégorie
          <select (change)="e.type = $any($event.target).value">
            <option *ngFor="let t of typesProcessus" [value]="t" [selected]="t === e.type">{{ typeProcessusLabel(t) }}</option>
          </select>
        </label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeEdit()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="savingEdit">{{ savingEdit ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Aide : syntaxe du champ « Étapes » ────────────────────────────── -->
    <ng-template #aideEtapes>
      <details class="field-aide">
        <summary>Syntaxe des décisions et des branches</summary>
        <ul>
          <li><strong>Décision</strong> : une ligne finissant par «&nbsp;?&nbsp;» (ou «&nbsp;Si…&nbsp;», «&nbsp;Selon…&nbsp;»), puis ses branches préfixées par «&nbsp;=&nbsp;» :
            <code>= Oui : Instruire la demande</code>
            <code>= Non : Réclamer les pièces ; Relancer</code>
            Le texte avant «&nbsp;:&nbsp;» est le libellé du flux ; on sépare plusieurs étapes par «&nbsp;;&nbsp;». La première ligne sans «&nbsp;=&nbsp;» est le point de convergence (une passerelle de fusion est ajoutée).</li>
          <li><strong>Boucle</strong> : <code>= Non : &#8594; "Vérifier les pièces"</code> renvoie vers une étape déjà écrite au lieu d'en créer une nouvelle.</li>
          <li><strong>Tâches simultanées</strong> : une ligne <code>En parallèle :</code> puis des branches «&nbsp;=&nbsp;» → passerelle parallèle.</li>
        </ul>
      </details>
    </ng-template>
  `,
  styles: [
    `
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
      .intro { max-width: 760px; margin: -0.5rem 0 1.25rem; }
      .processus-groupe h4 { margin-bottom: 0.15rem; }
      .processus-groupe .hint { margin-top: 0; font-size: 0.85rem; }
      .layout { display: flex; flex-direction: column; gap: 1.25rem; }
      .processus-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; align-items: start; }
      .processus-groupe { min-width: 0; }
      .table-scroll { overflow-x: auto; margin-top: 1rem; }
      .table { width: 100%; min-width: 280px; border-collapse: collapse; }
      .table th, .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); }
      .table tbody tr { cursor: pointer; }
      .table tbody tr.selected { background: var(--color-primary-light); }
      .row-actions { display: flex; align-items: center; gap: 0.35rem; white-space: nowrap; }
      .processus-detail-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
      .processus-detail-head h3 { margin: 0.3rem 0 0.2rem; }
      .processus-detail-head .btn { flex-shrink: 0; display: inline-flex; align-items: center; gap: 0.4rem; }
      .detail-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; flex-shrink: 0; }
      .field-hint { display: block; font-weight: 400; font-size: 0.78rem; color: var(--color-text-muted); margin: 0.15rem 0 0.35rem; }
      .field textarea { width: 100%; resize: vertical; font-family: inherit; font-size: 0.9rem; padding: 0.5rem 0.6rem; border: 1px solid var(--color-border); border-radius: var(--radius-sm); white-space: pre; overflow-wrap: normal; }
      .field-aide { font-size: 0.8rem; color: var(--color-text-muted); margin: 0.1rem 0 0.6rem; }
      .field-aide summary { cursor: pointer; user-select: none; }
      .field-aide ul { margin: 0.5rem 0 0; padding-left: 1.1rem; display: flex; flex-direction: column; gap: 0.5rem; }
      .field-aide code { display: block; font-size: 0.78rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 0.1rem 0.35rem; margin: 0.15rem 0; width: fit-content; }
      .muted { color: var(--color-text-muted); margin-top: 0.25rem; font-size: 0.88rem; }

      @media (max-width: 900px) {
        .layout { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class BpmnComponent implements OnInit {
  /** Masque l'éditeur de diagramme BPMN d'un processus (assistant « Révision »). */
  @Input() hideDiagram = false;

  @ViewChild('canevas') canevas?: BpmnCanevasComponent;

  typesProcessus = TYPE_PROCESSUS_ORDER;
  processus: BpmnProcessus[] = [];
  selected: BpmnProcessus | null = null;

  newProcessus: { nom: string; description?: string; type: TypeProcessus; etapes?: string } = { nom: '', type: 'METIER' };
  creatingProcessus = false;
  createPopover = false;

  editPopover: { id: string; nom: string; description?: string; type: TypeProcessus; etapes?: string } | null = null;
  savingEdit = false;
  regeneratingDiagram = false;

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
    const etapes = this.newProcessus.etapes?.trim();
    const payload = {
      nom: this.newProcessus.nom.trim(),
      description: this.newProcessus.description?.trim() || undefined,
      type: this.newProcessus.type,
      etapes: etapes || undefined,
    };
    this.creatingProcessus = true;
    this.bpmnService.create(payload).subscribe({
      next: (created) => {
        this.creatingProcessus = false;
        this.closeCreate();
        this.bpmnService.list().subscribe({
          next: (list) => {
            this.processus = list;
            this.selected = list.find((p) => p.id === created.id) ?? { ...created };
          },
          error: () => this.toast.error('Impossible de charger les processus.'),
        });
        this.toast.success(etapes ? 'Processus créé, proposition de diagramme générée.' : 'Processus créé.');
      },
      error: () => {
        this.creatingProcessus = false;
        this.toast.error('Impossible de créer ce processus.');
      },
    });
  }

  /** Nombre d'éléments du processus sélectionné, quelle que soit sa forme (détail ou item de liste). */
  selectedElementCount(): number {
    const s = this.selected as (BpmnProcessus & { elements?: unknown[] }) | null;
    return s?.elements?.length ?? s?._count?.elements ?? 0;
  }

  async regenererDiagramme(): Promise<void> {
    if (!this.selected || this.regeneratingDiagram) return;

    if (this.selectedElementCount() > 0) {
      this.toast.error(
        "Le diagramme contient déjà des éléments : supprimez-les depuis le plan avant de générer à partir des étapes.",
      );
      return;
    }

    this.regeneratingDiagram = true;
    this.bpmnService.generateDiagramme(this.selected.id).subscribe({
      next: (detail) => {
        this.regeneratingDiagram = false;
        if (this.selected?.id === detail.id) this.selected = detail;
        this.canevas?.reload();
        this.loadProcessus();
        this.toast.success('Diagramme généré depuis les étapes.');
      },
      error: (err: HttpErrorResponse) => {
        this.regeneratingDiagram = false;
        this.toast.error(err?.error?.message ?? 'Impossible de générer le diagramme.');
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

  openEdit(p: BpmnProcessus, event: Event): void {
    event.stopPropagation();
    this.editPopover = { id: p.id, nom: p.nom, description: p.description ?? '', type: p.type, etapes: p.etapes ?? '' };
  }

  closeEdit(): void {
    this.editPopover = null;
  }

  saveEdit(event: Event): void {
    event.preventDefault();
    const e = this.editPopover;
    if (!e || !e.nom.trim()) return;
    this.savingEdit = true;
    this.bpmnService
      .update(e.id, { nom: e.nom.trim(), description: e.description, type: e.type, etapes: e.etapes?.trim() ?? '' })
      .subscribe({
        next: (updated) => {
          this.savingEdit = false;
          this.editPopover = null;
          if (this.selected?.id === updated.id) {
            this.selected = updated;
            // Le canevas ne recharge automatiquement que sur un changement de
            // processusId (voir ngOnChanges) : sur un simple ré-enregistrement
            // du même processus, il faut le forcer pour refléter une
            // proposition de diagramme éventuellement générée par cette étape.
            this.canevas?.reload();
          }
          this.loadProcessus();
          this.toast.success('Processus modifié.');
        },
        error: () => {
          this.savingEdit = false;
          this.toast.error('Impossible de modifier ce processus.');
        },
      });
  }
}
