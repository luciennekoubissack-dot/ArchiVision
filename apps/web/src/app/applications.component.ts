import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Application, ComponentsView, UrbanisationService } from './urbanisation.service';
import { ApplicationsCanevasComponent } from './applications-canevas.component';
import { ArchitectureApplicativeCanevasComponent } from './architecture-applicative-canevas.component';
import { ArchiApplicativeView, ArchitectureApplicativeService } from './architecture-applicative.service';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';
import { downloadPng, downloadSvg } from './download.util';

type Tab = 'portefeuille' | 'diagramme' | 'archi-applicative';
type SubTab = 'editeur' | 'diagramme';

const ICONS: Record<string, string> = {
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash:
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  clear: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
  download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/>',
};

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, ApplicationsCanevasComponent, ArchitectureApplicativeCanevasComponent],
  template: `
    <p class="muted step-question">Quelles applications supportent les processus métier ?</p>

    <div class="tabs">
      <button class="tab" [class.active]="tab === 'portefeuille'" (click)="tab = 'portefeuille'">Portefeuille</button>
      <button class="tab" [class.active]="tab === 'diagramme'" (click)="tab = 'diagramme'">Diagramme de composants</button>
      <button class="tab" [class.active]="tab === 'archi-applicative'" (click)="tab = 'archi-applicative'">Diagramme d'architecture applicative</button>
    </div>

    <!-- ── Diagramme de composants (sous-onglets) ─────────────────────────── -->
    <div class="tabs sub-tabs" *ngIf="tab === 'diagramme'">
      <button class="tab" [class.active]="diagSubTab === 'editeur'" (click)="diagSubTab = 'editeur'">Éditeur</button>
      <button class="tab" [class.active]="diagSubTab === 'diagramme'" (click)="diagSubTab = 'diagramme'">Diagramme généré</button>
    </div>

    <section *ngIf="tab === 'diagramme' && diagSubTab === 'editeur'">
      <app-applications-canevas (changed)="load()" />
    </section>

    <section class="card" *ngIf="tab === 'diagramme' && diagSubTab === 'diagramme'">
      <div class="page-header">
        <p class="summary">{{ diagSummary }}</p>
        <div class="actions">
          <button type="button" class="icon-btn" title="Générer" [disabled]="diagLoading" (click)="generateDiagramme()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('refresh')"></svg>
          </button>
          <button type="button" class="icon-btn icon-btn-danger" title="Effacer" *ngIf="diagSvg" (click)="clearDiagramme()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('clear')"></svg>
          </button>
          <button type="button" class="icon-btn" title="Exporter SVG" *ngIf="diagSvg" (click)="exportDiagramme('svg')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('download')"></svg>
          </button>
          <button type="button" class="icon-btn" title="Exporter PNG" *ngIf="diagSvg" (click)="exportDiagramme('png')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('download')"></svg>
          </button>
        </div>
      </div>
      <div class="empty-state" *ngIf="diagLoading">Génération de la vue…</div>
      <div class="empty-state" *ngIf="!diagLoading && !diagSvg">Cliquez sur « Générer » pour afficher le diagramme.</div>
      <div class="svg-container" *ngIf="diagTrustedSvg" [innerHTML]="diagTrustedSvg"></div>
    </section>

    <!-- ── Architecture applicative (sous-onglets) ───────────────────────── -->
    <div class="tabs sub-tabs" *ngIf="tab === 'archi-applicative'">
      <button class="tab" [class.active]="archiSubTab === 'editeur'" (click)="archiSubTab = 'editeur'">Éditeur</button>
      <button class="tab" [class.active]="archiSubTab === 'diagramme'" (click)="archiSubTab = 'diagramme'">Diagramme généré</button>
    </div>

    <section *ngIf="tab === 'archi-applicative' && archiSubTab === 'editeur'">
      <app-architecture-applicative-canevas />
    </section>

    <section class="card" *ngIf="tab === 'archi-applicative' && archiSubTab === 'diagramme'">
      <div class="page-header">
        <p class="summary">{{ archiSummary }}</p>
        <div class="actions">
          <button type="button" class="icon-btn" title="Générer" [disabled]="archiLoading" (click)="generateArchi()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('refresh')"></svg>
          </button>
          <button type="button" class="icon-btn icon-btn-danger" title="Effacer" *ngIf="archiSvg" (click)="clearArchi()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('clear')"></svg>
          </button>
          <button type="button" class="icon-btn" title="Exporter SVG" *ngIf="archiSvg" (click)="exportArchi('svg')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('download')"></svg>
          </button>
          <button type="button" class="icon-btn" title="Exporter PNG" *ngIf="archiSvg" (click)="exportArchi('png')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('download')"></svg>
          </button>
        </div>
      </div>
      <div class="empty-state" *ngIf="archiLoading">Génération de la vue…</div>
      <div class="empty-state" *ngIf="!archiLoading && !archiSvg">Cliquez sur « Générer » pour afficher le diagramme.</div>
      <div class="svg-container" *ngIf="archiTrustedSvg" [innerHTML]="archiTrustedSvg"></div>
    </section>

    <section *ngIf="tab === 'portefeuille'">
      <div class="page-header">
        <h3>Applications ({{ applications.length }})</h3>
        <button type="button" class="btn btn-primary" (click)="openCreate()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
          Ajouter une application
        </button>
      </div>

      <section class="card">
        <div class="empty-state" *ngIf="applications.length === 0">Aucune application dans le portefeuille.</div>
        <div class="table-scroll" *ngIf="applications.length > 0">
          <table class="table">
            <thead><tr><th>Nom</th><th>Description</th><th>Services</th><th>Liens</th><th>Affectations</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let app of applications">
                <td>{{ app.nom }}</td>
                <td>{{ app.description || '—' }}</td>
                <td>{{ app._count?.services || 0 }}</td>
                <td>{{ linkCount(app) }}</td>
                <td>{{ app._count?.zones || 0 }}</td>
                <td class="row-actions">
                  <button type="button" class="icon-btn icon-btn-view" title="Consulter" (click)="openView(app)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('eye')"></svg>
                  </button>
                  <button type="button" class="icon-btn icon-btn-edit" title="Modifier" (click)="openEdit(app)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('edit')"></svg>
                  </button>
                  <button type="button" class="icon-btn icon-btn-danger" title="Supprimer" (click)="remove(app)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('trash')"></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <!-- ── Popover : ajouter une application ─────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="createPopover" (click)="closeCreate()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="create($event)">
        <div class="popover-head">
          <h3>Ajouter une application</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeCreate()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <label class="field">Nom<input type="text" [value]="newApp.nom" (input)="newApp.nom = $any($event.target).value" required /></label>
        <label class="field">Description<textarea [value]="newApp.description || ''" (input)="newApp.description = $any($event.target).value"></textarea></label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCreate()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creating">{{ creating ? 'Création…' : 'Créer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Popover : consulter une application ───────────────────────────── -->
    <div class="popover-backdrop" *ngIf="viewTarget as app" (click)="closeView()">
      <div class="popover-card" (click)="$event.stopPropagation()">
        <div class="popover-head">
          <h3>Fiche application</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeView()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <dl class="fiche-list">
          <dt>Nom</dt><dd>{{ app.nom }}</dd>
          <dt>Description</dt><dd>{{ app.description || '—' }}</dd>
        </dl>
        <hr />
        <h4>Services fournis</h4>
        <div class="empty-state" *ngIf="!app.services || app.services.length === 0">Aucun service défini.</div>
        <ul class="zone-list" *ngIf="app.services && app.services.length > 0">
          <li *ngFor="let s of app.services">
            <div>
              <strong>{{ s.nom }}</strong>
              <p class="muted" *ngIf="s.description">{{ s.description }}</p>
            </div>
            <button class="btn btn-ghost" (click)="removeService(app, s.id)">Retirer</button>
          </li>
        </ul>
        <form class="inline-form" (submit)="addService(app, $event)">
          <input type="text" placeholder="Nom du service" [value]="newService.nom" (input)="newService.nom = $any($event.target).value" required />
          <input type="text" placeholder="Description (facultatif)" [value]="newService.description || ''" (input)="newService.description = $any($event.target).value" />
          <button type="submit" class="btn btn-outline">Ajouter</button>
        </form>
        <hr />
        <h4>Liens applicatifs (interactions avec d'autres systèmes)</h4>
        <p class="muted">Créés depuis le diagramme de composants, en reliant deux applications.</p>
        <div class="empty-state" *ngIf="appLinks(app).length === 0">Aucune interaction définie avec une autre application.</div>
        <ul class="zone-list" *ngIf="appLinks(app).length > 0">
          <li *ngFor="let link of appLinks(app)">
            <div>
              <strong>{{ link.direction }} {{ link.otherNom }}</strong>
              <p class="muted" *ngIf="link.meta">{{ link.meta }}</p>
            </div>
            <button class="btn btn-ghost" (click)="removeLink(app, link.id)">Retirer</button>
          </li>
        </ul>
        <hr />
        <h4>Affectations</h4>
        <div class="empty-state" *ngIf="!app.zones || app.zones.length === 0">Non affectée à un îlot pour l'instant.</div>
        <ul class="zone-list" *ngIf="app.zones && app.zones.length > 0">
          <li *ngFor="let z of app.zones">
            {{ z.zone.nom }}
            <button class="btn btn-ghost" (click)="desaffecter(app, z.zone.id)">Désaffecter</button>
          </li>
        </ul>
      </div>
    </div>

    <!-- ── Popover : modifier une application ────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="editTarget && editDraft as draft" (click)="closeEdit()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="saveEdit($event)">
        <div class="popover-head">
          <h3>Modifier « {{ editTarget.nom }} »</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeEdit()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <label class="field">Nom<input type="text" [value]="draft.nom" (input)="draft.nom = $any($event.target).value" required /></label>
        <label class="field">Description<textarea [value]="draft.description || ''" (input)="draft.description = $any($event.target).value"></textarea></label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeEdit()">Annuler</button>
          <button type="submit" class="btn btn-success" [disabled]="saving">{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
      .table-scroll { overflow-x: auto; }
      .table { width: 100%; min-width: 600px; border-collapse: collapse; }
      .table th, .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); }
      .row-actions { display: flex; gap: 0.4rem; white-space: nowrap; }
      .muted { color: var(--color-text-muted); margin-top: 0.35rem; font-size: 0.9rem; }
      hr { border: none; border-top: 1px solid var(--color-border); margin: 1rem 0; }
      .zone-list { list-style: none; display: grid; gap: 0.4rem; }
      .zone-list li { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.6rem; border: 1px solid var(--color-border); border-radius: 8px; }
      .inline-form { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.6rem; }
      .inline-form input { padding: 0.6rem 0.75rem; border: 1px solid var(--color-border); border-radius: 8px; font: inherit; flex: 1; min-width: 140px; }
      .sub-tabs { margin: 1rem 0 1.25rem; }
      .summary { color: var(--color-text-muted); }
      .actions { display: flex; gap: 0.5rem; }
      .svg-container { overflow: auto; border: 1px solid var(--color-border); border-radius: 12px; padding: 1rem; }
      .svg-container ::ng-deep svg { max-width: 100%; height: auto; }
    `,
  ],
})
export class ApplicationsComponent implements OnInit {
  tab: Tab = 'portefeuille';
  diagSubTab: SubTab = 'editeur';
  diagSvg = '';
  diagTrustedSvg: SafeHtml | null = null;
  diagSummary = '';
  diagLoading = false;
  archiSubTab: SubTab = 'editeur';
  archiSvg = '';
  archiTrustedSvg: SafeHtml | null = null;
  archiSummary = '';
  archiLoading = false;
  applications: Application[] = [];
  newApp: { nom: string; description?: string } = { nom: '' };
  creating = false;
  createPopover = false;
  viewTarget: Application | null = null;
  editTarget: Application | null = null;
  editDraft: { nom: string; description?: string } | null = null;
  saving = false;
  newService: { nom: string; description?: string } = { nom: '' };

