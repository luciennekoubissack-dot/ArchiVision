import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CreatePolitiquePayload, Politique, PolitiqueService } from './politique.service';
import { ChangementService, CreateChangementPayload, DemandeChangement, StatutChangement } from './changement.service';
import { ConformiteItem, ConformiteService, StatutConformite } from './conformite.service';
import { Solution, SolutionService } from './solution.service';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';
import { exportToExcel } from './excel.util';

type Tab = 'politiques' | 'conformite' | 'changements' | 'rapport';

const STATUT_CHANGEMENT_LABEL: Record<StatutChangement, string> = {
  PROPOSE: 'Proposé',
  APPROUVE: 'Approuvé',
  REJETE: 'Rejeté',
  IMPLEMENTE: 'Implémenté',
};
const STATUT_CHANGEMENT_BADGE: Record<StatutChangement, string> = {
  PROPOSE: 'badge-neutral',
  APPROUVE: 'badge-warning',
  REJETE: 'badge-danger',
  IMPLEMENTE: 'badge-success',
};
const STATUTS_CHANGEMENT: StatutChangement[] = ['PROPOSE', 'APPROUVE', 'REJETE', 'IMPLEMENTE'];

const STATUT_CONFORMITE_LABEL: Record<StatutConformite, string> = {
  CONFORME: 'Conforme',
  NON_CONFORME: 'Non conforme',
  A_EVALUER: 'À évaluer',
};
const STATUTS_CONFORMITE: StatutConformite[] = ['CONFORME', 'NON_CONFORME', 'A_EVALUER'];

const ICONS: Record<string, string> = {
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  trash:
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/>',
};

