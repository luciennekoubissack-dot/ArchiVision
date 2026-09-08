import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganisationService } from '../organisation/organisation.service';
import { SuggestionToBeEntity, DomaineSuggestion } from '../api-client/models/suggestion-tobe-entity';
import { ToastService } from './toast.service';

const DOMAINE_LABELS: Record<DomaineSuggestion, string> = {
  objectifs: 'Objectifs stratégiques',
  metier: 'Architecture Métier',
  donnees: 'Architecture Données',
  applicatif: 'Architecture Applicative',
  technologique: 'Architecture Technologique',
};

const DOMAINE_ICONS: Record<DomaineSuggestion, string> = {
  objectifs: '🎯',
  metier: '🏢',
  donnees: '🗄️',
  applicatif: '⚙️',
  technologique: '🖥️',
};

interface SuggestionRow extends SuggestionToBeEntity {
  accepted: boolean | null; // null = pas encore décidé
}

/**
 * Panneau de suggestions TO-BE.
 * Peut être filtré par domaine via l'input `domaine`.
 * Émet `accepted` avec la liste des suggestions acceptées quand l'utilisateur
 * valide (clic sur "Appliquer les suggestions acceptées").
 *
 * Usage :
 * ```html
 * <app-suggestion-tobe [domaine]="'applicatif'" (accepted)="onAccepted($event)"></app-suggestion-tobe>
 * ```
 */
