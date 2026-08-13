import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService, RoleUtilisateur } from './auth.service';
import { OrganisationService, Organisation } from './organisation.service';
import { MembresService, Membre, CreateMembrePayload } from './membres.service';
import { ServiceEntrepriseService, ServiceEntreprise } from './service-entreprise.service';
import { PartiesPrenantesService, PartiePrenante } from './parties-prenantes.service';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';
import { downloadPng, downloadSvg } from './download.util';
import { ObjectifsComponent } from './objectifs.component';

type Tab = 'infos' | 'strategie' | 'membres' | 'services' | 'organigramme';
type IdentiteMode = 'view' | 'edit' | null;
type PartiesMode = 'view' | 'edit' | null;
type MembrePopover = 'create' | 'view' | 'edit' | null;

interface MembreDraft {
  role: RoleUtilisateur;
  serviceId: string | null;
  poste: string;
  contact: string;
}

// SUPERADMIN volontairement exclu : un rôle plateforme ne peut pas être
// attribué à un membre d'une organisation.
const ROLES: Exclude<RoleUtilisateur, 'SUPERADMIN'>[] = ['ADMINISTRATEUR', 'ARCHITECTE'];

const ICONS: Record<string, string> = {
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash:
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  userPlus:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  camera: '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="14" r="3.5"/>',
  users:
    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
};

