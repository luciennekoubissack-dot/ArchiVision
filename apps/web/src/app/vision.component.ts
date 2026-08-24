import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { BpmnComponent } from './bpmn.component';
import { ArchimateService, CategorieExigence, ElementArchimate } from './archimate.service';
import { UpdateVisionCanvasPayload, VisionCanvas, VisionCanvasField, VisionCanvasService } from './vision-canvas.service';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';
import { exportToExcel, importFromExcel } from './excel.util';

type Tab = 'processus' | 'exigences' | 'diagramme';

interface VisionBlock {
  field: VisionCanvasField;
  label: string;
  color: string;
  icon: string;
  placeholder: string;
}

const VISION_BLOCKS: VisionBlock[] = [
  {
    field: 'targetGroup',
    label: 'Target Group',
    color: '#C0244F',
    icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    placeholder: 'Quel marché ou segment adresse-t-on ? Qui sont les utilisateurs ciblés ?',
  },
  {
    field: 'needs',
    label: 'Needs',
    color: '#D9971B',
    icon: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2Z"/>',
    placeholder: 'Quel problème résout-on ? Quel bénéfice cela apporte-t-il ?',
  },
  {
    field: 'product',
    label: 'Product',
    color: '#12946B',
    icon: '<path d="M21 8l-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    placeholder: 'Quel est le produit/système ? Qu\'est-ce qui le distingue ?',
  },
  {
    field: 'businessGoals',
    label: 'Business Goals',
    color: '#1B4F72',
    icon: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
    placeholder: 'En quoi cela profite-t-il à l\'entreprise ? Quels sont les objectifs métier ?',
  },
  {
    field: 'competitors',
    label: 'Competitors',
    color: '#1B4F72',
    icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    placeholder: 'Qui sont les concurrents principaux ? Quelles sont leurs forces/faiblesses ?',
  },
  {
    field: 'revenueStreams',
    label: 'Revenue Streams',
    color: '#12946B',
    icon: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    placeholder: 'Comment monétise-t-on ce produit/service ? Quelles sources de revenus ?',
  },
  {
    field: 'costFactors',
    label: 'Cost Factors',
    color: '#D9971B',
    icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.2c0 2.8-6 1.3-6 4.1 0 1.1 1.3 2.2 3 2.2s3-1.1 3-2.5"/>',
    placeholder: 'Quels sont les principaux facteurs de coût (développement, exploitation) ?',
  },
  {
    field: 'channels',
    label: 'Channels',
    color: '#C0244F',
    icon: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8 15.8 7.2M8.2 13.2l7.6 3.6"/>',
    placeholder: 'Comment commercialise-t-on et diffuse-t-on ce produit/service ?',
  },
];

interface ExigenceDraft {
  nom: string;
  description?: string;
  categorieExigence?: CategorieExigence | '';
}

const CATEGORIE_LABEL: Record<CategorieExigence, string> = {
  FONCTIONNELLE: 'Fonctionnelle',
  NON_FONCTIONNELLE: 'Non fonctionnelle',
};

const ICONS: Record<string, string> = {
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash:
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/>',
  upload: '<path d="M12 20V8"/><path d="M7 13l5-5 5 5"/><path d="M4 3h16"/>',
};

