import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PrioriteProjet, Projet, RoadmapService, StatutProjet } from './roadmap.service';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';

const PRIORITE_LABEL: Record<PrioriteProjet, string> = { HAUTE: 'Haute', MOYENNE: 'Moyenne', BASSE: 'Basse' };
const PRIORITE_BADGE: Record<PrioriteProjet, string> = { HAUTE: 'badge-danger', MOYENNE: 'badge-warning', BASSE: 'badge-success' };
const PRIORITES: PrioriteProjet[] = ['HAUTE', 'MOYENNE', 'BASSE'];

const STATUT_LABEL: Record<StatutProjet, string> = { PLANIFIE: 'Planifié', EN_COURS: 'En cours', TERMINE: 'Terminé' };
const STATUTS: StatutProjet[] = ['PLANIFIE', 'EN_COURS', 'TERMINE'];

const ICONS: Record<string, string> = {
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
};

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p class="muted step-question">Quels projets faut-il lancer pour combler l'écart entre l'existant et la cible, avec quelles priorités, quels coûts et quels délais ?</p>

    <div class="page-header">
      <h3>Projets ({{ projets.length }})</h3>
      <button type="button" class="btn btn-primary" (click)="openCreate()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
        Ajouter un projet
      </button>
    </div>

    <section class="card" *ngIf="projetsAvecDates.length > 0">
      <h3>Frise chronologique</h3>
      <div class="timeline">
        <div class="timeline-row" *ngFor="let p of projetsAvecDates">
          <span class="timeline-label">{{ p.nom }}</span>
          <div class="timeline-track">
            <div
              class="timeline-bar"
              [class]="prioriteBadge(p.priorite)"
              [style.left.%]="barPosition(p).left"
              [style.width.%]="barPosition(p).width"
            ></div>
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="empty-state" *ngIf="projets.length === 0">Aucun projet planifié.</div>
      <ul class="list" *ngIf="projets.length > 0">
        <li class="list-item" *ngFor="let p of projets">
          <div>
            <strong>{{ p.nom }}</strong>
            <span class="badge" [class]="prioriteBadge(p.priorite)">{{ prioriteLabel(p.priorite) }}</span>
            <p class="muted" *ngIf="p.description">{{ p.description }}</p>
            <p class="muted" *ngIf="p.coutEstime">Coût estimé : {{ p.coutEstime }}</p>
            <p class="muted" *ngIf="p.dateDebut || p.dateFin">
              {{ p.dateDebut ? (p.dateDebut | date: 'dd/MM/yyyy') : '?' }} → {{ p.dateFin ? (p.dateFin | date: 'dd/MM/yyyy') : '?' }}
            </p>
          </div>
          <div class="actions">
            <select [value]="p.statut" (change)="changeStatut(p, $any($event.target).value)">
              <option *ngFor="let s of statuts" [value]="s">{{ statutLabel(s) }}</option>
            </select>
            <button class="btn btn-danger" (click)="removeProjet(p)">Supprimer</button>
          </div>
        </li>
      </ul>
    </section>

    <!-- ── Popover : ajouter un projet ───────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="createPopover" (click)="closeCreate()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="createProjet($event)">
        <div class="popover-head">
          <h3>Ajouter un projet</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeCreate()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <label class="field">Nom<input type="text" [value]="newProjet.nom" (input)="newProjet.nom = $any($event.target).value" required /></label>
        <label class="field">Description<textarea [value]="newProjet.description || ''" (input)="newProjet.description = $any($event.target).value"></textarea></label>
        <div class="grid-3">
          <label class="field">
            Priorité
            <select [value]="newProjet.priorite || 'MOYENNE'" (change)="newProjet.priorite = $any($event.target).value">
              <option *ngFor="let p of priorites" [value]="p">{{ prioriteLabel(p) }}</option>
            </select>
          </label>
          <label class="field">Coût estimé<input type="text" placeholder="ex. 50 000 €" [value]="newProjet.coutEstime || ''" (input)="newProjet.coutEstime = $any($event.target).value" /></label>
        </div>
        <div class="grid-3">
          <label class="field">Date de début<input type="date" [value]="newProjet.dateDebut || ''" (input)="newProjet.dateDebut = $any($event.target).value" /></label>
          <label class="field">Date de fin<input type="date" [value]="newProjet.dateFin || ''" (input)="newProjet.dateFin = $any($event.target).value" /></label>
        </div>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCreate()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creating">{{ creating ? 'Création…' : 'Créer' }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .grid-3 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
      .card { margin-bottom: 1.25rem; }
      .muted { color: var(--color-text-muted); margin-top: 0.25rem; font-size: 0.9rem; }
      .list { list-style: none; display: grid; gap: 0.75rem; }
      .list-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding: 1rem; border: 1px solid var(--color-border); border-radius: 12px; }
      .actions { display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end; }
      .actions select { padding: 0.4rem 0.6rem; border: 1px solid var(--color-border); border-radius: 8px; font: inherit; }

      .timeline { display: grid; gap: 0.75rem; }
      .timeline-row { display: grid; grid-template-columns: 160px 1fr; align-items: center; gap: 0.75rem; }
      .timeline-label { font-size: 0.85rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .timeline-track { position: relative; height: 12px; background: var(--color-surface); border-radius: 999px; }
      .timeline-bar { position: absolute; top: 0; height: 100%; border-radius: 999px; min-width: 4px; }
      .timeline-bar.badge-danger { background: var(--color-danger); }
      .timeline-bar.badge-warning { background: var(--color-warning); }
      .timeline-bar.badge-success { background: var(--color-success); }
    `,
  ],
})
export class RoadmapComponent implements OnInit {
  priorites = PRIORITES;
  statuts = STATUTS;
  projets: Projet[] = [];

  newProjet: {
    nom: string;
    description?: string;
    priorite?: PrioriteProjet;
    coutEstime?: string;
    dateDebut?: string;
    dateFin?: string;
  } = { nom: '', priorite: 'MOYENNE' };
  creating = false;
  createPopover = false;

  constructor(
    private roadmapService: RoadmapService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  icon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] ?? '');
  }

  openCreate(): void {
    this.newProjet = { nom: '', priorite: 'MOYENNE' };
    this.createPopover = true;
  }

  closeCreate(): void {
    this.createPopover = false;
  }

  prioriteLabel(p: PrioriteProjet): string {
    return PRIORITE_LABEL[p];
  }
  prioriteBadge(p: PrioriteProjet): string {
    return PRIORITE_BADGE[p];
  }
  statutLabel(s: StatutProjet): string {
    return STATUT_LABEL[s];
  }

  get projetsAvecDates(): Projet[] {
    return this.projets.filter((p) => p.dateDebut && p.dateFin);
  }

  barPosition(p: Projet): { left: number; width: number } {
    const dates = this.projetsAvecDates.flatMap((x) => [new Date(x.dateDebut!).getTime(), new Date(x.dateFin!).getTime()]);
    const min = Math.min(...dates);
    const max = Math.max(...dates);
    const span = max - min || 1;
    const start = new Date(p.dateDebut!).getTime();
    const end = new Date(p.dateFin!).getTime();
    const left = ((start - min) / span) * 100;
    const width = Math.max(((end - start) / span) * 100, 1.5);
    return { left, width };
  }

  load(): void {
    this.roadmapService.list().subscribe({
      next: (projets) => (this.projets = projets),
      error: () => this.toast.error('Impossible de charger les projets.'),
    });
  }

  createProjet(event: Event): void {
    event.preventDefault();
    this.creating = true;
    this.roadmapService.create(this.newProjet).subscribe({
      next: () => {
        this.creating = false;
        this.closeCreate();
        this.load();
        this.toast.success('Projet créé.');
      },
      error: () => {
        this.creating = false;
        this.toast.error('Impossible de créer ce projet.');
      },
    });
  }

  changeStatut(p: Projet, statut: StatutProjet): void {
    this.roadmapService.update(p.id, { statut }).subscribe({
      next: (updated) => (p.statut = updated.statut),
      error: () => this.toast.error('Impossible de modifier le statut.'),
    });
  }

  async removeProjet(p: Projet): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Supprimer le projet « ${p.nom} » ?`);
    if (!confirmed) return;
    this.roadmapService.delete(p.id).subscribe({
      next: () => {
        this.load();
        this.toast.success('Projet supprimé.');
      },
      error: () => this.toast.error('Impossible de supprimer ce projet.'),
    });
  }
}