  constructor(
    private urbanisationService: UrbanisationService,
    private archiApplicativeService: ArchitectureApplicativeService,
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
    this.newApp = { nom: '' };
    this.createPopover = true;
  }

  closeCreate(): void {
    this.createPopover = false;
  }

  linkCount(app: Application): number {
    return (app._count?.echangesSource ?? 0) + (app._count?.echangesTarget ?? 0);
  }

  /** Fusionne échangesSource/échangesTarget en une liste unique orientée depuis `app`. */
  appLinks(app: Application): { id: string; direction: string; otherNom: string; meta: string }[] {
    const asSource = (app.echangesSource ?? []).map((e) => ({
      id: e.id,
      direction: '→',
      otherNom: e.target?.nom ?? '?',
      meta: [e.description, e.protocole].filter(Boolean).join(' · '),
    }));
    const asTarget = (app.echangesTarget ?? []).map((e) => ({
      id: e.id,
      direction: '←',
      otherNom: e.source?.nom ?? '?',
      meta: [e.description, e.protocole].filter(Boolean).join(' · '),
    }));
    return [...asSource, ...asTarget];
  }

  removeLink(app: Application, echangeId: string): void {
    this.urbanisationService.deleteEchange(echangeId).subscribe({
      next: () => {
        app.echangesSource = (app.echangesSource ?? []).filter((e) => e.id !== echangeId);
        app.echangesTarget = (app.echangesTarget ?? []).filter((e) => e.id !== echangeId);
        this.load();
        this.toast.success('Lien retiré.');
      },
      error: () => this.toast.error('Impossible de retirer ce lien.'),
    });
  }