@Component({
  selector: 'app-gouvernance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p class="muted step-question">Les solutions respectent-elles les standards d'architecture ? Quels changements sont en cours ?</p>

    <div class="tabs">
      <button class="tab" [class.active]="tab === 'politiques'" (click)="tab = 'politiques'">Politiques</button>
      <button class="tab" [class.active]="tab === 'conformite'" (click)="tab = 'conformite'">Conformité</button>
      <button class="tab" [class.active]="tab === 'changements'" (click)="tab = 'changements'">Changements</button>
      <button class="tab" [class.active]="tab === 'rapport'" (click)="tab = 'rapport'">Rapport</button>
    </div>

    <!-- ── Politiques ────────────────────────────────────────────────────── -->
    <section *ngIf="tab === 'politiques'">
      <div class="page-header">
        <h3>Politiques ({{ politiques.length }})</h3>
        <button type="button" class="btn btn-primary" (click)="openCreatePolitique()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
          Ajouter une politique
        </button>
      </div>
      <section class="card">
        <div class="empty-state" *ngIf="politiques.length === 0">Aucune politique de gouvernance définie.</div>
        <div class="table-scroll" *ngIf="politiques.length > 0">
          <table class="table">
            <thead><tr><th>Nom</th><th>Description</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let p of politiques">
                <td>{{ p.nom }}</td>
                <td>{{ p.description || '—' }}</td>
                <td class="row-actions">
                  <button type="button" class="icon-btn icon-btn-danger" title="Supprimer" (click)="removePolitique(p)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('trash')"></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <!-- ── Popover : ajouter une politique ───────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="createPolitiquePopover" (click)="closeCreatePolitique()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="createPolitique($event)">
        <div class="popover-head">
          <h3>Ajouter une politique</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeCreatePolitique()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <label class="field">Nom<input type="text" [value]="newPolitique.nom" (input)="newPolitique.nom = $any($event.target).value" required /></label>
        <label class="field">Description<textarea [value]="newPolitique.description || ''" (input)="newPolitique.description = $any($event.target).value"></textarea></label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCreatePolitique()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creatingPolitique">{{ creatingPolitique ? 'Création…' : 'Créer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Conformité ────────────────────────────────────────────────────── -->
    <section *ngIf="tab === 'conformite'">
      <div class="empty-state card" *ngIf="solutions.length === 0 || politiques.length === 0">
        La matrice de conformité nécessite au moins une solution (module Opportunités & solutions) et une politique.
      </div>
      <section class="card" *ngIf="solutions.length > 0 && politiques.length > 0">
        <h3>Matrice de conformité</h3>
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th>Solution</th>
                <th *ngFor="let p of politiques">{{ p.nom }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of solutions">
                <td>{{ s.nom }}</td>
                <td *ngFor="let p of politiques">
                  <select [value]="cellValue(s, p) ?? ''" (change)="onCellChange(s, p, $any($event.target).value)">
                    <option value="">—</option>
                    <option *ngFor="let st of statutsConformite" [value]="st">{{ statutConformiteLabel(st) }}</option>
                  </select>
                </td>
                <td>
                  <button type="button" class="btn btn-ghost" [disabled]="savingRow[s.id]" (click)="saveRow(s)">
                    {{ savingRow[s.id] ? 'Enregistrement…' : 'Enregistrer' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <!-- ── Changements ───────────────────────────────────────────────────── -->
    <section *ngIf="tab === 'changements'">
      <div class="page-header">
        <h3>Demandes de changement ({{ changements.length }})</h3>
        <button type="button" class="btn btn-primary" (click)="openCreateChangement()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
          Ajouter une demande
        </button>
      </div>
      <section class="card">
        <div class="empty-state" *ngIf="changements.length === 0">Aucune demande de changement.</div>
        <div class="table-scroll" *ngIf="changements.length > 0">
          <table class="table">
            <thead><tr><th>Titre</th><th>Description</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let c of changements">
                <td>{{ c.titre }}</td>
                <td>{{ c.description || '—' }}</td>
                <td><span class="badge" [class]="statutChangementBadge(c.statut)">{{ statutChangementLabel(c.statut) }}</span></td>
                <td class="row-actions">
                  <select [value]="c.statut" (change)="changeStatutChangement(c, $any($event.target).value)">
                    <option *ngFor="let st of statutsChangement" [value]="st">{{ statutChangementLabel(st) }}</option>
                  </select>
                  <button type="button" class="icon-btn icon-btn-danger" title="Supprimer" (click)="removeChangement(c)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('trash')"></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <!-- ── Popover : ajouter une demande de changement ───────────────────── -->
    <div class="popover-backdrop" *ngIf="createChangementPopover" (click)="closeCreateChangement()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="createChangement($event)">
        <div class="popover-head">
          <h3>Ajouter une demande de changement</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeCreateChangement()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <label class="field">Titre<input type="text" [value]="newChangement.titre" (input)="newChangement.titre = $any($event.target).value" required /></label>
        <label class="field">Description<textarea [value]="newChangement.description || ''" (input)="newChangement.description = $any($event.target).value"></textarea></label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCreateChangement()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creatingChangement">{{ creatingChangement ? 'Création…' : 'Créer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Rapport ───────────────────────────────────────────────────────── -->
    <section *ngIf="tab === 'rapport'">
      <div class="page-header">
        <h3>Rapport de gouvernance</h3>
        <button type="button" class="icon-btn" title="Exporter (Excel)" (click)="exportRapport()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('download')"></svg>
        </button>
      </div>
      <div class="stats-grid">
        <section class="card stat">
          <span class="stat-value">{{ conformiteStats.conforme }}</span>
          <span class="stat-label">Conforme</span>
        </section>
        <section class="card stat">
          <span class="stat-value">{{ conformiteStats.nonConforme }}</span>
          <span class="stat-label">Non conforme</span>
        </section>
        <section class="card stat">
          <span class="stat-value">{{ conformiteStats.aEvaluer }}</span>
          <span class="stat-label">À évaluer</span>
        </section>
        <section class="card stat">
          <span class="stat-value">{{ changementsEnCours }}</span>
          <span class="stat-label">Changements en cours</span>
        </section>
      </div>
    </section>
  `,
  styles: [
    `
      .muted { color: var(--color-text-muted); margin-top: 0.25rem; font-size: 0.9rem; }
      .list { list-style: none; display: grid; gap: 0.6rem; }
      .list-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding: 0.85rem 1rem; border: 1px solid var(--color-border); border-radius: 12px; }
      .list-item .badge { margin-left: 0.5rem; }
      .actions { display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end; }
      .actions select { padding: 0.4rem 0.6rem; border: 1px solid var(--color-border); border-radius: 8px; font: inherit; }
      .table-scroll { overflow-x: auto; }
      .table { width: 100%; min-width: 560px; border-collapse: collapse; }
      .table th, .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); }
      .table select { padding: 0.35rem 0.5rem; border: 1px solid var(--color-border); border-radius: 8px; font: inherit; }
      .row-actions { display: flex; align-items: center; gap: 0.5rem; white-space: nowrap; }
      .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }
      .stat { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; padding: 1.5rem 1rem; }
      .stat-value { font-size: 2rem; font-weight: 800; }
      .stat-label { color: var(--color-text-muted); font-size: 0.9rem; }
    `,
  ],
})
export class GouvernanceComponent implements OnInit {
  tab: Tab = 'politiques';
  statutsChangement = STATUTS_CHANGEMENT;
  statutsConformite = STATUTS_CONFORMITE;

  politiques: Politique[] = [];
  creatingPolitique = false;
  createPolitiquePopover = false;
  newPolitique: CreatePolitiquePayload = { nom: '' };

  changements: DemandeChangement[] = [];
  creatingChangement = false;
  createChangementPopover = false;
  newChangement: CreateChangementPayload = { titre: '' };

  solutions: Solution[] = [];
  matrixValues: Record<string, Record<string, StatutConformite>> = {};
  savingRow: Record<string, boolean> = {};

  conformiteStats = { conforme: 0, nonConforme: 0, aEvaluer: 0 };

  constructor(
    private politiqueService: PolitiqueService,
    private changementService: ChangementService,
    private conformiteService: ConformiteService,
    private solutionService: SolutionService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadPolitiques();
    this.loadChangements();
    this.solutionService.list().subscribe({
      next: (solutions) => (this.solutions = solutions),
      error: () => this.toast.error('Impossible de charger les solutions.'),
    });
    this.loadConformites();
  }

  icon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] ?? '');
  }

  statutChangementLabel(s: StatutChangement): string {
    return STATUT_CHANGEMENT_LABEL[s];
  }
  statutChangementBadge(s: StatutChangement): string {
    return STATUT_CHANGEMENT_BADGE[s];
  }
  statutConformiteLabel(s: StatutConformite): string {
    return STATUT_CONFORMITE_LABEL[s];
  }

  get changementsEnCours(): number {
    return this.changements.filter((c) => c.statut === 'PROPOSE' || c.statut === 'APPROUVE').length;
  }

  // ── Politiques ───────────────────────────────────────────────────────────

  loadPolitiques(): void {
    this.politiqueService.list().subscribe({
      next: (politiques) => (this.politiques = politiques),
      error: () => this.toast.error('Impossible de charger les politiques.'),
    });
  }

  openCreatePolitique(): void {
    this.newPolitique = { nom: '' };
    this.createPolitiquePopover = true;
  }
  closeCreatePolitique(): void {
    this.createPolitiquePopover = false;
  }

  createPolitique(event: Event): void {
    event.preventDefault();
    if (!this.newPolitique.nom.trim()) return;
    this.creatingPolitique = true;
    this.politiqueService.create(this.newPolitique).subscribe({
      next: (politique) => {
        this.politiques = [...this.politiques, politique];
        this.creatingPolitique = false;
        this.closeCreatePolitique();
        this.toast.success('Politique créée.');
      },
      error: () => {
        this.creatingPolitique = false;
        this.toast.error('Impossible de créer cette politique.');
      },
    });
  }

  async removePolitique(p: Politique): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Supprimer la politique « ${p.nom} » ?`);
    if (!confirmed) return;
    this.politiqueService.delete(p.id).subscribe({
      next: () => {
        this.politiques = this.politiques.filter((x) => x.id !== p.id);
        this.toast.success('Politique supprimée.');
      },
      error: () => this.toast.error('Impossible de supprimer cette politique.'),
    });
  }

  // ── Changements ──────────────────────────────────────────────────────────

  loadChangements(): void {
    this.changementService.list().subscribe({
      next: (changements) => (this.changements = changements),
      error: () => this.toast.error('Impossible de charger les demandes de changement.'),
    });
  }

  openCreateChangement(): void {
    this.newChangement = { titre: '' };
    this.createChangementPopover = true;
  }
  closeCreateChangement(): void {
    this.createChangementPopover = false;
  }

  createChangement(event: Event): void {
    event.preventDefault();
    if (!this.newChangement.titre.trim()) return;
    this.creatingChangement = true;
    this.changementService.create(this.newChangement).subscribe({
      next: (changement) => {
        this.changements = [changement, ...this.changements];
        this.creatingChangement = false;
        this.closeCreateChangement();
        this.toast.success('Demande de changement créée.');
      },
      error: () => {
        this.creatingChangement = false;
        this.toast.error('Impossible de créer cette demande.');
      },
    });
  }

  changeStatutChangement(c: DemandeChangement, statut: StatutChangement): void {
    this.changementService.update(c.id, { statut }).subscribe({
      next: (updated) => (c.statut = updated.statut),
      error: () => this.toast.error('Impossible de modifier le statut.'),
    });
  }

  async removeChangement(c: DemandeChangement): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Supprimer la demande « ${c.titre} » ?`);
    if (!confirmed) return;
    this.changementService.delete(c.id).subscribe({
      next: () => {
        this.changements = this.changements.filter((x) => x.id !== c.id);
        this.toast.success('Demande supprimée.');
      },
      error: () => this.toast.error('Impossible de supprimer cette demande.'),
    });
  }

  // ── Conformité ───────────────────────────────────────────────────────────

  loadConformites(): void {
    this.conformiteService.listAll().subscribe({
      next: (conformites) => {
        this.matrixValues = {};
        for (const c of conformites) {
          const row = this.matrixValues[c.solution.id] ?? (this.matrixValues[c.solution.id] = {});
          row[c.politiqueId] = c.statut;
        }
        this.computeStats(conformites.map((c) => c.statut));
      },
      error: () => this.toast.error('Impossible de charger les conformités.'),
    });
  }

  private computeStats(statuts: StatutConformite[]): void {
    this.conformiteStats = {
      conforme: statuts.filter((s) => s === 'CONFORME').length,
      nonConforme: statuts.filter((s) => s === 'NON_CONFORME').length,
      aEvaluer: statuts.filter((s) => s === 'A_EVALUER').length,
    };
  }

  cellValue(s: Solution, p: Politique): StatutConformite | null {
    return this.matrixValues[s.id]?.[p.id] ?? null;
  }

  onCellChange(s: Solution, p: Politique, value: string): void {
    const row = this.matrixValues[s.id] ?? (this.matrixValues[s.id] = {});
    if (value === '') delete row[p.id];
    else row[p.id] = value as StatutConformite;
  }

  saveRow(s: Solution): void {
    const row = this.matrixValues[s.id] ?? {};
    const items: ConformiteItem[] = this.politiques
      .filter((p) => row[p.id] !== undefined)
      .map((p) => ({ politiqueId: p.id, statut: row[p.id] }));
    if (items.length === 0) return;

    this.savingRow[s.id] = true;
    this.conformiteService.updateConformites(s.id, items).subscribe({
      next: () => {
        this.savingRow[s.id] = false;
        this.toast.success('Conformité enregistrée.');
        this.loadConformites();
      },
      error: () => {
        this.savingRow[s.id] = false;
        this.toast.error("Impossible d'enregistrer la conformité.");
      },
    });
  }

  // ── Rapport ──────────────────────────────────────────────────────────────

  exportRapport(): void {
    exportToExcel('rapport-gouvernance', 'Rapport', [
      {
        Conforme: this.conformiteStats.conforme,
        'Non conforme': this.conformiteStats.nonConforme,
        'À évaluer': this.conformiteStats.aEvaluer,
        'Changements en cours': this.changementsEnCours,
        'Total demandes de changement': this.changements.length,
      },
    ]);
  }
}
