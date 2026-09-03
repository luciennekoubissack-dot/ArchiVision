import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  Application,
  TypeZone,
  UrbanisationService,
  UrbanisationView,
  ZoneUrbanisation,
} from './urbanisation.service';
import { ToastService } from '../shared/toast.service';
import { ConfirmDialogService } from '../shared/confirm-dialog.service';
import { downloadPng, downloadSvg } from '../shared/download.util';
import { DownloadMenuComponent, DownloadFormatOption } from '../shared/download-menu.component';

type Tab = 'zones' | 'affectations' | 'pos';

const SVG_PNG_FORMATS: DownloadFormatOption[] = [
  { value: 'svg', label: 'SVG' },
  { value: 'png', label: 'PNG' },
];

const ICONS: Record<string, string> = {
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  clear: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash:
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
};

@Component({
  selector: 'app-urbanisation',
  standalone: true,
  imports: [CommonModule, DownloadMenuComponent],
  template: `
    <p class="muted step-question">
      Comment le système d'information est-il découpé en zones, quartiers et îlots, et quelles
      applications occupent chaque îlot du plan d'occupation des sols ?
    </p>

    <div class="tabs">
      <button class="tab" [class.active]="tab === 'zones'" (click)="selectTab('zones')">Zones</button>
      <button class="tab" [class.active]="tab === 'affectations'" (click)="selectTab('affectations')">Affectations</button>
      <button class="tab" [class.active]="tab === 'pos'" (click)="selectTab('pos')">Plan d'occupation des sols</button>
    </div>

    <!-- ── Onglet : hiérarchie des zones ─────────────────────────────────── -->
    <ng-container *ngIf="tab === 'zones'">
      <div class="page-header">
        <h3>Zones ({{ flatZones.length }})</h3>
        <button type="button" class="btn btn-primary" (click)="openCreateZone()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
          Ajouter une zone
        </button>
      </div>

      <section class="card">
        <div class="empty-state" *ngIf="flatZones.length === 0">Aucune zone définie.</div>
        <div class="table-scroll" *ngIf="flatZones.length > 0">
          <table class="table">
            <thead><tr><th>Nom</th><th>Type</th><th>Zone parente</th><th>Applications</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let zone of flatZones">
                <td><strong>{{ zone.nom }}</strong></td>
                <td><span class="badge badge-neutral">{{ zoneTypeLabel(zone.type) }}</span></td>
                <td>{{ zoneName(zone.parentId) }}</td>
                <td>{{ zone._count?.applications || 0 }}</td>
                <td class="row-actions">
                  <button type="button" class="icon-btn icon-btn-edit" title="Modifier" (click)="openEditZone(zone)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('edit')"></svg>
                  </button>
                  <button type="button" class="icon-btn icon-btn-danger" title="Supprimer" (click)="removeZone(zone)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('trash')"></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </ng-container>

    <!-- ── Onglet : affectation des applications aux îlots ───────────────── -->
    <ng-container *ngIf="tab === 'affectations'">
      <form class="card form-card" (submit)="affecter($event)">
        <h3>Affecter une application à un îlot</h3>
        <div class="grid-2">
          <label class="field">
            Application
            <select [value]="affectation.applicationId" (change)="affectation.applicationId = $any($event.target).value">
              <option value="" disabled>Choisir une application</option>
              <option *ngFor="let app of applications" [value]="app.id">{{ app.nom }}</option>
            </select>
          </label>
          <label class="field">
            Îlot
            <select [value]="affectation.zoneId" (change)="affectation.zoneId = $any($event.target).value">
              <option value="" disabled>Choisir un îlot</option>
              <option *ngFor="let ilot of ilots" [value]="ilot.id">{{ ilot.nom }}</option>
            </select>
          </label>
        </div>
        <button type="submit" class="btn btn-primary" [disabled]="affecting">Affecter</button>
      </form>
    </ng-container>

    <!-- ── Onglet : plan d'occupation des sols (diagramme généré) ────────── -->
    <ng-container *ngIf="tab === 'pos'">
      <section class="card">
        <div class="page-header">
          <p class="summary">{{ posSummary }}</p>
          <div class="actions">
            <button type="button" class="icon-btn" title="Rafraîchir le plan" [disabled]="posLoading" (click)="generatePos()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('refresh')"></svg>
            </button>
            <button type="button" class="icon-btn icon-btn-danger" title="Vider le plan" [disabled]="posLoading || !posSvg" (click)="clearPos()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('clear')"></svg>
            </button>
            <app-download-menu [formats]="svgPngFormats" [disabled]="!posSvg" (download)="exportPos($event)" />
          </div>
        </div>
        <div class="empty-state" *ngIf="posLoading && !posSvg">Génération du plan d'occupation des sols…</div>
        <div class="svg-container" *ngIf="posTrustedSvg" [innerHTML]="posTrustedSvg"></div>
      </section>
    </ng-container>

    <!-- ── Popover : ajouter une zone ────────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="createZonePopover" (click)="closeCreateZone()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="createZone($event)">
        <div class="popover-head">
          <h3>Ajouter une zone</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeCreateZone()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <div class="grid-2">
          <label class="field">Nom<input type="text" [value]="newZone.nom" (input)="newZone.nom = $any($event.target).value" required /></label>
          <label class="field">
            Type
            <select [value]="newZone.type" (change)="onTypeChange($any($event.target).value)">
              <option value="ZONE">Zone</option>
              <option value="QUARTIER">Quartier</option>
              <option value="ILOT">Îlot</option>
            </select>
          </label>
        </div>
        <label class="field" *ngIf="newZone.type !== 'ZONE'">
          Parent ({{ newZone.type === 'QUARTIER' ? 'une Zone' : 'un Quartier' }})
          <select [value]="newZone.parentId || ''" (change)="newZone.parentId = $any($event.target).value || undefined">
            <option value="" disabled>Choisir un parent</option>
            <option *ngFor="let p of validParents" [value]="p.id">{{ p.nom }}</option>
          </select>
        </label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCreateZone()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creatingZone">{{ creatingZone ? 'Création…' : 'Créer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Popover : modifier une zone ───────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="editZoneTarget && editZoneDraft as draft" (click)="closeEditZone()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="saveZone($event)">
        <div class="popover-head">
          <h3>Modifier « {{ editZoneTarget.nom }} »</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeEditZone()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <label class="field">
          Nom
          <input type="text" [value]="draft.nom" (input)="draft.nom = $any($event.target).value" required />
        </label>
        <label class="field">
          Zone parente (optionnelle)
          <select [value]="draft.parentId || ''" (change)="draft.parentId = $any($event.target).value || null">
            <option value="">— Racine —</option>
            <option *ngFor="let parent of editZoneParentOptions" [value]="parent.id">{{ parent.nom }}</option>
          </select>
        </label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeEditZone()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="savingZone">{{ savingZone ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
      .form-card { margin-bottom: 1.5rem; }
      .table-scroll { overflow-x: auto; }
      .table { width: 100%; min-width: 620px; border-collapse: collapse; }
      .table th, .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); white-space: nowrap; }
      .row-actions { display: flex; gap: 0.4rem; }
      .summary { color: var(--color-text-muted); }
      .actions { display: flex; gap: 0.5rem; }
      .svg-container { overflow: auto; border: 1px solid var(--color-border); border-radius: 12px; padding: 1rem; }
      .svg-container ::ng-deep svg { max-width: 100%; height: auto; }
    `,
  ],
})
export class UrbanisationComponent implements OnInit {
  tab: Tab = 'zones';
  svgPngFormats = SVG_PNG_FORMATS;