@Component({
  selector: 'app-vision',
  standalone: true,
  imports: [CommonModule, BpmnComponent],
  template: `
    <div class="tabs">
      <button class="tab" [class.active]="tab === 'processus'" (click)="tab = 'processus'">Processus</button>
      <button class="tab" [class.active]="tab === 'exigences'" (click)="tab = 'exigences'">Exigence</button>
      <button class="tab" [class.active]="tab === 'diagramme'" (click)="selectCanvas()">Diagramme de vision</button>
    </div>

    <!-- ── Processus ─────────────────────────────────────────────────────── -->
    <app-bpmn *ngIf="tab === 'processus'" />

    <!-- ── Exigences clés ────────────────────────────────────────────────── -->
    <section *ngIf="tab === 'exigences'">
      <div class="page-header">
        <h3>Exigences ({{ exigences.length }})</h3>
        <div class="header-actions">
          <button type="button" class="icon-btn" title="Exporter (Excel)" *ngIf="exigences.length > 0" (click)="exportExigences()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('download')"></svg>
          </button>
          <label class="icon-btn file-btn" title="Importer (Excel)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('upload')"></svg>
            <input type="file" accept=".xlsx,.xls,.csv" (change)="importExigences($event)" hidden />
          </label>
          <button type="button" class="btn btn-primary" (click)="openCreate()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
            Ajouter une exigence
          </button>
        </div>
      </div>

      <section class="card">
        <div class="empty-state" *ngIf="exigences.length === 0">Aucune exigence définie.</div>
        <div class="table-scroll" *ngIf="exigences.length > 0">
          <table class="table">
            <thead><tr><th>Nom</th><th>Description</th><th>Catégorie</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let e of exigences">
                <td>{{ e.nom }}</td>
                <td>{{ e.description || '—' }}</td>
                <td>{{ e.categorieExigence ? categorieLabel(e.categorieExigence) : '—' }}</td>
                <td class="row-actions">
                  <button type="button" class="icon-btn icon-btn-edit" title="Modifier" (click)="openEdit(e)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('edit')"></svg>
                  </button>
                  <button type="button" class="icon-btn icon-btn-danger" title="Supprimer" (click)="remove(e)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('trash')"></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <!-- ── Popover : ajouter/modifier une exigence ───────────────────────── -->
    <div class="popover-backdrop" *ngIf="popoverOpen" (click)="closePopover()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="save($event)">
        <div class="popover-head">
          <h3>{{ editTarget ? 'Modifier « ' + editTarget.nom + ' »' : 'Ajouter une exigence' }}</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closePopover()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <label class="field">Nom<input type="text" [value]="draft.nom" (input)="draft.nom = $any($event.target).value" required /></label>
        <label class="field">Description<textarea [value]="draft.description || ''" (input)="draft.description = $any($event.target).value"></textarea></label>
        <label class="field">
          Catégorie
          <select [value]="draft.categorieExigence || ''" (change)="draft.categorieExigence = $any($event.target).value">
            <option value="">— Non classée —</option>
            <option value="FONCTIONNELLE">Fonctionnelle</option>
            <option value="NON_FONCTIONNELLE">Non fonctionnelle</option>
          </select>
        </label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closePopover()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="saving">{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Diagramme de vision (canevas à 8 blocs) ───────────────────────── -->
    <section class="vc" *ngIf="tab === 'diagramme'">
      <div class="vc-header">
        <strong>Vision</strong>
        <ul>
          <li>Quelle est la motivation de cette transformation ?</li>
          <li>Quel changement positif doit-elle apporter ?</li>
        </ul>
      </div>
      <div class="empty-state" *ngIf="canvasLoading">Chargement…</div>
      <div class="vc-grid" *ngIf="!canvasLoading">
        <div class="vc-card" *ngFor="let block of blocks" [style.--vc-color]="block.color">
          <div class="vc-card-head">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="blockIcon(block.icon)"></svg>
            <span>{{ block.label }}</span>
          </div>
          <textarea
            [value]="fieldValue(block.field)"
            [placeholder]="block.placeholder"
            (input)="setFieldValue(block.field, $any($event.target).value)"
            (blur)="saveField(block.field)"
          ></textarea>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .header-actions { display: flex; align-items: center; gap: 0.5rem; }
      .file-btn { cursor: pointer; }
      .table-scroll { overflow-x: auto; }
      .table { width: 100%; min-width: 640px; border-collapse: collapse; }
      .table th, .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); }
      .row-actions { display: flex; gap: 0.4rem; white-space: nowrap; }

      .vc-header {
        background: #4b4b4b;
        color: #fff;
        border-radius: 14px 14px 0 0;
        padding: 0.9rem 1.25rem;
        display: flex;
        align-items: baseline;
        gap: 1.5rem;
        flex-wrap: wrap;
      }
      .vc-header strong { font-size: 1rem; flex-shrink: 0; }
      .vc-header ul { list-style: disc; margin: 0; padding-left: 1.2rem; font-size: 0.85rem; color: #e2e2e2; }
      .vc-header li { margin: 0.15rem 0; }
      .vc-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-auto-rows: 1fr;
        gap: 2px;
        border-radius: 0 0 14px 14px;
        overflow: hidden;
      }
      .vc-card { display: flex; flex-direction: column; background: var(--vc-color); min-height: 190px; }
      .vc-card-head {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.7rem 0.85rem;
        color: #fff;
        font-weight: 700;
        font-size: 0.92rem;
      }
      .vc-card textarea {
        flex: 1;
        resize: none;
        border: none;
        background: rgba(255, 255, 255, 0.94);
        margin: 0 0.6rem 0.6rem;
        border-radius: 8px;
        padding: 0.6rem 0.7rem;
        font: inherit;
        font-size: 0.85rem;
        color: #1a1a1a;
      }
      .vc-card textarea:focus { outline: 2px solid rgba(255, 255, 255, 0.8); }
      @media (max-width: 900px) {
        .vc-grid { grid-template-columns: repeat(2, 1fr); }
      }
      @media (max-width: 560px) {
        .vc-grid { grid-template-columns: 1fr; }
        .vc-header { flex-direction: column; gap: 0.4rem; }
      }
    `,
  ],
})
export class VisionComponent implements OnInit {
  tab: Tab = 'processus';

  exigences: ElementArchimate[] = [];

  popoverOpen = false;
  editTarget: ElementArchimate | null = null;
  draft: ExigenceDraft = { nom: '' };
  saving = false;

  blocks = VISION_BLOCKS;
  canvas: VisionCanvas = { id: '' };
  canvasLoading = false;
  private canvasLoaded = false;

  constructor(
    private archimateService: ArchimateService,
    private visionCanvasService: VisionCanvasService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadExigences();
  }

