import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Question,
  QuestionDraft,
  QuestionnaireDetail,
  Questionnaire,
  QuestionnaireService,
  TYPE_QUESTION_LABEL,
  TypeQuestion,
} from './questionnaire.service';
import { ToastService } from '../shared/toast.service';
import { ConfirmDialogService } from '../shared/confirm-dialog.service';
import { downloadQuestionnairePdf } from '../shared/download.util';

const TYPES: TypeQuestion[] = ['OUI_NON', 'CHOIX_MULTIPLE', 'NOTE_MAX', 'REPONSE_OUVERTE', 'SUGGESTION'];

interface QuestionRow {
  intitule: string;
  type: TypeQuestion;
  options: string[];
  noteMax: number;
}

interface Draft {
  id?: string;
  titre: string;
  description: string;
  questions: QuestionRow[];
}

@Component({
  selector: 'app-questionnaires',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- ── Liste ────────────────────────────────────────────────────────── -->
    <section *ngIf="mode === 'list'">
      <div class="page-header">
        <h3>Questionnaires ({{ questionnaires.length }})</h3>
        <button type="button" class="btn btn-primary" (click)="openCreate()">Nouveau questionnaire</button>
      </div>

      <section class="card">
        <div class="empty-state" *ngIf="questionnaires.length === 0">Aucun questionnaire pour l'instant.</div>
        <div class="table-scroll" *ngIf="questionnaires.length > 0">
          <table class="table">
            <thead><tr><th>Titre</th><th>Questions</th><th>Fichier de réponse</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let q of questionnaires">
                <td>{{ q.titre }}</td>
                <td><span class="badge badge-neutral">{{ q._count?.questions ?? 0 }}</span></td>
                <td>
                  <a *ngIf="q.reponseFichierUrl" [href]="q.reponseFichierUrl" target="_blank" rel="noopener">
                    {{ q.reponseFichierNom || 'Télécharger' }}
                  </a>
                  <span *ngIf="!q.reponseFichierUrl" class="muted">Aucun</span>
                </td>
                <td class="row-actions">
                  <button type="button" class="btn btn-ghost btn-sm" (click)="openDetail(q)">Ouvrir</button>
                  <button type="button" class="btn btn-ghost btn-sm" (click)="openEdit(q)">Modifier</button>
                  <button type="button" class="btn btn-ghost btn-sm danger" (click)="remove(q)">Supprimer</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <!-- ── Détail ──────────────────────────────────────────────────────── -->
    <section *ngIf="mode === 'detail' && selected as s">
      <div class="page-header">
        <button type="button" class="btn btn-ghost" (click)="backToList()">← Retour</button>
        <div class="detail-actions">
          <button type="button" class="btn btn-outline" (click)="downloadPdf(s)">Télécharger en PDF</button>
          <button type="button" class="btn btn-ghost" (click)="openEdit(s)">Modifier</button>
        </div>
      </div>

      <section class="card">
        <h3>{{ s.titre }}</h3>
        <p class="muted" *ngIf="s.description">{{ s.description }}</p>
        <p class="hint">{{ s.questions.length }} question(s)</p>
        <ol class="questions-preview">
          <li *ngFor="let q of s.questions">
            <strong>{{ q.intitule }}</strong>
            <span class="badge badge-neutral">{{ typeLabel(q.type) }}</span>
            <ul *ngIf="q.type === 'CHOIX_MULTIPLE'">
              <li *ngFor="let o of q.options">{{ o }}</li>
            </ul>
            <span class="muted" *ngIf="q.type === 'NOTE_MAX'">Note sur {{ q.noteMax || 5 }}</span>
          </li>
        </ol>
      </section>

      <section class="card">
        <h3>Fichier de réponse</h3>
        <p class="hint">Un seul fichier par questionnaire (PDF ou Excel). Un nouvel envoi remplace le précédent.</p>
        <p *ngIf="s.reponseFichierUrl">
          <a [href]="s.reponseFichierUrl" target="_blank" rel="noopener">{{ s.reponseFichierNom || 'Télécharger le fichier' }}</a>
        </p>
        <p *ngIf="!s.reponseFichierUrl" class="muted">Aucun fichier de réponse pour l'instant.</p>
        <div class="detail-actions">
          <label class="btn btn-outline file-btn">
            {{ uploading ? 'Envoi…' : (s.reponseFichierUrl ? 'Remplacer le fichier' : 'Téléverser un fichier') }}
            <input type="file" accept=".pdf,.xlsx,.xls,.csv" hidden (change)="onUpload($event, s)" [disabled]="uploading" />
          </label>
          <button type="button" class="btn btn-ghost danger" *ngIf="s.reponseFichierUrl" (click)="removeFichier(s)">
            Retirer le fichier
          </button>
        </div>
      </section>
    </section>

    <!-- ── Édition ─────────────────────────────────────────────────────── -->
    <section *ngIf="mode === 'edit' && draft as d">
      <div class="page-header">
        <h3>{{ d.id ? 'Modifier le questionnaire' : 'Nouveau questionnaire' }}</h3>
        <span class="hint">{{ d.questions.length }} question(s)</span>
      </div>

      <section class="card">
        <label class="field">Titre<input type="text" [value]="d.titre" (input)="d.titre = $any($event.target).value" required /></label>
        <label class="field">Description / consignes<textarea rows="3" [value]="d.description" (input)="d.description = $any($event.target).value"></textarea></label>
      </section>

      <section class="card question-card" *ngFor="let q of d.questions; let i = index">
        <div class="question-head">
          <span class="q-index">Question {{ i + 1 }}</span>
          <div class="q-move">
            <button type="button" class="icon-btn" title="Monter" [disabled]="i === 0" (click)="move(i, -1)">↑</button>
            <button type="button" class="icon-btn" title="Descendre" [disabled]="i === d.questions.length - 1" (click)="move(i, 1)">↓</button>
            <button type="button" class="icon-btn danger" title="Supprimer" (click)="removeQuestion(i)">✕</button>
          </div>
        </div>
        <label class="field">Intitulé<input type="text" [value]="q.intitule" (input)="q.intitule = $any($event.target).value" /></label>
        <label class="field">
          Type
          <select [value]="q.type" (change)="onTypeChange(q, $any($event.target).value)">
            <option *ngFor="let t of types" [value]="t">{{ typeLabel(t) }}</option>
          </select>
        </label>

        <div class="field" *ngIf="q.type === 'CHOIX_MULTIPLE'">
          <span>Options (au moins 2)</span>
          <div class="option-row" *ngFor="let opt of q.options; let oi = index">
            <input type="text" [value]="opt" (input)="q.options[oi] = $any($event.target).value" />
            <button type="button" class="icon-btn danger" (click)="removeOption(q, oi)" [disabled]="q.options.length <= 1">✕</button>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" (click)="q.options.push('')">+ Ajouter une option</button>
        </div>

        <label class="field" *ngIf="q.type === 'NOTE_MAX'">
          Note maximale
          <input type="number" min="1" max="100" [value]="q.noteMax" (input)="q.noteMax = +$any($event.target).value || 5" />
        </label>
      </section>

      <div class="editor-actions">
        <button type="button" class="btn btn-ghost" (click)="addQuestion()">+ Ajouter une question</button>
        <span class="spacer"></span>
        <button type="button" class="btn btn-ghost" (click)="cancelEdit()">Annuler</button>
        <button type="button" class="btn btn-primary" [disabled]="saving" (click)="save()">
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      .muted { color: var(--color-text-muted); }
      .hint { color: var(--color-text-muted); font-size: 0.85rem; margin: 0.25rem 0 1rem; }
      .table-scroll { overflow-x: auto; }
      .table { width: 100%; min-width: 640px; border-collapse: collapse; }
      .table th, .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); }
      .row-actions { display: flex; gap: 0.35rem; white-space: nowrap; }
      .btn-sm { padding: 0.3rem 0.55rem; font-size: 0.82rem; }
      .danger { color: var(--color-danger, #c0244f); }
      .detail-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
      .file-btn { cursor: pointer; }
      .questions-preview { margin: 0.5rem 0 0; padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.6rem; }
      .questions-preview .badge { margin-left: 0.5rem; }
      .question-card { margin-bottom: 0.9rem; }
      .question-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
      .q-index { font-weight: 700; font-size: 0.9rem; }
      .q-move { display: flex; gap: 0.25rem; }
      .icon-btn { border: 1px solid var(--color-border); background: var(--color-surface); border-radius: 6px; width: 28px; height: 28px; cursor: pointer; font: inherit; }
      .icon-btn:disabled { opacity: 0.4; cursor: default; }
      .option-row { display: flex; gap: 0.4rem; margin-bottom: 0.35rem; }
      .option-row input { flex: 1; }
      .field { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.75rem; }
      .field input, .field select, .field textarea { padding: 0.5rem 0.6rem; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font: inherit; width: 100%; }
      .field textarea { resize: vertical; }
      .editor-actions { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
      .editor-actions .spacer { flex: 1; }
    `,
  ],
})
export class QuestionnairesComponent implements OnInit {
  types = TYPES;
  mode: 'list' | 'detail' | 'edit' = 'list';
  questionnaires: Questionnaire[] = [];
  selected: QuestionnaireDetail | null = null;
  draft: Draft | null = null;
  saving = false;
  uploading = false;

  constructor(
    private service: QuestionnaireService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.loadList();
  }

  typeLabel(t: TypeQuestion): string {
    return TYPE_QUESTION_LABEL[t];
  }

  loadList(): void {
    this.service.list().subscribe({
      next: (list) => (this.questionnaires = list),
      error: () => this.toast.error('Impossible de charger les questionnaires.'),
    });
  }

  backToList(): void {
    this.mode = 'list';
    this.selected = null;
    this.draft = null;
    this.loadList();
  }

  openDetail(q: Questionnaire): void {
    this.service.get(q.id).subscribe({
      next: (detail) => {
        this.selected = detail;
        this.mode = 'detail';
      },
      error: () => this.toast.error('Impossible d\'ouvrir ce questionnaire.'),
    });
  }

  // ── Édition ──────────────────────────────────────────────────────────────

  openCreate(): void {
    this.draft = { titre: '', description: '', questions: [this.emptyQuestion()] };
    this.mode = 'edit';
  }

  openEdit(q: Questionnaire): void {
    this.service.get(q.id).subscribe({
      next: (detail) => {
        this.draft = {
          id: detail.id,
          titre: detail.titre,
          description: detail.description ?? '',
          questions: detail.questions.map((qq: Question) => ({
            intitule: qq.intitule,
            type: qq.type,
            options: qq.options.length ? [...qq.options] : ['', ''],
            noteMax: qq.noteMax ?? 5,
          })),
        };
        if (this.draft.questions.length === 0) this.draft.questions.push(this.emptyQuestion());
        this.mode = 'edit';
      },
      error: () => this.toast.error('Impossible d\'ouvrir ce questionnaire.'),
    });
  }

  cancelEdit(): void {
    if (this.selected) {
      this.mode = 'detail';
    } else {
      this.backToList();
    }
    this.draft = null;
  }

  private emptyQuestion(): QuestionRow {
    return { intitule: '', type: 'OUI_NON', options: ['', ''], noteMax: 5 };
  }

  addQuestion(): void {
    this.draft?.questions.push(this.emptyQuestion());
  }

  removeQuestion(i: number): void {
    this.draft?.questions.splice(i, 1);
  }

  move(i: number, dir: -1 | 1): void {
    const list = this.draft?.questions;
    if (!list) return;
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
  }

  onTypeChange(q: QuestionRow, type: TypeQuestion): void {
    q.type = type;
    if (type === 'CHOIX_MULTIPLE' && q.options.length < 2) q.options = ['', ''];
  }

  removeOption(q: QuestionRow, oi: number): void {
    q.options.splice(oi, 1);
  }

  save(): void {
    const d = this.draft;
    if (!d) return;
    if (!d.titre.trim()) {
      this.toast.error('Le titre est obligatoire.');
      return;
    }
    if (d.questions.length === 0) {
      this.toast.error('Ajoutez au moins une question.');
      return;
    }

    const questions: QuestionDraft[] = [];
    for (const [i, q] of d.questions.entries()) {
      if (!q.intitule.trim()) {
        this.toast.error(`L'intitulé de la question ${i + 1} est vide.`);
        return;
      }
      if (q.type === 'CHOIX_MULTIPLE') {
        const options = q.options.map((o) => o.trim()).filter((o) => o.length > 0);
        if (options.length < 2) {
          this.toast.error(`La question ${i + 1} (choix multiple) doit avoir au moins deux options.`);
          return;
        }
        questions.push({ intitule: q.intitule.trim(), type: q.type, options });
      } else if (q.type === 'NOTE_MAX') {
        questions.push({ intitule: q.intitule.trim(), type: q.type, noteMax: q.noteMax || 5 });
      } else {
        questions.push({ intitule: q.intitule.trim(), type: q.type });
      }
    }

    const payload = { titre: d.titre.trim(), description: d.description.trim() || undefined, questions };
    this.saving = true;
    const request$ = d.id ? this.service.update(d.id, payload) : this.service.create(payload);
    request$.subscribe({
      next: (detail) => {
        this.saving = false;
        this.selected = detail;
        this.draft = null;
        this.mode = 'detail';
        this.loadList();
        this.toast.success(d.id ? 'Questionnaire enregistré.' : 'Questionnaire créé.');
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.toast.error(err?.error?.message ?? 'Impossible d\'enregistrer ce questionnaire.');
      },
    });
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  downloadPdf(q: QuestionnaireDetail): void {
    downloadQuestionnairePdf(
      q.titre,
      q.description,
      q.questions.map((qq) => ({ intitule: qq.intitule, type: qq.type, options: qq.options, noteMax: qq.noteMax })),
      `questionnaire-${q.titre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'evaluation'}.pdf`,
    );
  }

  onUpload(event: Event, q: QuestionnaireDetail): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploading = true;
    this.service.uploadReponseFichier(q.id, file).subscribe({
      next: (detail) => {
        this.uploading = false;
        this.selected = detail;
        this.loadList();
        this.toast.success('Fichier de réponse enregistré.');
      },
      error: (err: HttpErrorResponse) => {
        this.uploading = false;
        this.toast.error(err?.error?.message ?? 'Impossible de téléverser ce fichier.');
      },
    });
  }

  async removeFichier(q: QuestionnaireDetail): Promise<void> {
    const ok = await this.confirmDialog.confirm('Retirer le fichier de réponse de ce questionnaire ?');
    if (!ok) return;
    this.service.removeReponseFichier(q.id).subscribe({
      next: () => {
        if (this.selected) {
          this.selected = { ...this.selected, reponseFichierUrl: null, reponseFichierNom: null };
        }
        this.loadList();
        this.toast.success('Fichier retiré.');
      },
      error: () => this.toast.error('Impossible de retirer ce fichier.'),
    });
  }

  async remove(q: Questionnaire): Promise<void> {
    const ok = await this.confirmDialog.confirm(`Supprimer le questionnaire « ${q.titre} » ?`);
    if (!ok) return;
    this.service.delete(q.id).subscribe({
      next: () => {
        this.toast.success('Questionnaire supprimé.');
        this.loadList();
      },
      error: () => this.toast.error('Impossible de supprimer ce questionnaire.'),
    });
  }
}
