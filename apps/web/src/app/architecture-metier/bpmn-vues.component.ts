import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BpmnProcessus, BpmnService, TypeProcessus } from '../vision/bpmn.service';
import { ToastService } from '../shared/toast.service';
import { downloadPng, downloadSvg } from '../shared/download.util';
import { DownloadMenuComponent, DownloadFormatOption } from '../shared/download-menu.component';

const TYPE_PROCESSUS_ORDER: TypeProcessus[] = ['PILOTAGE', 'METIER', 'SUPPORT'];
const TYPE_PROCESSUS_LABEL: Record<TypeProcessus, string> = {
  PILOTAGE: 'Processus de pilotage',
  METIER: 'Processus métier',
  SUPPORT: 'Processus support',
};
const SVG_PNG_FORMATS: DownloadFormatOption[] = [
  { value: 'svg', label: 'SVG' },
  { value: 'png', label: 'PNG' },
];

const ICONS: Record<string, string> = {
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  clear: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
};

@Component({
  selector: 'app-bpmn-vues',
  standalone: true,
  imports: [CommonModule, DownloadMenuComponent],
  template: `
    <p class="muted intro">
      Chaque processus défini dans le module Vision dispose ici de son diagramme BPMN généré  sélectionnez un
      processus, dans n'importe quelle catégorie, pour l'afficher.
    </p>

    <div class="layout">
      <div class="processus-list">
        <div class="card empty-state" *ngIf="processus.length === 0">
          Aucun processus défini — ajoutez-en depuis le module Vision.
        </div>
        <ng-container *ngFor="let t of typesProcessus">
          <section class="card processus-groupe" *ngIf="processusParType(t).length > 0">
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
                    <td><span class="badge badge-neutral">{{ p._count?.elements || 0 }} étape(s)</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </ng-container>
      </div>

      <section class="card processus-detail" *ngIf="selected">
        <div class="page-header">
          <h3>{{ selected.nom }}</h3>
          <div class="actions">
            <button type="button" class="icon-btn" title="Rafraîchir le diagramme" [disabled]="loading" (click)="generate()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('refresh')"></svg>
            </button>
            <button type="button" class="icon-btn icon-btn-danger" title="Vider le diagramme" [disabled]="loading || !svg" (click)="clear()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('clear')"></svg>
            </button>
            <app-download-menu [formats]="svgPngFormats" [disabled]="!svg" (download)="export($event)" />
          </div>
        </div>
        <p class="summary" *ngIf="summary">{{ summary }}</p>
        <div class="empty-state" *ngIf="loading && !svg">Génération du diagramme…</div>
        <div class="svg-container" *ngIf="trustedSvg" [innerHTML]="trustedSvg"></div>
      </section>
    </div>
  `,
  styles: [
    `
      .intro { color: var(--color-text-muted); max-width: 760px; margin: -0.5rem 0 1.25rem; }
      .layout { display: grid; grid-template-columns: 300px 1fr; gap: 1.25rem; align-items: start; }
      .processus-list { display: grid; gap: 1rem; }
      .processus-groupe h4 { margin: 0 0 0.6rem; font-size: 0.85rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
      .table-scroll { overflow-x: auto; }
      .table { width: 100%; border-collapse: collapse; }
      .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); }
      .table tbody tr { cursor: pointer; }
      .table tbody tr.selected { background: var(--color-primary-light); }
      .actions { display: flex; gap: 0.5rem; }
      .summary { color: var(--color-text-muted); margin-top: -0.5rem; }
      .svg-container { overflow: auto; border: 1px solid var(--color-border); border-radius: 12px; padding: 1rem; margin-top: 1rem; }
      .svg-container ::ng-deep svg { max-width: 100%; height: auto; }
      @media (max-width: 900px) {
        .layout { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class BpmnVuesComponent implements OnInit {
  typesProcessus = TYPE_PROCESSUS_ORDER;
  svgPngFormats = SVG_PNG_FORMATS;
  processus: BpmnProcessus[] = [];
  selected: BpmnProcessus | null = null;

  svg = '';
  trustedSvg: SafeHtml | null = null;
  summary = '';
  loading = false;

  constructor(
    private bpmnService: BpmnService,
    private toast: ToastService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.bpmnService.list().subscribe({
      next: (processus) => (this.processus = processus),
      error: () => this.toast.error('Impossible de charger les processus.'),
    });
  }

  icon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] ?? '');
  }

  typeProcessusLabel(type: TypeProcessus): string {
    return TYPE_PROCESSUS_LABEL[type];
  }

  processusParType(type: TypeProcessus): BpmnProcessus[] {
    return this.processus.filter((p) => p.type === type);
  }

  select(p: BpmnProcessus): void {
    this.selected = p;
    this.svg = '';
    this.trustedSvg = null;
    this.summary = '';
    this.generate();
  }

  generate(): void {
    if (!this.selected) return;
    this.loading = true;
    this.bpmnService.generateView(this.selected.id).subscribe({
      next: (view) => {
        this.svg = view.svg;
        this.trustedSvg = this.sanitizer.bypassSecurityTrustHtml(view.svg);
        this.summary = `${view.elementCount} étape(s) — ${view.flowCount} flux`;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Impossible de générer ce diagramme.');
      },
    });
  }

  export(format: string): void {
    if (!this.svg || !this.selected) return;
    const filename = `bpmn-${this.selected.nom}.${format}`;
    if (format === 'svg') downloadSvg(this.svg, filename);
    else downloadPng(this.svg, filename);
  }

  clear(): void {
    this.svg = '';
    this.trustedSvg = null;
    this.summary = '';
  }
}