  zones: ZoneUrbanisation[] = [];
  flatZones: ZoneUrbanisation[] = [];
  applications: Application[] = [];

  newZone: { nom: string; type: TypeZone; parentId?: string } = { nom: '', type: 'ZONE' };
  creatingZone = false;
  createZonePopover = false;
  editZoneTarget: ZoneUrbanisation | null = null;
  editZoneDraft: { nom: string; parentId: string | null } | null = null;
  savingZone = false;

  affectation: { applicationId: string; zoneId: string } = { applicationId: '', zoneId: '' };
  affecting = false;

  posSvg = '';
  posTrustedSvg: SafeHtml | null = null;
  posLoading = false;
  posLoaded = false;
  posSummary = '';

  constructor(
    private urbanisationService: UrbanisationService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private sanitizer: DomSanitizer,
  ) {}

  icon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] ?? '');
  }

  selectTab(tab: Tab): void {
    this.tab = tab;
    if (tab === 'pos' && !this.posLoaded && !this.posLoading) this.generatePos();
  }

  openCreateZone(): void {
    this.newZone = { nom: '', type: 'ZONE' };
    this.createZonePopover = true;
  }

  closeCreateZone(): void {
    this.createZonePopover = false;
  }

  openEditZone(zone: ZoneUrbanisation): void {
    this.editZoneTarget = zone;
    this.editZoneDraft = { nom: zone.nom, parentId: zone.parentId ?? null };
  }

  closeEditZone(): void {
    this.editZoneTarget = null;
    this.editZoneDraft = null;
  }

  ngOnInit(): void {
    this.loadZones();
    this.urbanisationService.listApplications().subscribe({
      next: (apps) => (this.applications = apps),
      error: () => this.toast.error('Impossible de charger les applications.'),
    });
  }

  get validParents(): ZoneUrbanisation[] {
    if (this.newZone.type === 'QUARTIER') return this.flatZones.filter((z) => z.type === 'ZONE');
    if (this.newZone.type === 'ILOT') return this.flatZones.filter((z) => z.type === 'QUARTIER');
    return [];
  }

  get editZoneParentOptions(): ZoneUrbanisation[] {
    if (!this.editZoneTarget) return [];
    const parentType: TypeZone | null =
      this.editZoneTarget.type === 'QUARTIER' ? 'ZONE' : this.editZoneTarget.type === 'ILOT' ? 'QUARTIER' : null;
    return this.flatZones.filter(
      (zone) => zone.id !== this.editZoneTarget!.id && (!parentType || zone.type === parentType),
    );
  }

  get ilots(): ZoneUrbanisation[] {
    return this.flatZones.filter((z) => z.type === 'ILOT');
  }

  zoneName(zoneId?: string | null): string {
    if (!zoneId) return '—';
    return this.flatZones.find((zone) => zone.id === zoneId)?.nom ?? '—';
  }

  zoneTypeLabel(type: TypeZone): string {
    return type === 'ZONE' ? 'Zone' : type === 'QUARTIER' ? 'Quartier' : 'Îlot';
  }

  onTypeChange(type: TypeZone): void {
    this.newZone.type = type;
    this.newZone.parentId = undefined;
  }

  loadZones(): void {
    this.urbanisationService.listZones().subscribe({
      next: (zones) => {
        // L'API renvoie chaque zone comme entrée de premier niveau (avec son propre
        // _count.applications exact), en plus de l'imbriquer dans les `enfants` de son
        // parent (où `_count` est absent). On reconstruit donc l'arbre nous-mêmes à
        // partir de la liste à plat dédupliquée par id, pour avoir des compteurs
        // corrects à tous les niveaux et éviter les doublons.
        this.flatZones = this.dedupeById(zones).map((z) => ({ ...z, enfants: [] as ZoneUrbanisation[] }));
        const byId = new Map(this.flatZones.map((z) => [z.id, z]));
        this.zones = [];
        for (const zone of this.flatZones) {
          const parent = zone.parentId ? byId.get(zone.parentId) : undefined;
          if (parent) parent.enfants!.push(zone);
          else this.zones.push(zone);
        }
      },
      error: () => this.toast.error('Impossible de charger les zones.'),
    });
  }

  private dedupeById(nodes: ZoneUrbanisation[]): ZoneUrbanisation[] {
    const seen = new Set<string>();
    return nodes.filter((node) => (seen.has(node.id) ? false : (seen.add(node.id), true)));
  }

  createZone(event: Event): void {
    event.preventDefault();
    if (this.newZone.type !== 'ZONE' && !this.newZone.parentId) {
      this.toast.error('Choisissez un parent cohérent avec la hiérarchie Zone > Quartier > Îlot.');
      return;
    }
    this.creatingZone = true;
    this.urbanisationService.createZone(this.newZone).subscribe({
      next: () => {
        this.creatingZone = false;
        this.closeCreateZone();
        this.loadZones();
        this.invalidatePos();
        this.toast.success('Zone créée.');
      },
      error: () => {
        this.creatingZone = false;
        this.toast.error('Impossible de créer cette zone.');
      },
    });
  }

  async removeZone(zone: ZoneUrbanisation): Promise<void> {
    const hasChildren = (zone.enfants?.length ?? 0) > 0;
    const warning = hasChildren ? ' Ses quartiers/îlots seront également supprimés.' : '';
    const confirmed = await this.confirmDialog.confirm(`Supprimer la zone « ${zone.nom} » ?${warning}`);
    if (!confirmed) return;
    this.urbanisationService.deleteZone(zone.id).subscribe({
      next: () => {
        this.loadZones();
        this.invalidatePos();
        this.toast.success('Zone supprimée.');
      },
      error: () => this.toast.error('Impossible de supprimer cette zone.'),
    });
  }

  saveZone(event: Event): void {
    event.preventDefault();
    if (!this.editZoneTarget || !this.editZoneDraft || !this.editZoneDraft.nom.trim()) return;
    this.savingZone = true;
    this.urbanisationService.updateZone(this.editZoneTarget.id, this.editZoneDraft).subscribe({
      next: () => {
        this.savingZone = false;
        this.closeEditZone();
        this.loadZones();
        this.invalidatePos();
        this.toast.success('Zone modifiée.');
      },
      error: () => {
        this.savingZone = false;
        this.toast.error('Impossible de modifier cette zone.');
      },
    });
  }

  affecter(event: Event): void {
    event.preventDefault();
    if (!this.affectation.applicationId || !this.affectation.zoneId) return;
    this.affecting = true;
    this.urbanisationService.affecter(this.affectation.applicationId, this.affectation.zoneId).subscribe({
      next: () => {
        this.affecting = false;
        this.affectation = { applicationId: '', zoneId: '' };
        this.loadZones();
        this.invalidatePos();
        this.toast.success('Application affectée.');
      },
      error: (err) => {
        this.affecting = false;
        if (err?.status === 409) this.toast.error('Cette application est déjà affectée à cet îlot.');
        else if (err?.status === 400) this.toast.error("La cible choisie n'est pas un îlot.");
        else this.toast.error("Impossible d'affecter cette application.");
      },
    });
  }

  // ── Plan d'occupation des sols ────────────────────────────────────────────

  /** Marque le plan comme périmé : il sera régénéré au prochain passage sur l'onglet. */
  private invalidatePos(): void {
    this.posLoaded = false;
    if (this.tab === 'pos') this.generatePos();
  }

  generatePos(): void {
    this.posLoading = true;
    this.urbanisationService.generateView().subscribe({
      next: (view: UrbanisationView) => {
        this.posSvg = view.svg;
        this.posTrustedSvg = this.sanitizer.bypassSecurityTrustHtml(view.svg);
        this.posSummary = `${view.zoneCount} zone(s) · ${view.applicationCount} affectation(s)`;
        this.posLoading = false;
        this.posLoaded = true;
      },
      error: () => {
        this.posLoading = false;
        this.toast.error("Impossible de générer le plan d'occupation des sols.");
      },
    });
  }

  exportPos(format: string): void {
    if (!this.posSvg) return;
    const filename = `plan-occupation-des-sols.${format}`;
    if (format === 'svg') downloadSvg(this.posSvg, filename);
    else downloadPng(this.posSvg, filename);
  }

  clearPos(): void {
    this.posSvg = '';
    this.posTrustedSvg = null;
    this.posSummary = '';
  }
}
