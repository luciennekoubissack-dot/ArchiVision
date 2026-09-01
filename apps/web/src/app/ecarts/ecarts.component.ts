import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BpmnElement, BpmnProcessus, BpmnService, TypeBpmn, TypeProcessus } from '../vision/bpmn.service';
import { DomainTab, DOMAIN_LABEL, GapAnalysisService, GapRow } from './gap-analysis.service';
import { ToastService } from '../shared/toast.service';

type MainTab = 'processus' | DomainTab;

interface GapDomainState {
  loaded: boolean;
  rows: GapRow[];
  conserves: GapRow[];
  elimines: GapRow[];
  modifies: GapRow[];
  nouveaux: GapRow[];
}

function emptyGapState(): GapDomainState {
  return { loaded: false, rows: [], conserves: [], elimines: [], modifies: [], nouveaux: [] };
}

const DOMAIN_EMPTY_MESSAGE: Record<DomainTab, string> = {
  objectifs: "Aucun objectif défini. Rendez-vous dans Préparation de l'organisation ▸ Objectifs pour en ajouter.",
  metier: 'Aucun élément ArchiMate défini. Rendez-vous dans Architecture métier pour en ajouter.',
  donnees: 'Aucune entité de données définie. Rendez-vous dans Architecture des données pour en ajouter.',
  applicatif: 'Aucune application définie. Rendez-vous dans Architecture Système pour en ajouter.',
  technologique: 'Aucun composant technologique défini. Rendez-vous dans Architecture technologique pour en ajouter.',
};

const TYPE_PROCESSUS_ORDER: TypeProcessus[] = ['PILOTAGE', 'METIER', 'SUPPORT'];
const TYPE_PROCESSUS_LABEL: Record<TypeProcessus, string> = {
  PILOTAGE: 'Processus de pilotage',
  METIER: 'Processus métier',
  SUPPORT: 'Processus support',
};

const TYPE_BPMN_LABEL: Record<TypeBpmn, string> = {
  EVENEMENT_DEBUT: 'Événement de début',
  EVENEMENT_FIN: 'Événement de fin',
  EVENEMENT_INTERMEDIAIRE: 'Événement intermédiaire',
  TACHE: 'Tâche',
  SOUS_PROCESSUS: 'Sous-processus',
  PASSERELLE_EXCLUSIVE: 'Passerelle exclusive',
  PASSERELLE_PARALLELE: 'Passerelle parallèle',
  PASSERELLE_INCLUSIVE: 'Passerelle inclusive',
  PASSERELLE_EVENEMENTIELLE: 'Passerelle événementielle',
};

interface GapElement extends BpmnElement {
  exclusive: boolean;
}

