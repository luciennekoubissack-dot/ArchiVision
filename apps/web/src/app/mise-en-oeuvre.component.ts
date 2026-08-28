import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvancementSolution, Solution, SolutionService } from './solution.service';
import { ToastService } from './toast.service';

const AVANCEMENT_LABEL: Record<AvancementSolution, string> = {
  NON_DEMARRE: 'Non démarré',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  BLOQUE: 'Bloqué',
};
const AVANCEMENT_BADGE: Record<AvancementSolution, string> = {
  NON_DEMARRE: 'badge-neutral',
  EN_COURS: 'badge-warning',
  TERMINE: 'badge-success',
  BLOQUE: 'badge-danger',
};
const AVANCEMENTS: AvancementSolution[] = ['NON_DEMARRE', 'EN_COURS', 'TERMINE', 'BLOQUE'];

@Component({
  selector: 'app-mise-en-oeuvre',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p class="muted step-question">Où en est la mise en œuvre des solutions retenues ? Quel est leur avancement, et quels blocages rencontrés ?</p>

    <div class="page-header">
      <h3>Solutions retenues ({{ solutions.length }})</h3>
    </div>

    <section class="card">
      <div class="empty-state" *ngIf="solutions.length === 0">
        Aucune solution retenue pour l'instant .
      </div>
      <div class="table-scroll" *ngIf="solutions.length > 0">
        <table class="table">
          <thead><tr><th>Nom</th><th>Plan</th><th>Avancement</th><th>Commentaire de suivi</th></tr></thead>
          <tbody>
            <tr *ngFor="let s of solutions">
              <td>{{ s.nom }}</td>
              <td>{{ s.planMiseOeuvre || '—' }}</td>
              <td>
                <span class="badge" [class]="avancementBadge(s.avancement)">{{ avancementLabel(s.avancement) }}</span>
                <select [value]="s.avancement" (change)="changeAvancement(s, $any($event.target).value)">
                  <option *ngFor="let a of avancements" [value]="a">{{ avancementLabel(a) }}</option>
                </select>
              </td>
              <td>
                <textarea
                  [value]="s.commentaireSuivi || ''"
                  (input)="s.commentaireSuivi = $any($event.target).value"
                  (blur)="saveCommentaire(s)"
                  placeholder="Avancement, blocages, prochaines étapes…"
                ></textarea>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [
    `
      .muted { color: var(--color-text-muted); margin-top: 0.35rem; font-size: 0.9rem; }
      .table-scroll { overflow-x: auto; }
      .table { width: 100%; min-width: 720px; border-collapse: collapse; }
      .table th, .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); vertical-align: top; }
      .table .badge { display: block; margin-bottom: 0.35rem; width: fit-content; }
      .table select { padding: 0.35rem 0.5rem; border: 1px solid var(--color-border); border-radius: 8px; font: inherit; }
      .table textarea { width: 100%; min-width: 220px; min-height: 3.2rem; padding: 0.5rem 0.6rem; border: 1px solid var(--color-border); border-radius: 8px; font: inherit; resize: vertical; }
    `,
  ],
})
export class MiseEnOeuvreComponent implements OnInit {
  avancements = AVANCEMENTS;
  solutions: Solution[] = [];

  constructor(
    private solutionService: SolutionService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  avancementLabel(a: AvancementSolution): string {
    return AVANCEMENT_LABEL[a];
  }
  avancementBadge(a: AvancementSolution): string {
    return AVANCEMENT_BADGE[a];
  }

  load(): void {
    this.solutionService.list().subscribe({
      next: (solutions) => (this.solutions = solutions.filter((s) => s.statut === 'RETENUE')),
      error: () => this.toast.error('Impossible de charger les solutions retenues.'),
    });
  }

  changeAvancement(s: Solution, avancement: AvancementSolution): void {
    this.solutionService.update(s.id, { avancement }).subscribe({
      next: (updated) => (s.avancement = updated.avancement),
      error: () => this.toast.error("Impossible de mettre à jour l'avancement."),
    });
  }

  saveCommentaire(s: Solution): void {
    this.solutionService.update(s.id, { commentaireSuivi: s.commentaireSuivi || undefined }).subscribe({
      error: () => this.toast.error('Impossible d’enregistrer le commentaire.'),
    });
  }
}