@Component({
  selector: 'app-suggestion-tobe',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="stb-overlay" (click)="close()">
      <div class="stb-panel" (click)="$event.stopPropagation()">
        <div class="stb-header">
          <div>
            <h2 class="stb-title">Suggestions TO-BE</h2>
            <p class="stb-subtitle">
              Suggestions générées à partir de vos éléments AS-IS sans cible TO-BE déclarée.
              Acceptez celles qui correspondent à votre vision, rejetez les autres.
            </p>
          </div>
          <button class="stb-close" (click)="close()" title="Fermer">✕</button>
        </div>

        <div class="stb-loading" *ngIf="loading">Génération des suggestions…</div>
        <div class="stb-empty" *ngIf="!loading && filteredRows.length === 0">
          Aucune suggestion disponible. Tous vos éléments AS-IS ont déjà une cible TO-BE déclarée — bravo !
        </div>

        <div class="stb-body" *ngIf="!loading && filteredRows.length > 0">
          <!-- Filtre par domaine -->
          <div class="stb-domain-tabs" *ngIf="!domaine">
            <button
              *ngFor="let d of availableDomains"
              class="stb-dtab"
              [class.active]="activeFilter === d"
              (click)="activeFilter = d"
            >
              {{ domaineIcon(d) }} {{ domaineLabel(d) }}
              <span class="stb-count">{{ countFor(d) }}</span>
            </button>
            <button class="stb-dtab" [class.active]="activeFilter === null" (click)="activeFilter = null">
              Tous <span class="stb-count">{{ filteredRows.length }}</span>
            </button>
          </div>

          <div class="stb-stats">
            <span class="stb-stat-accepted">✓ {{ acceptedCount }} acceptée{{ acceptedCount > 1 ? 's' : '' }}</span>
            <span class="stb-stat-rejected">✗ {{ rejectedCount }} rejetée{{ rejectedCount > 1 ? 's' : '' }}</span>
            <span class="stb-stat-pending">… {{ pendingCount }} en attente</span>
          </div>

          <div class="stb-list">
            <div
              class="stb-row"
              *ngFor="let row of displayRows"
              [class.stb-accepted]="row.accepted === true"
              [class.stb-rejected]="row.accepted === false"
            >
              <div class="stb-row-header">
                <span class="stb-domain-badge">{{ domaineIcon(row.domaine) }} {{ domaineLabel(row.domaine) }}</span>
              </div>
              <div class="stb-row-content">
                <div class="stb-source">
                  <span class="stb-label">AS-IS</span>
                  <span class="stb-value">{{ row.nomSource }}</span>
                </div>
                <div class="stb-arrow">→</div>
                <div class="stb-target">
                  <span class="stb-label">TO-BE suggéré</span>
                  <ng-container *ngIf="editingRow !== row; else editSuggestion">
                    <span class="stb-value stb-suggestion">{{ row.suggestion }}</span>
                  </ng-container>
                  <ng-template #editSuggestion>
                    <input
                      class="stb-edit-input"
                      [(ngModel)]="editValue"
                      (keyup.enter)="saveEdit(row)"
                      (keyup.escape)="cancelEdit()"
                      aria-label="Libellé de la cible TO-BE"
                    />
                  </ng-template>
                </div>
              </div>
              <p class="stb-justification">{{ row.justification }}</p>
              <div class="stb-actions">
                <button
                  class="stb-btn stb-accept"
                  [class.active]="row.accepted === true"
                  (click)="toggleAccept(row, true)"
                  title="Accepter cette suggestion"
                >✓ Accepter</button>
                <button
                  class="stb-btn stb-reject"
                  [class.active]="row.accepted === false"
                  (click)="toggleAccept(row, false)"
                  title="Rejeter cette suggestion"
                >✗ Rejeter</button>
                <button
                  *ngIf="editingRow !== row"
                  class="stb-btn stb-edit"
                  (click)="startEdit(row)"
                  title="Modifier cette suggestion"
                >✎ Modifier</button>
                <ng-container *ngIf="editingRow === row">
                  <button class="stb-btn stb-save" (click)="saveEdit(row)">Enregistrer</button>
                  <button class="stb-btn" (click)="cancelEdit()">Annuler</button>
                </ng-container>
              </div>
            </div>
          </div>
        </div>

        <div class="stb-footer" *ngIf="!loading && filteredRows.length > 0">
          <span class="stb-footer-hint">
            Les suggestions acceptées seront affichées dans leur module respectif comme point de départ.
          </span>
          <div class="stb-footer-btns">
            <button class="btn btn-secondary" (click)="close()">Annuler</button>
            <button
              class="btn btn-primary"
              [disabled]="acceptedCount === 0"
              (click)="apply()"
            >
              Appliquer {{ acceptedCount > 0 ? '(' + acceptedCount + ')' : '' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stb-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45);
      z-index: 1000; display: flex; align-items: center; justify-content: center;
      padding: 1rem;
    }
    .stb-panel {
      background: var(--color-bg, #fff); border-radius: 12px;
      width: min(860px, 100%); max-height: 90vh;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    }
    .stb-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border);
      gap: 1rem; flex-shrink: 0;
    }
    .stb-title { margin: 0 0 0.3rem; font-size: 1.2rem; font-weight: 800; }
    .stb-subtitle { margin: 0; font-size: 0.85rem; color: var(--color-text-muted); }
    .stb-close {
      background: none; border: 1px solid var(--color-border); border-radius: 6px;
      width: 32px; height: 32px; cursor: pointer; font-size: 1rem; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .stb-close:hover { background: var(--color-surface); }

    .stb-loading, .stb-empty {
      padding: 3rem; text-align: center; color: var(--color-text-muted);
    }

    .stb-body { flex: 1; overflow-y: auto; padding: 1rem 1.5rem; }

    .stb-domain-tabs {
      display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem;
    }
    .stb-dtab {
      display: flex; align-items: center; gap: 0.35rem;
      padding: 0.3rem 0.75rem; border-radius: 999px;
      border: 1px solid var(--color-border); background: var(--color-surface);
      font-size: 0.82rem; cursor: pointer; transition: all 0.15s;
    }
    .stb-dtab.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    .stb-dtab:hover:not(.active) { border-color: var(--color-primary); }
    .stb-count {
      background: rgba(0,0,0,0.08); border-radius: 999px;
      padding: 0 0.45rem; font-size: 0.75rem; font-weight: 700;
    }
    .stb-dtab.active .stb-count { background: rgba(255,255,255,0.2); }

    .stb-stats {
      display: flex; gap: 1rem; margin-bottom: 0.85rem;
      font-size: 0.82rem; font-weight: 600;
    }
    .stb-stat-accepted { color: #16a34a; }
    .stb-stat-rejected { color: #dc2626; }
    .stb-stat-pending  { color: var(--color-text-muted); }

    .stb-list { display: grid; gap: 0.75rem; }
    .stb-row {
      border: 1.5px solid var(--color-border); border-radius: 10px;
      padding: 0.9rem 1rem; transition: border-color 0.2s, background 0.2s;
    }
    .stb-row.stb-accepted { border-color: #16a34a; background: #f0fdf4; }
    .stb-row.stb-rejected { border-color: #dc2626; background: #fef2f2; opacity: 0.65; }

    .stb-row-header { margin-bottom: 0.6rem; }
    .stb-domain-badge { font-size: 0.78rem; font-weight: 600; color: var(--color-primary); }

    .stb-row-content {
      display: grid; grid-template-columns: 1fr 24px 1fr;
      align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;
    }
    .stb-label { display: block; font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.15rem; }
    .stb-value { font-size: 0.92rem; font-weight: 600; }
    .stb-suggestion { color: #1d4ed8; }
    .stb-arrow { text-align: center; color: var(--color-text-muted); font-size: 1.1rem; }

    .stb-justification { margin: 0 0 0.6rem; font-size: 0.82rem; color: var(--color-text-muted); font-style: italic; }

    .stb-actions { display: flex; gap: 0.5rem; }
    .stb-btn {
      padding: 0.3rem 0.85rem; border-radius: 6px; border: 1.5px solid var(--color-border);
      font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
      background: var(--color-surface);
    }
    .stb-accept.active, .stb-accept:hover { background: #16a34a; color: #fff; border-color: #16a34a; }
    .stb-reject.active, .stb-reject:hover { background: #dc2626; color: #fff; border-color: #dc2626; }
    .stb-edit:hover, .stb-edit:focus { border-color: var(--color-primary); color: var(--color-primary); }
    .stb-save { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    .stb-edit-input {
      width: 100%; box-sizing: border-box; padding: 0.35rem 0.5rem;
      border: 1px solid var(--color-primary); border-radius: 5px;
      font: inherit; color: var(--color-text); background: var(--color-bg, #fff);
    }

    .stb-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1rem 1.5rem; border-top: 1px solid var(--color-border);
      flex-shrink: 0; gap: 1rem; flex-wrap: wrap;
    }
    .stb-footer-hint { font-size: 0.8rem; color: var(--color-text-muted); flex: 1; }
    .stb-footer-btns { display: flex; gap: 0.6rem; }
    .btn { padding: 0.45rem 1.1rem; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; border: none; }
    .btn-primary { background: var(--color-primary); color: #fff; }
    .btn-primary:hover:not(:disabled) { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn-secondary { background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text); }
    .btn-secondary:hover { background: var(--color-border); }

    @media (max-width: 600px) {
      .stb-row-content { grid-template-columns: 1fr; }
      .stb-arrow { display: none; }
    }
  `],
})
export class SuggestionToBeComponent implements OnInit, OnChanges {
  /** Filtre optionnel : si fourni, n'affiche que les suggestions du domaine spécifié. */
  @Input() domaine: DomaineSuggestion | null = null;

  /** Émis quand l'utilisateur ferme le panneau (sans appliquer). */
  @Output() closed = new EventEmitter<void>();

  /** Émis quand l'utilisateur clique "Appliquer" — contient les suggestions acceptées. */
  @Output() accepted = new EventEmitter<SuggestionToBeEntity[]>();

  loading = true;
  private allRows: SuggestionRow[] = [];
  activeFilter: DomaineSuggestion | null = null;
  editingRow: SuggestionRow | null = null;
  editValue = '';

  constructor(
    private organisationService: OrganisationService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadSuggestions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['domaine'] && !changes['domaine'].firstChange) {
      this.activeFilter = this.domaine;
    }
  }

  private loadSuggestions(): void {
    this.loading = true;
    this.organisationService.getSuggestionsToBe().subscribe({
      next: (suggestions) => {
        this.allRows = suggestions.map((s) => ({ ...s, accepted: null }));
        this.activeFilter = this.domaine ?? null;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Impossible de charger les suggestions TO-BE.');
        this.loading = false;
      },
    });
  }

  get filteredRows(): SuggestionRow[] {
    if (this.domaine) return this.allRows.filter((r) => r.domaine === this.domaine);
    return this.allRows;
  }

  get displayRows(): SuggestionRow[] {
    const rows = this.filteredRows;
    if (!this.activeFilter) return rows;
    return rows.filter((r) => r.domaine === this.activeFilter);
  }

  get availableDomains(): DomaineSuggestion[] {
    return [...new Set(this.filteredRows.map((r) => r.domaine))];
  }

  get acceptedCount(): number {
    return this.filteredRows.filter((r) => r.accepted === true).length;
  }

  get rejectedCount(): number {
    return this.filteredRows.filter((r) => r.accepted === false).length;
  }

  get pendingCount(): number {
    return this.filteredRows.filter((r) => r.accepted === null).length;
  }

  domaineLabel(d: DomaineSuggestion): string {
    return DOMAINE_LABELS[d];
  }

  domaineIcon(d: DomaineSuggestion): string {
    return DOMAINE_ICONS[d];
  }

  countFor(d: DomaineSuggestion): number {
    return this.filteredRows.filter((r) => r.domaine === d).length;
  }

  toggleAccept(row: SuggestionRow, value: boolean): void {
    // Toggle : si déjà dans cet état → reset à null
    row.accepted = row.accepted === value ? null : value;
  }

  startEdit(row: SuggestionRow): void {
    this.editingRow = row;
    this.editValue = row.suggestion;
  }

  saveEdit(row: SuggestionRow): void {
    const suggestion = this.editValue.trim();
    if (!suggestion) return;
    row.suggestion = suggestion;
    this.editingRow = null;
    this.editValue = '';
  }

  cancelEdit(): void {
    this.editingRow = null;
    this.editValue = '';
  }

  close(): void {
    this.closed.emit();
  }

  apply(): void {
    const acceptedList = this.filteredRows
      .filter((r) => r.accepted === true)
      .map(({ accepted: _accepted, ...rest }) => rest as SuggestionToBeEntity);
    this.accepted.emit(acceptedList);
    this.toast.success(
      `${acceptedList.length} suggestion${acceptedList.length > 1 ? 's' : ''} transmise${acceptedList.length > 1 ? 's' : ''} — reportez-les dans les modules concernés.`,
    );
    this.closed.emit();
  }
}
