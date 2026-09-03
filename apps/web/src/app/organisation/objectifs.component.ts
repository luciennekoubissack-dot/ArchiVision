import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../auth/auth.service';
import { ObjectifService, Objectif } from './objectif.service';
import { ToastService } from '../shared/toast.service';
import { ConfirmDialogService } from '../shared/confirm-dialog.service';
import { exportToExcel } from '../shared/excel.util';
import { PaginationComponent } from '../shared/pagination.component';
import { DEFAULT_PAGE_SIZE } from '../shared/pagination.interface';

type StatutObjectif = 'AS_IS' | 'TO_BE' | 'LES_DEUX';

interface ObjectifDraft {
  nom: string;
  description?: string;
  sousObjectif?: string;
  statut: StatutObjectif;
  objectifAsIsId?: string;
}

const STATUT_LABEL: Record<StatutObjectif, string> = {
  AS_IS: 'AS-IS',
  TO_BE: 'TO-BE',
  LES_DEUX: 'Les deux',
};
const STATUT_BADGE: Record<StatutObjectif, string> = {
  AS_IS: 'badge-neutral',
  TO_BE: 'badge-success',
  LES_DEUX: 'badge-warning',
};
const STATUTS: StatutObjectif[] = ['LES_DEUX', 'AS_IS', 'TO_BE'];

const ICONS: Record<string, string> = {
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash:
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/>',
};