@Component({
  selector: 'app-organisation',
  standalone: true,
  imports: [CommonModule, ObjectifsComponent],
  template: `
    <div class="tabs">
      <button class="tab" [class.active]="tab === 'infos'" (click)="tab = 'infos'">Identité</button>
      <button class="tab" [class.active]="tab === 'strategie'" (click)="tab = 'strategie'">Objectifs</button>
      <button class="tab" [class.active]="tab === 'membres'" (click)="tab = 'membres'" *ngIf="canManageMembres">
        Membres
      </button>
      <button class="tab" [class.active]="tab === 'services'" (click)="tab = 'services'">Services</button>
      <button class="tab" [class.active]="tab === 'organigramme'" (click)="openOrganigramme()">Organigramme</button>
    </div>

    <!-- ── Objectifs ─────────────────────────────────────────────────────── -->
    <app-objectifs *ngIf="tab === 'strategie'" />

    <!-- ── Identité / Parties prenantes ──────────────────────────────────── -->
    <div class="identity-grid" *ngIf="tab === 'infos' && organisation">
      <section class="card identity-card">
        <div class="identity-summary">
          <span class="identity-logo">
            <img *ngIf="organisation.logoUrl" [src]="organisation.logoUrl" [alt]="organisation.nom" />
            <ng-container *ngIf="!organisation.logoUrl">{{ initials(organisation.nom) }}</ng-container>
          </span>
          <div class="identity-text">
            <strong>{{ organisation.nom }}</strong>
            <span class="muted">
              {{ organisation.secteur || 'Secteur non renseigné' }}<ng-container *ngIf="organisation.pays"> · {{ organisation.pays }}</ng-container>
            </span>
          </div>
          <div class="identity-actions">
            <button type="button" class="icon-btn icon-btn-view" title="Consulter" (click)="openIdentiteView()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('eye')"></svg>
            </button>
            <button type="button" class="icon-btn icon-btn-edit" title="Modifier" *ngIf="canEditInfos" (click)="openIdentiteEdit()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('edit')"></svg>
            </button>
          </div>
        </div>
      </section>

      <section class="card identity-card">
        <div class="identity-summary">
          <span class="identity-logo pp-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('users')"></svg>
          </span>
          <div class="identity-text">
            <strong>Parties prenantes</strong>
            <span class="muted">{{ partiesPrenantes.length }} renseignée(s)</span>
          </div>
          <div class="identity-actions">
            <button type="button" class="icon-btn icon-btn-view" title="Consulter" (click)="partiesMode = 'view'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('eye')"></svg>
            </button>
            <button type="button" class="icon-btn icon-btn-edit" title="Gérer" *ngIf="canEditInfos" (click)="partiesMode = 'edit'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('edit')"></svg>
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- ── Popover : fiche d'identité (consultation) ────────────────────── -->
    <div class="popover-backdrop" *ngIf="identiteMode === 'view' && organisation as org" (click)="closeIdentite()">
      <div class="popover-card" (click)="$event.stopPropagation()">
        <div class="popover-head">
          <h3>Fiche d'identité</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeIdentite()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <div class="fiche-logo" *ngIf="org.logoUrl"><img [src]="org.logoUrl" alt="" /></div>
        <dl class="fiche-list">
          <dt>Nom</dt><dd>{{ org.nom }}</dd>
          <dt>Description</dt><dd>{{ org.description || '—' }}</dd>
          <dt>Secteur</dt><dd>{{ org.secteur || '—' }}</dd>
          <dt>Taille</dt><dd>{{ org.taille || '—' }}</dd>
          <dt>Pays</dt><dd>{{ org.pays || '—' }}</dd>
          <dt>Vision</dt><dd>{{ org.vision || '—' }}</dd>
          <dt>Problèmes à résoudre</dt><dd>{{ org.problemesResoudre || '—' }}</dd>
        </dl>
      </div>
    </div>

    <!-- ── Popover : modification de l'identité ─────────────────────────── -->
    <div class="popover-backdrop" *ngIf="identiteMode === 'edit' && editDraft as draft" (click)="closeIdentite()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="saveInfos($event)">
        <div class="popover-head">
          <h3>Modifier l'identité</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeIdentite()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>

        <div class="photo-upload">
          <button type="button" class="photo-circle" (click)="fileInput.click()" [class.has-photo]="logoPreview || draft.logoUrl">
            <img *ngIf="logoPreview || draft.logoUrl" [src]="logoPreview || draft.logoUrl" alt="Logo" />
            <svg *ngIf="!logoPreview && !draft.logoUrl" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('camera')"></svg>
          </button>
          <span class="photo-label">{{ uploadingLogo ? 'Envoi…' : 'Changer le logo' }}</span>
          <input #fileInput type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden (change)="onLogoSelected($event)" />
        </div>

        <label class="field">
          Nom
          <input type="text" [value]="draft.nom" (input)="draft.nom = $any($event.target).value" required />
        </label>
        <label class="field">
          Description
          <textarea [value]="draft.description || ''" (input)="draft.description = $any($event.target).value"></textarea>
        </label>
        <div class="grid-2">
          <label class="field">
            Secteur
            <input type="text" [value]="draft.secteur || ''" (input)="draft.secteur = $any($event.target).value" />
          </label>
          <label class="field">
            Taille
            <input type="text" [value]="draft.taille || ''" (input)="draft.taille = $any($event.target).value" />
          </label>
        </div>
        <label class="field">
          Pays
          <input type="text" [value]="draft.pays || ''" (input)="draft.pays = $any($event.target).value" />
        </label>

        <hr />
        <h4>Vision d'architecture</h4>
        <label class="field">
          Vision
          <textarea placeholder="Quelle est la vision de l'entreprise ?" [value]="draft.vision || ''" (input)="draft.vision = $any($event.target).value"></textarea>
        </label>
        <label class="field">
          Problèmes à résoudre
          <textarea placeholder="Quels problèmes veut-on résoudre ?" [value]="draft.problemesResoudre || ''" (input)="draft.problemesResoudre = $any($event.target).value"></textarea>
        </label>

        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeIdentite()">Annuler</button>
          <button type="submit" class="btn btn-success" [disabled]="savingInfos">{{ savingInfos ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Popover : consultation des parties prenantes ─────────────────── -->
    <div class="popover-backdrop" *ngIf="partiesMode === 'view'" (click)="partiesMode = null">
      <div class="popover-card" (click)="$event.stopPropagation()">
        <div class="popover-head">
          <h3>Parties prenantes</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="partiesMode = null">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <div class="empty-state" *ngIf="partiesPrenantes.length === 0">Aucune partie prenante renseignée.</div>
        <ul class="list" *ngIf="partiesPrenantes.length > 0">
          <li class="list-item" *ngFor="let p of partiesPrenantes">
            <div><strong>{{ p.nom }}</strong><span class="badge badge-neutral" *ngIf="p.role"> {{ p.role }}</span></div>
          </li>
        </ul>
      </div>
    </div>

    <!-- ── Popover : gestion des parties prenantes ───────────────────────── -->
    <div class="popover-backdrop" *ngIf="partiesMode === 'edit'" (click)="partiesMode = null">
      <div class="popover-card" (click)="$event.stopPropagation()">
        <div class="popover-head">
          <h3>Gérer les parties prenantes</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="partiesMode = null">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <form class="inline-form" (submit)="addPartiePrenante($event)">
          <input type="text" placeholder="Nom" [value]="newPartie.nom" (input)="newPartie.nom = $any($event.target).value" required />
          <input type="text" placeholder="Rôle (ex. client, régulateur)" [value]="newPartie.role || ''" (input)="newPartie.role = $any($event.target).value" />
          <button type="submit" class="btn btn-outline">Ajouter</button>
        </form>
        <div class="empty-state" *ngIf="partiesPrenantes.length === 0">Aucune partie prenante renseignée.</div>
        <ul class="list" *ngIf="partiesPrenantes.length > 0">
          <li class="list-item" *ngFor="let p of partiesPrenantes">
            <div><strong>{{ p.nom }}</strong><span class="badge badge-neutral" *ngIf="p.role">{{ p.role }}</span></div>
            <button class="btn btn-ghost" (click)="removePartiePrenante(p)">Retirer</button>
          </li>
        </ul>
      </div>
    </div>

    <!-- ── Membres ───────────────────────────────────────────────────────── -->
    <section *ngIf="tab === 'membres' && canManageMembres">
      <div class="page-header">
        <h3>Membres ({{ membres.length }})</h3>
        <button type="button" class="btn btn-primary" (click)="openMembreCreate()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('userPlus')"></svg>
          Ajouter un membre
        </button>
      </div>

      <section class="card">
        <div class="empty-state" *ngIf="membres.length === 0">Aucun membre pour l'instant.</div>
        <div class="table-scroll" *ngIf="membres.length > 0">
          <table class="table">
            <thead><tr><th>Nom complet</th><th>Email</th><th>Service</th><th>Poste</th><th>Contact</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let membre of membres">
                <td>{{ membre.nom }}</td>
                <td>{{ membre.email }}</td>
                <td>{{ serviceName(membre.serviceId) }}</td>
                <td>{{ membre.poste || '—' }}</td>
                <td>{{ membre.contact || '—' }}</td>
                <td class="row-actions">
                  <button type="button" class="icon-btn icon-btn-view" title="Consulter" (click)="openMembreView(membre)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('eye')"></svg>
                  </button>
                  <button type="button" class="icon-btn icon-btn-edit" title="Modifier" (click)="openMembreEdit(membre)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('edit')"></svg>
                  </button>
                  <button type="button" class="icon-btn icon-btn-danger" title="Supprimer" (click)="removeMembre(membre)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('trash')"></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <!-- ── Popover : ajouter un membre ───────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="membrePopover === 'create'" (click)="closeMembrePopover()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="createMembre($event)">
        <div class="popover-head">
          <h3>Ajouter un membre</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeMembrePopover()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
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
        <div class="grid-2">
          <label class="field">
            Poste
            <input type="text" [value]="newMembre.poste || ''" (input)="newMembre.poste = $any($event.target).value" />
          </label>
          <label class="field">
            Contact
            <input type="text" [value]="newMembre.contact || ''" (input)="newMembre.contact = $any($event.target).value" />
          </label>
        </div>
        <label class="field">
          Service (optionnel)
          <select [value]="newMembre.serviceId || ''" (change)="newMembre.serviceId = $any($event.target).value || undefined">
            <option value="">— Aucun —</option>
            <option *ngFor="let s of flatServices" [value]="s.id">{{ s.indent }}{{ s.nom }}</option>
          </select>
        </label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeMembrePopover()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creatingMembre">{{ creatingMembre ? 'Création…' : 'Créer le membre' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Popover : consulter un membre ─────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="membrePopover === 'view' && membreTarget as m" (click)="closeMembrePopover()">
      <div class="popover-card" (click)="$event.stopPropagation()">
        <div class="popover-head">
          <h3>Fiche membre</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeMembrePopover()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <dl class="fiche-list">
          <dt>Nom</dt><dd>{{ m.nom }}</dd>
          <dt>Email</dt><dd>{{ m.email }}</dd>
          <dt>Rôle</dt><dd>{{ roleLabel(m.role) }}</dd>
          <dt>Service</dt><dd>{{ serviceName(m.serviceId) }}</dd>
          <dt>Poste</dt><dd>{{ m.poste || '—' }}</dd>
          <dt>Contact</dt><dd>{{ m.contact || '—' }}</dd>
        </dl>
      </div>
    </div>

    <!-- ── Popover : modifier un membre ──────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="membrePopover === 'edit' && membreDraft as draft" (click)="closeMembrePopover()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="saveMembreEdit($event)">
        <div class="popover-head">
          <h3>Modifier « {{ membreTarget?.nom }} »</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeMembrePopover()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <div class="grid-2">
          <label class="field">
            Rôle
            <select [value]="draft.role" (change)="draft.role = $any($event.target).value">
              <option *ngFor="let role of roles" [value]="role">{{ roleLabel(role) }}</option>
            </select>
          </label>
          <label class="field">
            Service
            <select [value]="draft.serviceId || ''" (change)="draft.serviceId = $any($event.target).value || null">
              <option value="">— Aucun —</option>
              <option *ngFor="let s of flatServices" [value]="s.id">{{ s.indent }}{{ s.nom }}</option>
            </select>
          </label>
        </div>
        <div class="grid-2">
          <label class="field">
            Poste
            <input type="text" [value]="draft.poste" (input)="draft.poste = $any($event.target).value" />
          </label>
          <label class="field">
            Contact
            <input type="text" [value]="draft.contact" (input)="draft.contact = $any($event.target).value" />
          </label>
        </div>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeMembrePopover()">Annuler</button>
          <button type="submit" class="btn btn-success" [disabled]="savingMembre">{{ savingMembre ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Services ──────────────────────────────────────────────────────── -->
    <section *ngIf="tab === 'services'">
      <div class="page-header">
        <h3>Services ({{ flatServices.length }})</h3>
        <button type="button" class="btn btn-primary" (click)="openServiceCreate()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
          Ajouter un service
        </button>
      </div>

      <section class="card">
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

    <!-- ── Popover : ajouter un service ──────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="servicePopover" (click)="closeServicePopover()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="createService($event)">
        <div class="popover-head">
          <h3>Ajouter un service</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeServicePopover()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
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
        <label class="field">
          Description
          <textarea [value]="newService.description || ''" (input)="newService.description = $any($event.target).value"></textarea>
        </label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeServicePopover()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creatingService">{{ creatingService ? 'Création…' : 'Créer le service' }}</button>
        </div>
      </form>
    </div>

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
      .hint { color: var(--color-text-muted); font-size: 0.9rem; margin-top: 0.75rem; }
      .table-scroll { overflow-x: auto; }
      .table { width: 100%; min-width: 640px; border-collapse: collapse; }
      .table th, .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); white-space: nowrap; }
      .row-actions { display: flex; gap: 0.4rem; }
      .tree { list-style: none; padding-left: 0; }
      .tree ul { list-style: none; padding-left: 1.5rem; margin-top: 0.5rem; }
      .tree li { margin-bottom: 0.6rem; }
      .node-row { display: flex; align-items: center; gap: 0.6rem; }
      .node-nom { font-weight: 700; }
      .actions { display: flex; gap: 0.5rem; }
      .svg-container { overflow: auto; border: 1px solid var(--color-border); border-radius: 12px; padding: 1rem; }
      hr { border: none; border-top: 1px solid var(--color-border); margin: 1.5rem 0; }
      .muted { color: var(--color-text-muted); font-size: 0.88rem; }
      .inline-form { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
      .inline-form input { padding: 0.6rem 0.75rem; border: 1px solid var(--color-border); border-radius: 8px; font: inherit; }
      .list { list-style: none; display: grid; gap: 0.5rem; }
      .list-item { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.75rem; border: 1px solid var(--color-border); border-radius: 10px; }
      .list-item .badge { margin-left: 0.5rem; }

      .page-header .tabs { margin-bottom: 0; }

      /* ── Blocs Identité / Parties prenantes ─────────────────────────── */
      .identity-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
      .identity-card { padding: 1.1rem 1.25rem; }
      .identity-summary { display: flex; align-items: center; gap: 0.9rem; }
      .identity-logo {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--color-primary);
        color: var(--color-white);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        overflow: hidden;
        flex-shrink: 0;
      }
      .identity-logo img { width: 100%; height: 100%; object-fit: cover; }
      .identity-logo.pp-logo { background: var(--color-violet); }
      .identity-logo.pp-logo svg { width: 22px; height: 22px; }
      .identity-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.15rem; }
      .identity-text strong { font-size: 1rem; }
      .identity-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
      @media (max-width: 760px) {
        .identity-grid { grid-template-columns: 1fr; }
      }

      /* ── Téléversement du logo ───────────────────────────────────────── */
      .photo-upload { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; margin-bottom: 1.25rem; }
      .photo-circle {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--color-primary);
        color: var(--color-white);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        overflow: hidden;
        flex-shrink: 0;
      }
      .photo-circle.has-photo { background: var(--color-surface); }
      .photo-circle img { width: 100%; height: 100%; object-fit: cover; }
      .photo-label { font-size: 0.75rem; color: var(--color-text-muted); font-weight: 600; }

      @media (max-width: 640px) {
        .grid-2 { grid-template-columns: 1fr; }
        .identity-summary { flex-wrap: wrap; }
        .page-header h3 { width: 100%; }
      }
    `,
  ],
})
export class OrganisationComponent implements OnInit {
  tab: Tab = 'infos';
  roles = ROLES;