@Component({
  selector: 'app-ecarts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p class="muted step-question">
      Une fois les objectifs connus et les processus décrits, quels écarts existent entre l'état actuel
      (AS-IS) et la cible souhaitée (TO-BE) ? Cette analyse compare ce qui doit disparaître, apparaître ou
      rester inchangé, domaine par domaine.
    </p>

    <div class="tabs">
      <button class="tab" [class.active]="mainTab === 'processus'" (click)="mainTab = 'processus'">Processus</button>
      <button class="tab" [class.active]="mainTab === 'objectifs'" (click)="selectDomain('objectifs')">Objectifs</button>
      <button class="tab" [class.active]="mainTab === 'metier'" (click)="selectDomain('metier')">Architecture métier</button>
      <button class="tab" [class.active]="mainTab === 'donnees'" (click)="selectDomain('donnees')">Données</button>
      <button class="tab" [class.active]="mainTab === 'applicatif'" (click)="selectDomain('applicatif')">Applicatif</button>
      <button class="tab" [class.active]="mainTab === 'technologique'" (click)="selectDomain('technologique')">Technologique</button>
    </div>

    <!-- ── Domaines architecturaux : matrice d'écarts TOGAF (Baseline / Target / État) ── -->
    <section *ngIf="mainTab !== 'processus'">
      <div class="summary">
        <div class="stat">
          <span class="stat-value">{{ currentDomain.conserves.length }}</span>
          <span class="stat-label">Conservés</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ currentDomain.elimines.length }}</span>
          <span class="stat-label">Éliminés</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ currentDomain.modifies.length }}</span>
          <span class="stat-label">Modifiés</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ currentDomain.nouveaux.length }}</span>
          <span class="stat-label">Nouveaux</span>
        </div>
      </div>

      <div class="empty-state" *ngIf="!currentDomain.loaded">Chargement…</div>
      <div class="empty-state" *ngIf="currentDomain.loaded && currentDomain.rows.length === 0">
        {{ emptyMessage }}
      </div>

      <section class="card" *ngIf="currentDomain.loaded && currentDomain.rows.length > 0">
        <h3>Matrice d'écarts — {{ domainLabel }}</h3>
        <p class="muted hint">
          Chaque ligne compare un élément de référence (Baseline, état actuel) à sa cible (Target, état
          futur). Un élément AS-IS sans évolution déclarée est marqué « Éliminé » ; un élément TO-BE sans
          origine déclarée est marqué « Nouveau ».
        </p>
        <div class="table-scroll">
          <table class="table">
            <thead><tr><th>Baseline (AS-IS)</th><th>Target (TO-BE)</th><th>État</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of currentDomain.rows">
                <td>{{ row.asIs?.nom ?? '—' }}</td>
                <td>{{ row.toBe.length > 0 ? namesOf(row.toBe) : '—' }}</td>
                <td><span class="badge" [class]="etatBadge(row.etat)">{{ row.etat }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <div class="layout" *ngIf="mainTab === 'processus'">
      <section class="card processus-list">
        <h3>Processus ({{ processus.length }})</h3>
        <div class="empty-state" *ngIf="processus.length === 0">Aucun processus défini.</div>
        <div class="processus-groupe" *ngFor="let t of typesProcessus">
          <ng-container *ngIf="processusParType(t).length > 0">
            <h4>{{ typeProcessusLabel(t) }}</h4>
            <div class="table-scroll">
              <table class="table">
                <tbody>
                  <tr
                    *ngFor="let p of processusParType(t)"
                    [class.selected]="selected?.id === p.id"
                    (click)="select(p)"
                  >
                    <td>{{ p.nom }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-container>
        </div>
      </section>

      <section class="card ecart-detail" *ngIf="selected">
        <h3>{{ selected.nom }}</h3>

        <div class="summary" *ngIf="loadedElements">
          <div class="stat">
            <span class="stat-value">{{ onlyAsIs.length }}</span>
            <span class="stat-label">À faire évoluer</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ common.length }}</span>
            <span class="stat-label">Inchangés</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ onlyToBe.length }}</span>
            <span class="stat-label">Nouveaux</span>
          </div>
        </div>

        <div class="empty-state" *ngIf="loadedElements && asIs.length === 0 && toBe.length === 0">
          Aucune étape renseignée pour ce processus. Rendez-vous dans Procédure pour construire son diagramme.
        </div>

        <div class="compare-grid" *ngIf="loadedElements && (asIs.length > 0 || toBe.length > 0)">
          <div class="compare-col">
            <h4>État actuel — AS-IS</h4>
            <div class="empty-state" *ngIf="asIs.length === 0">Rien renseigné en AS-IS.</div>
            <ul class="list" *ngIf="asIs.length > 0">
              <li class="list-item" *ngFor="let el of asIs">
                <div>
                  <strong>{{ el.nom }}</strong>
                  <span class="badge badge-neutral">{{ typeLabel(el.type) }}</span>
                </div>
                <span class="badge badge-warning" *ngIf="el.exclusive">À faire évoluer</span>
              </li>
            </ul>
          </div>
          <div class="compare-col">
            <h4>Cible — TO-BE</h4>
            <div class="empty-state" *ngIf="toBe.length === 0">Rien renseigné en TO-BE.</div>
            <ul class="list" *ngIf="toBe.length > 0">
              <li class="list-item" *ngFor="let el of toBe">
                <div>
                  <strong>{{ el.nom }}</strong>
                  <span class="badge badge-neutral">{{ typeLabel(el.type) }}</span>
                </div>
                <span class="badge badge-success" *ngIf="el.exclusive">Nouveau</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .layout { display: grid; grid-template-columns: 320px 1fr; gap: 1.25rem; align-items: start; }
      .processus-groupe { margin-bottom: 1.25rem; }
      .processus-groupe h4 { margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
      .list { list-style: none; display: grid; gap: 0.5rem; }
      .list-item { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; padding: 0.7rem 0.85rem; border: 1px solid var(--color-border); border-radius: 10px; }
      .ecart-detail .list-item { cursor: default; }
      .processus-list .table-scroll { overflow-x: auto; }
      .processus-list .table { width: 100%; border-collapse: collapse; }
      .processus-list .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); }
      .processus-list .table tbody tr { cursor: pointer; }
      .processus-list .table tbody tr.selected { background: var(--color-primary-light); }

      .summary { display: flex; gap: 1rem; margin: 1rem 0 1.5rem; flex-wrap: wrap; }
      .stat { flex: 1; min-width: 120px; text-align: center; padding: 1rem; border-radius: var(--radius-lg); background: var(--color-surface); }
      .stat-value { display: block; font-size: 1.8rem; font-weight: 800; }
      .stat-label { display: block; color: var(--color-text-muted); font-size: 0.85rem; margin-top: 0.15rem; }

      .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
      .compare-col h4 { margin-bottom: 0.75rem; }

      .hint { color: var(--color-text-muted); font-size: 0.88rem; margin: 0 0 1rem; }
      .table-scroll { overflow-x: auto; }
      .table { width: 100%; min-width: 480px; border-collapse: collapse; }
      .table th, .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); }

      @media (max-width: 900px) {
        .layout { grid-template-columns: 1fr; }
        .compare-grid { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class EcartsComponent implements OnInit {
  mainTab: MainTab = 'processus';

  typesProcessus = TYPE_PROCESSUS_ORDER;
  processus: BpmnProcessus[] = [];
  selected: BpmnProcessus | null = null;

  loadedElements = false;
  asIs: GapElement[] = [];
  toBe: GapElement[] = [];
  onlyAsIs: GapElement[] = [];
  onlyToBe: GapElement[] = [];
  common: BpmnElement[] = [];

  domains: Record<DomainTab, GapDomainState> = {
    objectifs: emptyGapState(),
    metier: emptyGapState(),
    donnees: emptyGapState(),
    applicatif: emptyGapState(),
    technologique: emptyGapState(),
  };

  constructor(
    private bpmnService: BpmnService,
    private gapAnalysisService: GapAnalysisService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.bpmnService.list().subscribe({
      next: (processus) => (this.processus = processus),
      error: () => this.toast.error('Impossible de charger les processus.'),
    });
  }

  get currentDomain(): GapDomainState {
    return this.domains[this.mainTab as DomainTab];
  }

  get domainLabel(): string {
    return DOMAIN_LABEL[this.mainTab as DomainTab];
  }

  get emptyMessage(): string {
    return DOMAIN_EMPTY_MESSAGE[this.mainTab as DomainTab];
  }

  namesOf(items: { nom: string }[]): string {
    return items.map((i) => i.nom).join(', ');
  }

  etatBadge(etat: GapRow['etat']): string {
    if (etat === 'Conservé') return 'badge-neutral';
    if (etat === 'Éliminé') return 'badge-danger';
    if (etat === 'Modifié') return 'badge-warning';
    return 'badge-success';
  }

  selectDomain(tab: DomainTab): void {
    this.mainTab = tab;
    if (this.domains[tab].loaded) return;

    this.gapAnalysisService.rowsFor(tab).subscribe({
      next: (rows) => this.setDomainRows(tab, rows),
      error: () => this.toast.error(`Impossible de charger le domaine « ${DOMAIN_LABEL[tab]} ».`),
    });
  }

  private setDomainRows(tab: DomainTab, rows: GapRow[]): void {
    this.domains[tab] = {
      loaded: true,
      rows,
      conserves: rows.filter((r) => r.etat === 'Conservé'),
      elimines: rows.filter((r) => r.etat === 'Éliminé'),
      modifies: rows.filter((r) => r.etat === 'Modifié'),
      nouveaux: rows.filter((r) => r.etat === 'Nouveau'),
    };
  }

  typeProcessusLabel(type: TypeProcessus): string {
    return TYPE_PROCESSUS_LABEL[type];
  }

  typeLabel(type: TypeBpmn): string {
    return TYPE_BPMN_LABEL[type];
  }

  processusParType(type: TypeProcessus): BpmnProcessus[] {
    return this.processus.filter((p) => p.type === type);
  }

  select(p: BpmnProcessus): void {
    this.selected = p;
    this.loadedElements = false;
    this.bpmnService.get(p.id).subscribe({
      next: (detail) => {
        const elements = detail.elements;
        this.common = elements.filter((el) => el.statut === 'LES_DEUX');
        const onlyAsIsEls = elements.filter((el) => el.statut === 'AS_IS');
        const onlyToBeEls = elements.filter((el) => el.statut === 'TO_BE');

        this.onlyAsIs = onlyAsIsEls.map((el) => ({ ...el, exclusive: true }));
        this.onlyToBe = onlyToBeEls.map((el) => ({ ...el, exclusive: true }));
        this.asIs = [...this.common.map((el) => ({ ...el, exclusive: false })), ...this.onlyAsIs];
        this.toBe = [...this.common.map((el) => ({ ...el, exclusive: false })), ...this.onlyToBe];
        this.loadedElements = true;
      },
      error: () => this.toast.error('Impossible de charger ce processus.'),
    });
  }
}