@Component({
  selector: 'app-objectifs',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  template: `
    <div class="page-header">
      <h3>Objectifs ({{ total }})</h3>
      <div class="header-actions">
        <button type="button" class="btn btn-outline" *ngIf="total > 0" (click)="exportObjectifs()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('download')"></svg>
          Exporter (Excel)
        </button>
        <button type="button" class="btn btn-primary" *ngIf="canWrite" (click)="openCreate()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
          Ajouter un objectif
        </button>
      </div>
    </div>
    <p class="hint" *ngIf="!canWrite">Lecture seule .</p>

    <section class="card">
      <div class="empty-state" *ngIf="objectifs.length === 0">Aucun objectif défini pour cette organisation.</div>
      <div class="table-scroll" *ngIf="objectifs.length > 0">
        <table class="table">
          <thead><tr><th>Intitulé</th><th>Description</th><th>Sous-objectif</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let objectif of objectifs">
              <td>{{ objectif.nom }}</td>
              <td>{{ objectif.description || '—' }}</td>
              <td>{{ objectif.sousObjectif || '—' }}</td>
              <td>
                <span class="badge" [class]="statutBadge(objectif.statut)">{{ statutLabel(objectif.statut) }}</span>
                <span class="muted evolution-note" *ngIf="objectif.objectifAsIs">← {{ objectif.objectifAsIs.nom }}</span>
              </td>
              <td class="row-actions">
                <button type="button" class="icon-btn icon-btn-view" title="Consulter" (click)="openView(objectif)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('eye')"></svg>
                </button>
                <ng-container *ngIf="canWrite">
                  <button type="button" class="icon-btn icon-btn-edit" title="Modifier" (click)="openEdit(objectif)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('edit')"></svg>
                  </button>
                  <button type="button" class="icon-btn icon-btn-danger" title="Supprimer" (click)="remove(objectif)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('trash')"></svg>
                  </button>
                </ng-container>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <app-pagination [page]="page" [total]="total" [pageSize]="pageSize" (pageChange)="onPageChange($event)" />
    </section>

    <!-- ── Popover : ajouter un objectif ─────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="createPopover" (click)="closeCreate()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="create($event)">
        <div class="popover-head">
          <h3>Ajouter un objectif</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeCreate()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <label class="field">
          Intitulé
          <input type="text" [value]="newObjectif.nom" (input)="newObjectif.nom = $any($event.target).value" required />
        </label>
        <label class="field">
          Description
          <textarea [value]="newObjectif.description || ''" (input)="newObjectif.description = $any($event.target).value"></textarea>
        </label>
        <label class="field">
          Sous-objectif
          <input type="text" [value]="newObjectif.sousObjectif || ''" (input)="newObjectif.sousObjectif = $any($event.target).value" />
        </label>
        <label class="field">
          Statut
          <select [value]="newObjectif.statut" (change)="onCreateStatutChange($any($event.target).value)">
            <option *ngFor="let s of statuts" [value]="s">{{ statutLabel(s) }}</option>
          </select>
        </label>
        <label class="field" *ngIf="newObjectif.statut === 'TO_BE'">
          Objectif AS-IS d'origine (optionnel)
          <select [value]="newObjectif.objectifAsIsId || ''" (change)="newObjectif.objectifAsIsId = $any($event.target).value || undefined">
            <option value="">— Aucun (objectif entièrement nouveau) —</option>
            <option *ngFor="let o of asIsObjectifs" [value]="o.id">{{ o.nom }}</option>
          </select>
        </label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCreate()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creating">{{ creating ? 'Création…' : "Créer l'objectif" }}</button>
        </div>
      </form>
    </div>

    <!-- ── Popover : consulter un objectif ───────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="viewTarget as o" (click)="closeView()">
      <div class="popover-card" (click)="$event.stopPropagation()">
        <div class="popover-head">
          <h3>Fiche objectif</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeView()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <dl class="fiche-list">
          <dt>Intitulé</dt><dd>{{ o.nom }}</dd>
          <dt>Description</dt><dd>{{ o.description || '—' }}</dd>
          <dt>Sous-objectif</dt><dd>{{ o.sousObjectif || '—' }}</dd>
          <dt>Statut</dt>
          <dd><span class="badge" [class]="statutBadge(o.statut)">{{ statutLabel(o.statut) }}</span></dd>
          <ng-container *ngIf="o.objectifAsIs">
            <dt>Évolution de</dt><dd>{{ o.objectifAsIs.nom }} (AS-IS)</dd>
          </ng-container>
          <ng-container *ngIf="o.objectifsToBe && o.objectifsToBe.length > 0">
            <dt>Évolue vers</dt>
            <dd>{{ toBeNames(o) }}</dd>
          </ng-container>
        </dl>
      </div>
    </div>

    <!-- ── Popover : modifier un objectif ────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="editTarget && editDraft as draft" (click)="closeEdit()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="saveEdit($event)">
        <div class="popover-head">
          <h3>Modifier « {{ editTarget.nom }} »</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeEdit()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <label class="field">
          Intitulé
          <input type="text" [value]="draft.nom" (input)="draft.nom = $any($event.target).value" required />
        </label>
        <label class="field">
          Description
          <textarea [value]="draft.description || ''" (input)="draft.description = $any($event.target).value"></textarea>
        </label>
        <label class="field">
          Sous-objectif
          <input type="text" [value]="draft.sousObjectif || ''" (input)="draft.sousObjectif = $any($event.target).value" />
        </label>
        <label class="field">
          Statut
          <select [value]="draft.statut" (change)="onEditStatutChange($any($event.target).value)">
            <option *ngFor="let s of statuts" [value]="s">{{ statutLabel(s) }}</option>
          </select>
        </label>
        <label class="field" *ngIf="draft.statut === 'TO_BE'">
          Objectif AS-IS d'origine (optionnel)
          <select [value]="draft.objectifAsIsId || ''" (change)="draft.objectifAsIsId = $any($event.target).value || undefined">
            <option value="">— Aucun (objectif entièrement nouveau) —</option>
            <option *ngFor="let o of asIsObjectifs" [value]="o.id" [disabled]="o.id === editTarget?.id">{{ o.nom }}</option>
          </select>
        </label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeEdit()">Annuler</button>
          <button type="submit" class="btn btn-success" [disabled]="saving">{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .hint { color: var(--color-text-muted); margin: -0.75rem 0 1.5rem; font-size: 0.9rem; }
      .header-actions { display: flex; align-items: center; gap: 0.5rem; }
      .table-scroll { overflow-x: auto; }
      .table { width: 100%; min-width: 560px; border-collapse: collapse; }
      .table th, .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); }
      .row-actions { display: flex; gap: 0.4rem; white-space: nowrap; }
      .evolution-note { display: block; font-size: 0.78rem; margin-top: 0.2rem; }
    `,
  ],
})
export class ObjectifsComponent implements OnInit {
  objectifs: Objectif[] = [];
  asIsObjectifs: Objectif[] = [];
  statuts = STATUTS;
  page = 1;
  total = 0;
  pageSize = DEFAULT_PAGE_SIZE;

  creating = false;
  createPopover = false;
  newObjectif: ObjectifDraft = { nom: '', statut: 'LES_DEUX' };

  viewTarget: Objectif | null = null;

  editTarget: Objectif | null = null;
  editDraft: ObjectifDraft | null = null;
  saving = false;

  constructor(
    private auth: AuthService,
    private objectifService: ObjectifService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private sanitizer: DomSanitizer,
  ) {}

  get canWrite(): boolean {
    return this.auth.hasRole('ADMINISTRATEUR', 'ARCHITECTE');
  }