  organisation: Organisation | null = null;
  savingInfos = false;

  identiteMode: IdentiteMode = null;
  editDraft: Partial<Organisation> | null = null;
  logoPreview: string | null = null;
  uploadingLogo = false;

  partiesMode: PartiesMode = null;

  membres: Membre[] = [];
  creatingMembre = false;
  savingMembre = false;
  newMembre: CreateMembrePayload = { nom: '', email: '', password: '', role: 'ARCHITECTE' };
  membrePopover: MembrePopover = null;
  membreTarget: Membre | null = null;
  membreDraft: MembreDraft | null = null;

  services: ServiceEntreprise[] = [];
  flatServices: { id: string; nom: string; indent: string }[] = [];
  creatingService = false;
  newService: { nom: string; description?: string; parentId?: string } = { nom: '' };
  servicePopover = false;

  organigrammeSvg = '';
  organigrammeTrustedSvg: SafeHtml | null = null;

  partiesPrenantes: PartiePrenante[] = [];
  newPartie: { nom: string; role?: string } = { nom: '' };

  constructor(
    public auth: AuthService,
    private organisationService: OrganisationService,
    private membresService: MembresService,
    private serviceEntrepriseService: ServiceEntrepriseService,
    private partiesPrenantesService: PartiesPrenantesService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private sanitizer: DomSanitizer,
  ) {}

