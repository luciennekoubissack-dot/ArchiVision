import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService, RoleUtilisateur } from './auth.service';
import { OrganisationService, Organisation } from './organisation.service';
import { MembresService, Membre, CreateMembrePayload } from './membres.service';
import { ServiceEntrepriseService, ServiceEntreprise } from './service-entreprise.service';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';
import { downloadJson, downloadPng, downloadSvg } from './download.util';

type Tab = 'infos' | 'membres' | 'services' | 'organigramme';

const ROLES: RoleUtilisateur[] = ['ARCHITECTE', 'DIRIGEANT', 'REPRESENTANT', 'COLLABORATEUR'];

@Component({
  selector: 'app-organisation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h2>Organisation</h2>
      <button class="btn btn-outline" (click)="exportReferentiel()">Exporter le référentiel (JSON)</button>
    </div>

    <div class="tabs">
      <button class="tab" [class.active]="tab === 'infos'" (click)="tab = 'infos'">Infos</button>
      <button class="tab" [class.active]="tab === 'membres'" (click)="tab = 'membres'" *ngIf="canManageMembres">
        Membres
      </button>
      <button class="tab" [class.active]="tab === 'services'" (click)="tab = 'services'">Services</button>
      <button class="tab" [class.active]="tab === 'organigramme'" (click)="openOrganigramme()">Organigramme</button>
    </div>

    <!-- ── Infos ─────────────────────────────────────────────────────────── -->
    <section class="card" *ngIf="tab === 'infos' && organisation">
      <label class="field">
        Nom
        <input type="text" [value]="organisation.nom" (input)="organisation.nom = $any($event.target).value" [disabled]="!canEditInfos" />
      </label>
      <label class="field">
        Description
        <textarea [value]="organisation.description || ''" (input)="organisation.description = $any($event.target).value" [disabled]="!canEditInfos"></textarea>
      </label>
      <div class="grid-2">
        <label class="field">
          Secteur
          <input type="text" [value]="organisation.secteur || ''" (input)="organisation.secteur = $any($event.target).value" [disabled]="!canEditInfos" />
        </label>
        <label class="field">
          Taille
          <input type="text" [value]="organisation.taille || ''" (input)="organisation.taille = $any($event.target).value" [disabled]="!canEditInfos" />
        </label>
      </div>
      <div class="grid-2">
        <label class="field">
          Pays
          <input type="text" [value]="organisation.pays || ''" (input)="organisation.pays = $any($event.target).value" [disabled]="!canEditInfos" />
        </label>
        <label class="field">
          Logo (URL)
          <input type="url" [value]="organisation.logoUrl || ''" (input)="organisation.logoUrl = $any($event.target).value" [disabled]="!canEditInfos" />
        </label>
      </div>

      <button class="btn btn-primary" *ngIf="canEditInfos" (click)="saveInfos()" [disabled]="savingInfos">
        {{ savingInfos ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
      <p class="hint" *ngIf="!canEditInfos">
        Seuls les rôles Architecte et Dirigeant peuvent modifier ces informations.
      </p>
    </section>

    <!-- ── Membres ───────────────────────────────────────────────────────── -->
    <section *ngIf="tab === 'membres' && canManageMembres">
      <form class="card form-card" (submit)="createMembre($event)">
        <h3>Nouveau membre</h3>
        <div class="grid-2">
          <label class="field">
            Nom
            <input type="text" [value]="newMembre.nom" (input)="newMembre.nom = $any($event.target).value" required />
          </label>
          <label class="field">
            Email
            <input type="email" [value]="newMembre.email" (input)="newMembre.email = $any($event.target).value" required />
          </label>
        </div>
        <div class="grid-2">
          <label class="field">
            Mot de passe temporaire
            <input type="password" [value]="newMembre.password" (input)="newMembre.password = $any($event.target).value" required minlength="8" />
          </label>
          <label class="field">
            Rôle
            <select [value]="newMembre.role" (change)="newMembre.role = $any($event.target).value">
              <option *ngFor="let role of roles" [value]="role">{{ roleLabel(role) }}</option>
            </select>
          </label>
        </div>
        <label class="field">
          Service (optionnel)
          <select [value]="newMembre.serviceId || ''" (change)="newMembre.serviceId = $any($event.target).value || undefined">
            <option value="">— Aucun —</option>
            <option *ngFor="let s of flatServices" [value]="s.id">{{ s.indent }}{{ s.nom }}</option>
          </select>
        </label>
        <button type="submit" class="btn btn-primary" [disabled]="creatingMembre">Créer le membre</button>
      </form>

      <section class="card">
        <h3>Membres ({{ membres.length }})</h3>
        <div class="empty-state" *ngIf="membres.length === 0">Aucun membre pour l'instant.</div>
        <table class="table" *ngIf="membres.length > 0">
          <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Service</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let membre of membres">
              <td>{{ membre.nom }}</td>
              <td>{{ membre.email }}</td>
              <td>
                <select [value]="membre.role" (change)="changeRole(membre, $any($event.target).value)">
                  <option *ngFor="let role of roles" [value]="role">{{ roleLabel(role) }}</option>
                </select>
              </td>
              <td>
                <select [value]="membre.serviceId || ''" (change)="changeService(membre, $any($event.target).value)">
                  <option value="">— Aucun —</option>
                  <option *ngFor="let s of flatServices" [value]="s.id">{{ s.indent }}{{ s.nom }}</option>
                </select>
              </td>
              <td><button class="btn btn-danger" (click)="removeMembre(membre)">Supprimer</button></td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>

    <!-- ── Services ──────────────────────────────────────────────────────── -->
    <section *ngIf="tab === 'services'">
      <form class="card form-card" (submit)="createService($event)">
        <h3>Nouveau service</h3>
        <div class="grid-2">
          <label class="field">
            Nom
            <input type="text" [value]="newService.nom" (input)="newService.nom = $any($event.target).value" required />
          </label>
          <label class="field">
            Service parent (optionnel)
            <select [value]="newService.parentId || ''" (change)="newService.parentId = $any($event.target).value || undefined">
              <option value="">— Racine —</option>
              <option *ngFor="let s of flatServices" [value]="s.id">{{ s.indent }}{{ s.nom }}</option>
            </select>
          </label>
        </div>
        <label class="field">
          Description
          <textarea [value]="newService.description || ''" (input)="newService.description = $any($event.target).value"></textarea>
        </label>
        <button type="submit" class="btn btn-primary" [disabled]="creatingService">Créer le service</button>
      </form>

      <section class="card">
        <h3>Hiérarchie des services</h3>
        <div class="empty-state" *ngIf="services.length === 0">Aucun service défini pour cette organisation.</div>
        <ul class="tree" *ngIf="services.length > 0">
          <ng-container *ngFor="let root of services">
            <ng-container *ngTemplateOutlet="serviceNode; context: { $implicit: root }"></ng-container>
          </ng-container>
        </ul>
        <ng-template #serviceNode let-node>
          <li>
            <div class="node-row">
              <span class="node-nom">{{ node.nom }}</span>
              <span class="badge badge-neutral">{{ node._count?.membres || 0 }} membre(s)</span>
              <button class="btn btn-ghost" (click)="removeService(node)">Supprimer</button>
            </div>
            <ul *ngIf="node.enfants?.length">
              <ng-container *ngFor="let child of node.enfants">
                <ng-container *ngTemplateOutlet="serviceNode; context: { $implicit: child }"></ng-container>
              </ng-container>
            </ul>
          </li>
        </ng-template>
      </section>
    </section>

    <!-- ── Organigramme ──────────────────────────────────────────────────── -->
    <section class="card" *ngIf="tab === 'organigramme'">
      <div class="page-header">
        <h3>Organigramme</h3>
        <div class="actions" *ngIf="organigrammeSvg">
          <button class="btn btn-outline" (click)="exportOrganigramme('svg')">Exporter SVG</button>
          <button class="btn btn-outline" (click)="exportOrganigramme('png')">Exporter PNG</button>
        </div>
      </div>
      <div class="svg-container" *ngIf="organigrammeTrustedSvg" [innerHTML]="organigrammeTrustedSvg"></div>
    </section>
  `,
  styles: [
    `
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
      .form-card { margin-bottom: 1.5rem; }
      .hint { color: var(--color-text-muted); font-size: 0.9rem; margin-top: 0.75rem; }
      .table { width: 100%; border-collapse: collapse; }
      .table th, .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); }
      .tree { list-style: none; padding-left: 0; }
      .tree ul { list-style: none; padding-left: 1.5rem; margin-top: 0.5rem; }
      .tree li { margin-bottom: 0.6rem; }
      .node-row { display: flex; align-items: center; gap: 0.6rem; }
      .node-nom { font-weight: 700; }
      .actions { display: flex; gap: 0.5rem; }
      .svg-container { overflow: auto; border: 1px solid var(--color-border); border-radius: 12px; padding: 1rem; }
    `,
  ],
})
export class OrganisationComponent implements OnInit {
  tab: Tab = 'infos';
  roles = ROLES;

  organisation: Organisation | null = null;
  savingInfos = false;

  membres: Membre[] = [];
  creatingMembre = false;
  newMembre: CreateMembrePayload = { nom: '', email: '', password: '', role: 'COLLABORATEUR' };

  services: ServiceEntreprise[] = [];
  flatServices: { id: string; nom: string; indent: string }[] = [];
  creatingService = false;
  newService: { nom: string; description?: string; parentId?: string } = { nom: '' };

  organigrammeSvg = '';
  organigrammeTrustedSvg: SafeHtml | null = null;

  constructor(
    public auth: AuthService,
    private organisationService: OrganisationService,
    private membresService: MembresService,
    private serviceEntrepriseService: ServiceEntrepriseService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private sanitizer: DomSanitizer,
  ) {}

  get canEditInfos(): boolean {
    return this.auth.hasRole('ARCHITECTE', 'DIRIGEANT');
  }

  get canManageMembres(): boolean {
    return this.auth.hasRole('ARCHITECTE');
  }

  ngOnInit(): void {
    this.loadInfos();
    this.loadServices();
    if (this.canManageMembres) this.loadMembres();
  }

  roleLabel(role: RoleUtilisateur): string {
    return { ARCHITECTE: 'Architecte', DIRIGEANT: 'Dirigeant', REPRESENTANT: 'Représentant', COLLABORATEUR: 'Collaborateur' }[role];
  }

  // ── Infos ────────────────────────────────────────────────────────────────

  loadInfos(): void {
    this.organisationService.getMine().subscribe({
      next: (org) => (this.organisation = org),
      error: () => this.toast.error("Impossible de charger l'organisation."),
    });
  }

  saveInfos(): void {
    if (!this.organisation) return;
    this.savingInfos = true;
    const { nom, description, secteur, taille, pays, logoUrl } = this.organisation;
    this.organisationService.updateMine({ nom, description: description ?? undefined, secteur: secteur ?? undefined, taille: taille ?? undefined, pays: pays ?? undefined, logoUrl: logoUrl ?? undefined }).subscribe({
      next: (org) => {
        this.organisation = org;
        this.savingInfos = false;
        this.toast.success('Organisation mise à jour.');
      },
      error: () => {
        this.savingInfos = false;
        this.toast.error('Impossible de mettre à jour l\'organisation.');
      },
    });
  }

  exportReferentiel(): void {
    this.organisationService.exportReferentiel().subscribe({
      next: (data) => {
        downloadJson(data, `archivision-referentiel-${new Date().toISOString().slice(0, 10)}.json`);
        this.toast.success('Export généré.');
      },
      error: () => this.toast.error("Impossible d'exporter le référentiel."),
    });
  }

  // ── Membres ──────────────────────────────────────────────────────────────

  loadMembres(): void {
    this.membresService.list().subscribe({
      next: (membres) => (this.membres = membres),
      error: () => this.toast.error('Impossible de charger les membres.'),
    });
  }

  createMembre(event: Event): void {
    event.preventDefault();
    this.creatingMembre = true;
    this.membresService.create(this.newMembre).subscribe({
      next: (membre) => {
        this.membres = [...this.membres, membre];
        this.newMembre = { nom: '', email: '', password: '', role: 'COLLABORATEUR' };
        this.creatingMembre = false;
        this.toast.success('Membre créé.');
      },
      error: (err) => {
        this.creatingMembre = false;
        this.toast.error(err?.status === 409 ? 'Un compte existe déjà avec cet email.' : 'Impossible de créer ce membre.');
      },
    });
  }

  changeRole(membre: Membre, role: RoleUtilisateur): void {
    this.membresService.update(membre.id, { role }).subscribe({
      next: (updated) => (membre.role = updated.role),
      error: () => this.toast.error('Impossible de modifier le rôle.'),
    });
  }

  changeService(membre: Membre, serviceId: string): void {
    this.membresService.update(membre.id, { serviceId: serviceId || null }).subscribe({
      next: (updated) => (membre.serviceId = updated.serviceId),
      error: () => this.toast.error('Impossible de modifier le service.'),
    });
  }

  async removeMembre(membre: Membre): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Supprimer le membre « ${membre.nom} » ?`);
    if (!confirmed) return;
    this.membresService.delete(membre.id).subscribe({
      next: () => {
        this.membres = this.membres.filter((m) => m.id !== membre.id);
        this.toast.success('Membre supprimé.');
      },
      error: (err) =>
        this.toast.error(
          err?.status === 409 ? "Impossible de supprimer le dernier Architecte de l'organisation." : 'Impossible de supprimer ce membre.',
        ),
    });
  }

  // ── Services ─────────────────────────────────────────────────────────────

  loadServices(): void {
    this.serviceEntrepriseService.list().subscribe({
      next: (services) => {
        // L'API renvoie chaque service comme entrée de premier niveau (avec son propre
        // _count.membres exact), en plus de l'imbriquer dans les `enfants` de son parent
        // (où `_count` est absent). On reconstruit donc l'arbre nous-mêmes à partir de la
        // liste à plat dédupliquée par id, pour des compteurs corrects et sans doublons.
        const deduped = this.dedupeById(services).map((s) => ({ ...s, enfants: [] as ServiceEntreprise[] }));
        const byId = new Map(deduped.map((s) => [s.id, s]));
        this.services = [];
        for (const service of deduped) {
          const parent = service.parentId ? byId.get(service.parentId) : undefined;
          if (parent) parent.enfants!.push(service);
          else this.services.push(service);
        }
        this.flatServices = this.flatten(this.services);
      },
      error: () => this.toast.error('Impossible de charger les services.'),
    });
  }

  private dedupeById(nodes: ServiceEntreprise[]): ServiceEntreprise[] {
    const seen = new Set<string>();
    return nodes.filter((node) => (seen.has(node.id) ? false : (seen.add(node.id), true)));
  }

  private flatten(nodes: ServiceEntreprise[], depth = 0): { id: string; nom: string; indent: string }[] {
    return nodes.flatMap((node) => [
      { id: node.id, nom: node.nom, indent: '— '.repeat(depth) },
      ...this.flatten(node.enfants ?? [], depth + 1),
    ]);
  }

  createService(event: Event): void {
    event.preventDefault();
    this.creatingService = true;
    this.serviceEntrepriseService.create(this.newService).subscribe({
      next: () => {
        this.newService = { nom: '' };
        this.creatingService = false;
        this.loadServices();
        this.toast.success('Service créé.');
      },
      error: () => {
        this.creatingService = false;
        this.toast.error('Impossible de créer ce service.');
      },
    });
  }

  async removeService(service: ServiceEntreprise): Promise<void> {
    const hasChildren = (service.enfants?.length ?? 0) > 0;
    const hasMembres = (service._count?.membres ?? 0) > 0;
    const warning =
      hasChildren || hasMembres
        ? ` Ce service contient ${hasMembres ? `${service._count!.membres} membre(s)` : ''}${hasChildren && hasMembres ? ' et ' : ''}${hasChildren ? 'des sous-services' : ''} qui seront également supprimés.`
        : '';
    const confirmed = await this.confirmDialog.confirm(`Supprimer le service « ${service.nom} » ?${warning}`);
    if (!confirmed) return;
    this.serviceEntrepriseService.delete(service.id).subscribe({
      next: () => {
        this.loadServices();
        this.toast.success('Service supprimé.');
      },
      error: () => this.toast.error('Impossible de supprimer ce service.'),
    });
  }

  // ── Organigramme ─────────────────────────────────────────────────────────

  openOrganigramme(): void {
    this.tab = 'organigramme';
    this.serviceEntrepriseService.generateView().subscribe({
      next: (view) => {
        this.organigrammeSvg = view.svg;
        this.organigrammeTrustedSvg = this.sanitizer.bypassSecurityTrustHtml(view.svg);
      },
      error: () => this.toast.error("Impossible de générer l'organigramme."),
    });
  }

  exportOrganigramme(format: 'svg' | 'png'): void {
    if (!this.organigrammeSvg) return;
    const filename = `organigramme.${format}`;
    if (format === 'svg') downloadSvg(this.organigrammeSvg, filename);
    else downloadPng(this.organigrammeSvg, filename);
  }
}
