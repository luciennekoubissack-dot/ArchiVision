import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Application, TypeZone, UrbanisationService, ZoneUrbanisation } from './urbanisation.service';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-urbanisation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header"><h2>Urbanisation</h2></div>

    <form class="card form-card" (submit)="createZone($event)">
      <h3>Nouvelle zone</h3>
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
      <button type="submit" class="btn btn-primary" [disabled]="creatingZone">Créer</button>
    </form>

    <section class="card">
      <h3>Hiérarchie Zone &gt; Quartier &gt; Îlot</h3>
      <div class="empty-state" *ngIf="zones.length === 0">Aucune zone définie.</div>
      <ul class="tree" *ngIf="zones.length > 0">
        <ng-container *ngFor="let root of zones">
          <ng-container *ngTemplateOutlet="zoneNode; context: { $implicit: root }"></ng-container>
        </ng-container>
      </ul>
      <ng-template #zoneNode let-node>
        <li>
          <div class="node-row">
            <span class="node-nom">{{ node.nom }}</span>
            <span class="badge badge-neutral">{{ node.type }}</span>
            <span class="badge badge-neutral" *ngIf="node.type === 'ILOT'">{{ node._count?.applications || 0 }} application(s)</span>
            <button class="btn btn-ghost" (click)="removeZone(node)">Supprimer</button>
          </div>
          <ul *ngIf="node.enfants?.length">
            <ng-container *ngFor="let child of node.enfants">
              <ng-container *ngTemplateOutlet="zoneNode; context: { $implicit: child }"></ng-container>
            </ng-container>
          </ul>
        </li>
      </ng-template>
    </section>

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
  `,
  styles: [
    `
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
      .form-card { margin-bottom: 1.5rem; }
      .tree { list-style: none; padding-left: 0; }
      .tree ul { list-style: none; padding-left: 1.5rem; margin-top: 0.5rem; }
      .tree li { margin-bottom: 0.6rem; }
      .node-row { display: flex; align-items: center; gap: 0.6rem; }
      .node-nom { font-weight: 700; }
    `,
  ],
})
export class UrbanisationComponent implements OnInit {
  zones: ZoneUrbanisation[] = [];
  flatZones: ZoneUrbanisation[] = [];
  applications: Application[] = [];

  newZone: { nom: string; type: TypeZone; parentId?: string } = { nom: '', type: 'ZONE' };
  creatingZone = false;

  affectation: { applicationId: string; zoneId: string } = { applicationId: '', zoneId: '' };
  affecting = false;

  constructor(
    private urbanisationService: UrbanisationService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
  ) {}

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

  get ilots(): ZoneUrbanisation[] {
    return this.flatZones.filter((z) => z.type === 'ILOT');
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
        this.newZone = { nom: '', type: 'ZONE' };
        this.creatingZone = false;
        this.loadZones();
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
        this.toast.success('Zone supprimée.');
      },
      error: () => this.toast.error('Impossible de supprimer cette zone.'),
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
}