  ngOnInit(): void {
    this.loadObjectifs();
    this.loadAsIsObjectifs();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadObjectifs();
  }

  private loadObjectifs(): void {
    this.objectifService.listPaginated(this.page, this.pageSize).subscribe({
      next: (result) => {
        this.objectifs = result.items;
        this.total = result.total;
      },
      error: () => this.toast.error('Impossible de charger les objectifs.'),
    });
  }

  /** Alimente le sélecteur "Objectif AS-IS d'origine" : a besoin de tous les objectifs AS-IS, pas seulement la page courante. */
  private loadAsIsObjectifs(): void {
    this.objectifService.list().subscribe({
      next: (all) => (this.asIsObjectifs = all.filter((o) => o.statut === 'AS_IS')),
      error: () => this.toast.error('Impossible de charger les objectifs AS-IS.'),
    });
  }

  icon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] ?? '');
  }

  statutLabel(s: StatutObjectif): string {
    return STATUT_LABEL[s];
  }

  toBeNames(o: Objectif): string {
    return (o.objectifsToBe ?? []).map((t) => t.nom).join(', ');
  }

  statutBadge(s: StatutObjectif): string {
    return STATUT_BADGE[s];
  }

  onCreateStatutChange(value: string): void {
    this.newObjectif.statut = value as StatutObjectif;
    if (value !== 'TO_BE') this.newObjectif.objectifAsIsId = undefined;
  }

  onEditStatutChange(value: string): void {
    if (!this.editDraft) return;
    this.editDraft.statut = value as StatutObjectif;
    if (value !== 'TO_BE') this.editDraft.objectifAsIsId = undefined;
  }

  openCreate(): void {
    this.newObjectif = { nom: '', statut: 'LES_DEUX' };
    this.createPopover = true;
  }

  closeCreate(): void {
    this.createPopover = false;
  }

  create(event: Event): void {
    event.preventDefault();
    if (!this.newObjectif.nom.trim()) return;
    this.creating = true;
    this.objectifService.create(this.newObjectif).subscribe({
      next: () => {
        this.creating = false;
        this.closeCreate();
        this.toast.success('Objectif créé.');
        this.loadObjectifs();
        this.loadAsIsObjectifs();
      },
      error: () => {
        this.creating = false;
        this.toast.error("Impossible de créer l'objectif.");
      },
    });
  }

  exportObjectifs(): void {
    this.objectifService.list().subscribe({
      next: (objectifs) =>
        exportToExcel(
          'objectifs',
          'Objectifs',
          objectifs.map((o) => ({
            Intitulé: o.nom,
            Description: o.description ?? '',
            'Sous-objectif': o.sousObjectif ?? '',
            Statut: this.statutLabel(o.statut),
            'Évolution de': o.objectifAsIs?.nom ?? '',
          })),
        ),
      error: () => this.toast.error("Impossible d'exporter les objectifs."),
    });
  }

  openView(objectif: Objectif): void {
    this.viewTarget = objectif;
  }

  closeView(): void {
    this.viewTarget = null;
  }

  openEdit(objectif: Objectif): void {
    this.editTarget = objectif;
    this.editDraft = {
      nom: objectif.nom,
      description: objectif.description ?? '',
      sousObjectif: objectif.sousObjectif ?? '',
      statut: objectif.statut,
      objectifAsIsId: objectif.objectifAsIsId ?? undefined,
    };
  }

  closeEdit(): void {
    this.editTarget = null;
    this.editDraft = null;
  }

  saveEdit(event: Event): void {
    event.preventDefault();
    if (!this.editTarget || !this.editDraft || !this.editDraft.nom.trim()) return;
    this.saving = true;
    this.objectifService.update(this.editTarget.id, this.editDraft).subscribe({
      next: (updated) => {
        this.objectifs = this.objectifs.map((o) => (o.id === updated.id ? updated : o));
        this.saving = false;
        this.closeEdit();
        this.toast.success('Objectif modifié.');
        this.loadAsIsObjectifs();
      },
      error: () => {
        this.saving = false;
        this.toast.error("Impossible de modifier l'objectif.");
      },
    });
  }

  async remove(objectif: Objectif): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Supprimer l'objectif « ${objectif.nom} » ?`);
    if (!confirmed) return;
    this.objectifService.delete(objectif.id).subscribe({
      next: () => {
        this.toast.success('Objectif supprimé.');
        this.loadObjectifs();
        this.loadAsIsObjectifs();
      },
      error: () => this.toast.error("Impossible de supprimer l'objectif."),
    });
  }
}