  load(): void {
    this.urbanisationService.listApplications().subscribe({
      next: (apps) => (this.applications = apps),
      error: () => this.toast.error('Impossible de charger les applications.'),
    });
  }

  create(event: Event): void {
    event.preventDefault();
    this.creating = true;
    this.urbanisationService.createApplication(this.newApp).subscribe({
      next: (app) => {
        this.applications = [...this.applications, app];
        this.creating = false;
        this.closeCreate();
        this.toast.success('Application créée.');
      },
      error: () => {
        this.creating = false;
        this.toast.error('Impossible de créer cette application.');
      },
    });
  }

  async remove(app: Application): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Supprimer l'application « ${app.nom} » ?`);
    if (!confirmed) return;
    this.urbanisationService.deleteApplication(app.id).subscribe({
      next: () => {
        this.applications = this.applications.filter((a) => a.id !== app.id);
        this.toast.success('Application supprimée.');
      },
      error: () => this.toast.error('Impossible de supprimer cette application.'),
    });
  }

  openView(app: Application): void {
    this.viewTarget = app;
    this.newService = { nom: '' };
    if (app.zones && app.services && app.echangesSource && app.echangesTarget) return; // déjà chargé
    // GET /applications/:id renvoie les zones affectées, les services et les
    // liens applicatifs (échanges), absents de la liste du portefeuille.
    this.urbanisationService.getApplication(app.id).subscribe({
      next: (detail) => {
        app.zones = detail.zones;
        app.services = detail.services;
        app.echangesSource = detail.echangesSource;
        app.echangesTarget = detail.echangesTarget;
      },
      error: () => this.toast.error("Impossible de charger le détail de cette application."),
    });
  }

  closeView(): void {
    this.viewTarget = null;
  }

  addService(app: Application, event: Event): void {
    event.preventDefault();
    if (!this.newService.nom.trim()) return;
    this.urbanisationService.addService(app.id, this.newService).subscribe({
      next: (service) => {
        app.services = [...(app.services ?? []), service];
        app._count = {
          zones: app._count?.zones ?? 0,
          services: (app._count?.services ?? 0) + 1,
          echangesSource: app._count?.echangesSource ?? 0,
          echangesTarget: app._count?.echangesTarget ?? 0,
        };
        this.newService = { nom: '' };
        this.toast.success('Service ajouté.');
      },
      error: () => this.toast.error("Impossible d'ajouter ce service."),
    });
  }

  removeService(app: Application, serviceId: string): void {
    this.urbanisationService.removeService(serviceId).subscribe({
      next: () => {
        app.services = (app.services ?? []).filter((s) => s.id !== serviceId);
        if (app._count) app._count.services = Math.max(0, app._count.services - 1);
        this.toast.success('Service retiré.');
      },
      error: () => this.toast.error('Impossible de retirer ce service.'),
    });
  }

  openEdit(app: Application): void {
    this.editTarget = app;
    this.editDraft = { nom: app.nom, description: app.description ?? '' };
  }

  closeEdit(): void {
    this.editTarget = null;
    this.editDraft = null;
  }

  saveEdit(event: Event): void {
    event.preventDefault();
    if (!this.editTarget || !this.editDraft || !this.editDraft.nom.trim()) return;
    this.saving = true;
    this.urbanisationService.updateApplication(this.editTarget.id, this.editDraft).subscribe({
      next: (updated) => {
        this.applications = this.applications.map((a) => (a.id === updated.id ? { ...a, ...updated } : a));
        this.saving = false;
        this.closeEdit();
        this.toast.success('Application modifiée.');
      },
      error: () => {
        this.saving = false;
        this.toast.error('Impossible de modifier cette application.');
      },
    });
  }

  desaffecter(app: Application, zoneId: string): void {
    this.urbanisationService.desaffecter(zoneId, app.id).subscribe({
      next: () => {
        app.zones = (app.zones ?? []).filter((z) => z.zone.id !== zoneId);
        this.load();
        this.toast.success('Application désaffectée.');
      },
      error: () => this.toast.error('Impossible de désaffecter cette application.'),
    });
  }

  // ── Diagramme de composants : diagramme généré ──────────────────────────

  generateDiagramme(): void {
    this.diagLoading = true;
    this.urbanisationService.generateComponentsView().subscribe({
      next: (view: ComponentsView) => {
        this.diagSvg = view.svg;
        this.diagTrustedSvg = this.sanitizer.bypassSecurityTrustHtml(view.svg);
        this.diagSummary = `${view.applicationCount} application(s), ${view.echangeCount} échange(s)`;
        this.diagLoading = false;
      },
      error: () => {
        this.diagLoading = false;
        this.toast.error('Impossible de générer le diagramme de composants.');
      },
    });
  }

  clearDiagramme(): void {
    this.diagSvg = '';
    this.diagTrustedSvg = null;
    this.diagSummary = '';
  }

  exportDiagramme(format: 'svg' | 'png'): void {
    if (!this.diagSvg) return;
    const filename = 'diagramme-de-composants';
    if (format === 'svg') downloadSvg(this.diagSvg, filename);
    else downloadPng(this.diagSvg, filename);
  }

  // ── Architecture applicative : diagramme généré ─────────────────────────

  generateArchi(): void {
    this.archiLoading = true;
    this.archiApplicativeService.generateView().subscribe({
      next: (view: ArchiApplicativeView) => {
        this.archiSvg = view.svg;
        this.archiTrustedSvg = this.sanitizer.bypassSecurityTrustHtml(view.svg);
        this.archiSummary = `${view.elementCount} élément(s), ${view.fluxCount} flux`;
        this.archiLoading = false;
      },
      error: () => {
        this.archiLoading = false;
        this.toast.error("Impossible de générer le diagramme d'architecture applicative.");
      },
    });
  }

  clearArchi(): void {
    this.archiSvg = '';
    this.archiTrustedSvg = null;
    this.archiSummary = '';
  }

  exportArchi(format: 'svg' | 'png'): void {
    if (!this.archiSvg) return;
    const filename = 'architecture-applicative';
    if (format === 'svg') downloadSvg(this.archiSvg, filename);
    else downloadPng(this.archiSvg, filename);
  }
}