  get canEditInfos(): boolean {
    return this.auth.hasRole('ADMINISTRATEUR', 'ARCHITECTE');
  }

  get canManageMembres(): boolean {
    return this.auth.hasRole('ADMINISTRATEUR');
  }

  ngOnInit(): void {
    this.loadInfos();
    this.loadServices();
    this.loadPartiesPrenantes();
    if (this.canManageMembres) this.loadMembres();
  }

  icon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] ?? '');
  }

  initials(nom: string): string {
    const parts = nom.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  roleLabel(role: RoleUtilisateur): string {
    const labels: Record<string, string> = {
      ADMINISTRATEUR: 'Administrateur',
      ARCHITECTE: 'Architecte',
    };
    return labels[role] ?? role;
  }

  serviceName(serviceId?: string | null): string {
    if (!serviceId) return '—';
    return this.flatServices.find((s) => s.id === serviceId)?.nom ?? '—';
  }

  // ── Identité ─────────────────────────────────────────────────────────────

  loadInfos(): void {
    this.organisationService.getMine().subscribe({
      next: (org) => (this.organisation = org),
      error: () => this.toast.error("Impossible de charger l'organisation."),
    });
  }

  openIdentiteView(): void {
    this.identiteMode = 'view';
  }

  openIdentiteEdit(): void {
    if (!this.organisation) return;
    this.editDraft = { ...this.organisation };
    this.logoPreview = null;
    this.identiteMode = 'edit';
  }

  closeIdentite(): void {
    this.identiteMode = null;
    this.editDraft = null;
    this.logoPreview = null;
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.editDraft) return;

    this.logoPreview = URL.createObjectURL(file);
    this.uploadingLogo = true;
    this.auth.uploadLogo(file).subscribe({
      next: (res) => {
        this.editDraft!.logoUrl = res.url;
        this.uploadingLogo = false;
      },
      error: () => {
        this.uploadingLogo = false;
        this.toast.error("Impossible d'envoyer ce logo. Réessayez avec une image plus légère.");
      },
    });
  }

  saveInfos(event: Event): void {
    event.preventDefault();
    if (!this.editDraft) return;
    this.savingInfos = true;
    const { nom, description, secteur, taille, pays, logoUrl, vision, problemesResoudre } = this.editDraft;
    this.organisationService
      .updateMine({
        nom: nom!,
        description: description ?? undefined,
        secteur: secteur ?? undefined,
        taille: taille ?? undefined,
        pays: pays ?? undefined,
        logoUrl: logoUrl ?? undefined,
        vision: vision ?? undefined,
        problemesResoudre: problemesResoudre ?? undefined,
      })
      .subscribe({
        next: (org) => {
          this.organisation = org;
          this.savingInfos = false;
          this.closeIdentite();
          this.toast.success('Organisation mise à jour.');
        },
        error: () => {
          this.savingInfos = false;
          this.toast.error("Impossible de mettre à jour l'organisation.");
        },
      });
  }

  // ── Membres ──────────────────────────────────────────────────────────────

  loadMembres(): void {
    this.membresService.list().subscribe({
      next: (membres) => (this.membres = membres),
      error: () => this.toast.error('Impossible de charger les membres.'),
    });
  }

  openMembreCreate(): void {
    this.newMembre = { nom: '', email: '', password: '', role: 'ARCHITECTE' };
    this.membrePopover = 'create';
  }

  openMembreView(membre: Membre): void {
    this.membreTarget = membre;
    this.membrePopover = 'view';
  }

  openMembreEdit(membre: Membre): void {
    this.membreTarget = membre;
    this.membreDraft = {
      role: membre.role,
      serviceId: membre.serviceId ?? null,
      poste: membre.poste ?? '',
      contact: membre.contact ?? '',
    };
    this.membrePopover = 'edit';
  }

  closeMembrePopover(): void {
    this.membrePopover = null;
    this.membreTarget = null;
    this.membreDraft = null;
  }

  createMembre(event: Event): void {
    event.preventDefault();
    this.creatingMembre = true;
    this.membresService.create(this.newMembre).subscribe({
      next: (membre) => {
        this.membres = [...this.membres, membre];
        this.creatingMembre = false;
        this.closeMembrePopover();
        this.toast.success('Membre créé.');
      },
      error: (err) => {
        this.creatingMembre = false;
        this.toast.error(err?.status === 409 ? 'Un compte existe déjà avec cet email.' : 'Impossible de créer ce membre.');
      },
    });
  }

  saveMembreEdit(event: Event): void {
    event.preventDefault();
    if (!this.membreTarget || !this.membreDraft) return;
    this.savingMembre = true;
    this.membresService
      .update(this.membreTarget.id, {
        role: this.membreDraft.role,
        serviceId: this.membreDraft.serviceId,
        poste: this.membreDraft.poste || undefined,
        contact: this.membreDraft.contact || undefined,
      })
      .subscribe({
        next: (updated) => {
          this.membres = this.membres.map((m) => (m.id === updated.id ? updated : m));
          this.savingMembre = false;
          this.closeMembrePopover();
          this.toast.success('Membre mis à jour.');
        },
        error: () => {
          this.savingMembre = false;
          this.toast.error('Impossible de mettre à jour ce membre.');
        },
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

  openServiceCreate(): void {
    this.newService = { nom: '' };
    this.servicePopover = true;
  }

  closeServicePopover(): void {
    this.servicePopover = false;
  }

  createService(event: Event): void {
    event.preventDefault();
    this.creatingService = true;
    this.serviceEntrepriseService.create(this.newService).subscribe({
      next: () => {
        this.newService = { nom: '' };
        this.creatingService = false;
        this.closeServicePopover();
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

  // ── Parties prenantes ────────────────────────────────────────────────────

  loadPartiesPrenantes(): void {
    this.partiesPrenantesService.list().subscribe({
      next: (parties) => (this.partiesPrenantes = parties),
      error: () => this.toast.error('Impossible de charger les parties prenantes.'),
    });
  }

  addPartiePrenante(event: Event): void {
    event.preventDefault();
    if (!this.newPartie.nom.trim()) return;
    this.partiesPrenantesService.create(this.newPartie).subscribe({
      next: () => {
        this.newPartie = { nom: '' };
        this.loadPartiesPrenantes();
        this.toast.success('Partie prenante ajoutée.');
      },
      error: () => this.toast.error("Impossible d'ajouter cette partie prenante."),
    });
  }

  removePartiePrenante(p: PartiePrenante): void {
    this.partiesPrenantesService.delete(p.id).subscribe({
      next: () => {
        this.loadPartiesPrenantes();
        this.toast.success('Partie prenante retirée.');
      },
      error: () => this.toast.error('Impossible de retirer cette partie prenante.'),
    });
  }
}
