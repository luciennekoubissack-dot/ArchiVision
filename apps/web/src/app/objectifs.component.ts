import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';
import { ObjectifService, Objectif } from './objectif.service';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-objectifs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h2>Stratégie — Objectifs</h2>
    </div>

    <form class="card form-card" *ngIf="canWrite" (submit)="create($event)">
      <h3>Nouvel objectif</h3>
      <label class="field">
        Nom
        <input type="text" [value]="newObjectif.nom" (input)="newObjectif.nom = $any($event.target).value" required />
      </label>
      <label class="field">
        Description
        <textarea [value]="newObjectif.description || ''" (input)="newObjectif.description = $any($event.target).value"></textarea>
      </label>
      <button type="submit" class="btn btn-primary" [disabled]="creating">Créer l'objectif</button>
    </form>
    <p class="hint" *ngIf="!canWrite">Lecture seule — seuls les rôles Architecte et Dirigeant peuvent modifier les objectifs.</p>

    <section class="card">
      <h3>Objectifs ({{ objectifs.length }})</h3>
      <div class="empty-state" *ngIf="objectifs.length === 0">Aucun objectif défini pour cette organisation.</div>
      <ul class="list" *ngIf="objectifs.length > 0">
        <li *ngFor="let objectif of objectifs" class="list-item">
          <ng-container *ngIf="editingId !== objectif.id; else editRow">
            <div>
              <strong>{{ objectif.nom }}</strong>
              <p class="muted" *ngIf="objectif.description">{{ objectif.description }}</p>
            </div>
            <div class="actions" *ngIf="canWrite">
              <button class="btn btn-outline" (click)="startEdit(objectif)">Modifier</button>
              <button class="btn btn-danger" (click)="remove(objectif)">Supprimer</button>
            </div>
          </ng-container>
          <ng-template #editRow>
            <form class="edit-form" (submit)="saveEdit($event, objectif)">
              <label class="field">
                Nom
                <input type="text" [value]="editModel.nom" (input)="editModel.nom = $any($event.target).value" required />
              </label>
              <label class="field">
                Description
                <textarea [value]="editModel.description || ''" (input)="editModel.description = $any($event.target).value"></textarea>
              </label>
              <div class="actions">
                <button type="submit" class="btn btn-primary" [disabled]="saving">Enregistrer</button>
                <button type="button" class="btn btn-ghost" (click)="cancelEdit()">Annuler</button>
              </div>
            </form>
          </ng-template>
        </li>
      </ul>
    </section>
  `,
  styles: [
    `
      .form-card { margin-bottom: 1.5rem; }
      .hint { color: var(--color-text-muted); margin-bottom: 1.5rem; }
      .list { list-style: none; display: grid; gap: 0.75rem; }
      .list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border: 1px solid var(--color-border);
        border-radius: 12px;
      }
      .list-item .edit-form { width: 100%; display: grid; gap: 0.75rem; }
      .muted { color: var(--color-text-muted); margin-top: 0.25rem; }
      .actions { display: flex; gap: 0.5rem; }
    `,
  ],
})
export class ObjectifsComponent implements OnInit {
  objectifs: Objectif[] = [];
  newObjectif: { nom: string; description?: string } = { nom: '' };
  creating = false;

  editingId: string | null = null;
  editModel: { nom: string; description?: string } = { nom: '' };
  saving = false;

  constructor(
    private auth: AuthService,
    private objectifService: ObjectifService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  get canWrite(): boolean {
    return this.auth.hasRole('ARCHITECTE', 'DIRIGEANT');
  }

  ngOnInit(): void {
    this.objectifService.list().subscribe({
      next: (objectifs) => (this.objectifs = objectifs),
      error: () => this.toast.error('Impossible de charger les objectifs.'),
    });
  }

  create(event: Event): void {
    event.preventDefault();
    if (!this.newObjectif.nom.trim()) return;
    this.creating = true;
    this.objectifService.create(this.newObjectif).subscribe({
      next: (objectif) => {
        this.objectifs = [...this.objectifs, objectif];
        this.newObjectif = { nom: '' };
        this.creating = false;
        this.toast.success('Objectif créé.');
      },
      error: () => {
        this.creating = false;
        this.toast.error("Impossible de créer l'objectif.");
      },
    });
  }

  startEdit(objectif: Objectif): void {
    this.editingId = objectif.id;
    this.editModel = { nom: objectif.nom, description: objectif.description ?? '' };
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(event: Event, objectif: Objectif): void {
    event.preventDefault();
    if (!this.editModel.nom.trim()) return;
    this.saving = true;
    this.objectifService.update(objectif.id, this.editModel).subscribe({
      next: (updated) => {
        this.objectifs = this.objectifs.map((o) => (o.id === objectif.id ? updated : o));
        this.saving = false;
        this.editingId = null;
        this.toast.success('Objectif modifié.');
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
        this.objectifs = this.objectifs.filter((o) => o.id !== objectif.id);
        this.toast.success('Objectif supprimé.');
      },
      error: () => this.toast.error("Impossible de supprimer l'objectif."),
    });
  }
}