  icon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] ?? '');
  }

  blockIcon(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  categorieLabel(c: CategorieExigence): string {
    return CATEGORIE_LABEL[c];
  }

  // ── Exigences clés ──────────────────────────────────────────────────────

  loadExigences(): void {
    this.archimateService.listElements('EXIGENCE').subscribe({
      next: (exigences) => (this.exigences = exigences),
      error: () => this.toast.error('Impossible de charger les exigences.'),
    });
  }

  openCreate(): void {
    this.editTarget = null;
    this.draft = { nom: '' };
    this.popoverOpen = true;
  }

  openEdit(e: ElementArchimate): void {
    this.editTarget = e;
    this.draft = { nom: e.nom, description: e.description ?? '', categorieExigence: e.categorieExigence ?? '' };
    this.popoverOpen = true;
  }

  closePopover(): void {
    this.popoverOpen = false;
    this.editTarget = null;
  }

  save(event: Event): void {
    event.preventDefault();
    if (!this.draft.nom.trim()) return;
    this.saving = true;
    const payload = {
      nom: this.draft.nom,
      description: this.draft.description || undefined,
      categorieExigence: this.draft.categorieExigence || undefined,
    };
    const request$ = this.editTarget
      ? this.archimateService.updateElement(this.editTarget.id, payload)
      : this.archimateService.createElement({ ...payload, type: 'EXIGENCE' });

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.closePopover();
        this.loadExigences();
        this.toast.success(this.editTarget ? 'Exigence modifiée.' : 'Exigence créée.');
      },
      error: () => {
        this.saving = false;
        this.toast.error('Impossible d’enregistrer cette exigence.');
      },
    });
  }

  async remove(e: ElementArchimate): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Supprimer l'exigence « ${e.nom} » ?`);
    if (!confirmed) return;
    this.archimateService.deleteElement(e.id).subscribe({
      next: () => {
        this.exigences = this.exigences.filter((x) => x.id !== e.id);
        this.toast.success('Exigence supprimée.');
      },
      error: () => this.toast.error('Impossible de supprimer cette exigence.'),
    });
  }

  exportExigences(): void {
    exportToExcel(
      'exigences',
      'Exigences',
      this.exigences.map((e) => ({
        Nom: e.nom,
        Description: e.description ?? '',
        Catégorie: e.categorieExigence ? this.categorieLabel(e.categorieExigence) : '',
      })),
    );
  }

  exportGroupe(categorie: CategorieExigence): void {
    const rows = (categorie === 'FONCTIONNELLE' ? this.fonctionnelles : this.nonFonctionnelles).map((e) => ({
      Nom: e.nom,
      Description: e.description ?? '',
    }));
    exportToExcel(
      categorie === 'FONCTIONNELLE' ? 'exigences-fonctionnelles' : 'exigences-non-fonctionnelles',
      'Exigences',
      rows,
    );
  }

  async importExigences(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (!file) return;

    try {
      const rows = await importFromExcel(file);
      const categorieByLabel: Record<string, CategorieExigence> = {
        Fonctionnelle: 'FONCTIONNELLE',
        'Non fonctionnelle': 'NON_FONCTIONNELLE',
      };
      let imported = 0;
      for (const row of rows) {
        const nom = String(row['Nom'] ?? '').trim();
        if (!nom) continue;
        const description = row['Description'] ? String(row['Description']) : undefined;
        const categorieLabelValue = row['Catégorie'] ? String(row['Catégorie']).trim() : '';
        const categorieExigence = categorieByLabel[categorieLabelValue];
        await firstValueFrom(this.archimateService.createElement({ type: 'EXIGENCE', nom, description, categorieExigence }));
        imported++;
      }
      this.loadExigences();
      this.toast.success(`${imported} exigence(s) importée(s).`);
    } catch {
      this.toast.error("Impossible d'importer ce fichier.");
    }
  }

  // ── Diagramme de vision (canevas à 8 blocs) ──────────────────────────────

  selectCanvas(): void {
    this.tab = 'diagramme';
    if (this.canvasLoaded) return;
    this.canvasLoading = true;
    this.visionCanvasService.get().subscribe({
      next: (canvas) => {
        this.canvas = canvas;
        this.canvasLoading = false;
        this.canvasLoaded = true;
      },
      error: () => {
        this.canvasLoading = false;
        this.toast.error('Impossible de charger le canevas de vision.');
      },
    });
  }

  fieldValue(field: VisionCanvasField): string {
    return this.canvas[field] ?? '';
  }

  setFieldValue(field: VisionCanvasField, value: string): void {
    this.canvas = { ...this.canvas, [field]: value };
  }

  saveField(field: VisionCanvasField): void {
    const payload: UpdateVisionCanvasPayload = { [field]: this.fieldValue(field) };
    this.visionCanvasService.update(payload).subscribe({
      error: () => this.toast.error('Impossible d’enregistrer.'),
    });
  }
}
