import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { ArchimateService } from '../architecture-metier/archimate.service';
import { ServiceEntrepriseService } from '../organisation/service-entreprise.service';
import { ToastService } from '../shared/toast.service';
import { downloadPng, downloadSvg } from '../shared/download.util';
import { DownloadMenuComponent, DownloadFormatOption } from '../shared/download-menu.component';

type VueTab = 'archimate' | 'organigramme';

const SVG_PNG_FORMATS: DownloadFormatOption[] = [
  { value: 'svg', label: 'SVG' },
  { value: 'png', label: 'PNG' },
];

interface VueState {
  svg: string;
  trustedSvg: SafeHtml | null;
  loading: boolean;
  loaded: boolean;
  summary: string;
}

function emptyState(): VueState {
  return { svg: '', trustedSvg: null, loading: false, loaded: false, summary: '' };
}

const ICONS: Record<string, string> = {
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
};

@Component({
  selector: 'app-vues',
  standalone: true,
  imports: [CommonModule, DownloadMenuComponent],
  template: `
    <div class="tabs">
      <button class="tab" [class.active]="tab === 'archimate'" (click)="select('archimate')">Vue ArchiMate</button>
      <button class="tab" [class.active]="tab === 'organigramme'" (click)="select('organigramme')">Organigramme</button>
    </div>

    <section class="card">
      <div class="page-header">
        <p class="summary">{{ current.summary }}</p>
        <div class="actions">
          <button type="button" class="icon-btn" title="Rafraîchir la vue" [disabled]="current.loading" (click)="generate(tab)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('refresh')"></svg>
          </button>
          <app-download-menu [formats]="svgPngFormats" [disabled]="!current.svg" (download)="export($event)" />
        </div>
      </div>
      <div class="empty-state" *ngIf="current.loading && !current.svg">Génération de la vue…</div>
      <div class="svg-container" *ngIf="current.trustedSvg" [innerHTML]="current.trustedSvg"></div>
    </section>
  `,
  styles: [
    `
      .summary { color: var(--color-text-muted); }
      .actions { display: flex; gap: 0.5rem; }
      .svg-container { overflow: auto; border: 1px solid var(--color-border); border-radius: 12px; padding: 1rem; }
      .svg-container ::ng-deep svg { max-width: 100%; height: auto; }
    `,
  ],
})
export class VuesComponent implements OnInit {
  tab: VueTab = 'archimate';
  svgPngFormats = SVG_PNG_FORMATS;

  states: Record<VueTab, VueState> = {
    archimate: emptyState(),
    organigramme: emptyState(),
  };

  constructor(
    private archimateService: ArchimateService,
    private serviceEntrepriseService: ServiceEntrepriseService,
    private toast: ToastService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.generate(this.tab);
  }

  get current(): VueState {
    return this.states[this.tab];
  }

  icon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] ?? '');
  }

  select(tab: VueTab): void {
    this.tab = tab;
    if (!this.states[tab].loaded && !this.states[tab].loading) this.generate(tab);
  }

  generate(tab: VueTab): void {
    const state = this.states[tab];
    state.loading = true;

    const request$: Observable<any> =
      tab === 'archimate'
        ? this.archimateService.generateView()
        : this.serviceEntrepriseService.generateView();

    request$.subscribe({
      next: (view: any) => {
        state.svg = view.svg;
        state.trustedSvg = this.sanitizer.bypassSecurityTrustHtml(view.svg);
        state.summary = this.summaryFor(tab, view);
        state.loading = false;
        state.loaded = true;
      },
      error: () => {
        state.loading = false;
        this.toast.error('Impossible de générer cette vue.');
      },
    });
  }

  private summaryFor(tab: VueTab, view: any): string {
    if (tab === 'archimate') return `${view.elementCount} élément(s) — ${view.relationCount} relation(s)`;
    return `${view.serviceCount} service(s) — ${view.membreCount} membre(s)`;
  }

  export(format: string): void {
    const state = this.current;
    if (!state.svg) return;
    const filename = `${this.tab}.${format}`;
    if (format === 'svg') downloadSvg(state.svg, filename);
    else downloadPng(state.svg, filename);
  }
}
