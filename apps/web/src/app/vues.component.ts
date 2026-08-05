import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { ArchimateService } from './archimate.service';
import { UrbanisationService } from './urbanisation.service';
import { ServiceEntrepriseService } from './service-entreprise.service';
import { ToastService } from './toast.service';
import { downloadPng, downloadSvg } from './download.util';

type VueTab = 'archimate' | 'organigramme' | 'pos';

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

@Component({
  selector: 'app-vues',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header"><h2>Vues générées</h2></div>

    <div class="tabs">
      <button class="tab" [class.active]="tab === 'archimate'" (click)="select('archimate')">Vue ArchiMate</button>
      <button class="tab" [class.active]="tab === 'organigramme'" (click)="select('organigramme')">Organigramme</button>
      <button class="tab" [class.active]="tab === 'pos'" (click)="select('pos')">POS (urbanisation)</button>
    </div>

    <section class="card">
      <div class="page-header">
        <p class="summary">{{ current.summary }}</p>
        <div class="actions" *ngIf="current.svg">
          <button class="btn btn-outline" (click)="export('svg')">Exporter SVG</button>
          <button class="btn btn-outline" (click)="export('png')">Exporter PNG</button>
        </div>
      </div>
      <div class="empty-state" *ngIf="current.loading">Génération de la vue…</div>
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
export class VuesComponent {
  tab: VueTab = 'archimate';

  states: Record<VueTab, VueState> = {
    archimate: emptyState(),
    organigramme: emptyState(),
    pos: emptyState(),
  };

  constructor(
    private archimateService: ArchimateService,
    private urbanisationService: UrbanisationService,
    private serviceEntrepriseService: ServiceEntrepriseService,
    private toast: ToastService,
    private sanitizer: DomSanitizer,
  ) {
    this.select('archimate');
  }

  get current(): VueState {
    return this.states[this.tab];
  }

  select(tab: VueTab): void {
    this.tab = tab;
    if (this.states[tab].loaded) return;
    this.load(tab);
  }

  private load(tab: VueTab): void {
    const state = this.states[tab];
    state.loading = true;

    const request$: Observable<any> =
      tab === 'archimate'
        ? this.archimateService.generateView()
        : tab === 'organigramme'
          ? this.serviceEntrepriseService.generateView()
          : this.urbanisationService.generateView();

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
    if (tab === 'organigramme') return `${view.serviceCount} service(s) — ${view.membreCount} membre(s)`;
    return `${view.zoneCount} zone(s) — ${view.applicationCount} affectation(s)`;
  }

  export(format: 'svg' | 'png'): void {
    const state = this.current;
    if (!state.svg) return;
    const filename = `${this.tab}.${format}`;
    if (format === 'svg') downloadSvg(state.svg, filename);
    else downloadPng(state.svg, filename);
  }
}
