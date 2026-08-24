import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  ArchimateService,
  ArchimateView,
  CapaciteMetier,
  ElementArchimate,
  RelationArchimate,
  TypeElement,
  TypeRelation,
} from './archimate.service';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';
import { downloadPng, downloadSvg } from './download.util';
import { BpmnVuesComponent } from './bpmn-vues.component';

type MainTab = 'bpmn' | 'archimate';
type Tab = 'capacites' | 'elements' | 'relations' | 'diagramme';

const TYPE_ELEMENT_LABEL: Record<TypeElement, string> = {
  VISION: 'Vision',
  OBJECTIF_ARCHIMATE: "Objectif d'architecture",
  PRINCIPE: 'Principe',
  EXIGENCE: 'Exigence',
  ACTEUR_METIER: 'Acteur métier',
  ROLE_METIER: 'Rôle métier',
  PROCESSUS_METIER: 'Processus métier',
  SERVICE_METIER: 'Service métier',
  OBJET_METIER: 'Objet métier',
};
const TYPES_ELEMENT: TypeElement[] = Object.keys(TYPE_ELEMENT_LABEL) as TypeElement[];

const TYPE_RELATION_LABEL: Record<TypeRelation, string> = {
  ASSIGNATION: 'Assignation',
  COMPOSITION: 'Composition',
  REALISATION: 'Réalisation',
  ASSOCIATION: 'Association',
};
const TYPES_RELATION: TypeRelation[] = Object.keys(TYPE_RELATION_LABEL) as TypeRelation[];

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
  selector: 'app-architecture-metier',
  standalone: true,
  imports: [CommonModule, BpmnVuesComponent],
  template: `
    <p class="muted step-question">Comment l'entreprise crée-t-elle de la valeur ? Quels sont ses processus, acteurs, rôles, services et capacités métier ?</p>

    <div class="tabs">
      <button class="tab" [class.active]="mainTab === 'bpmn'" (click)="mainTab = 'bpmn'">Diagrammes BPMN</button>
      <button class="tab" [class.active]="mainTab === 'archimate'" (click)="mainTab = 'archimate'">Diagramme ArchiMate</button>
    </div>

    <!-- ── Diagrammes BPMN ───────────────────────────────────────────────── -->
    <app-bpmn-vues *ngIf="mainTab === 'bpmn'" />

    <!-- ── Diagramme ArchiMate (sous-onglets) ─────────────────────────────── -->
    <div class="tabs sub-tabs" *ngIf="mainTab === 'archimate'">
      <button class="tab" [class.active]="tab === 'capacites'" (click)="tab = 'capacites'">Capacités</button>
      <button class="tab" [class.active]="tab === 'elements'" (click)="tab = 'elements'">Éléments</button>
      <button class="tab" [class.active]="tab === 'relations'" (click)="tab = 'relations'">Relations</button>
      <button class="tab" [class.active]="tab === 'diagramme'" (click)="tab = 'diagramme'">Diagramme</button>
    </div>

    <!-- ── Diagramme (SVG) ───────────────────────────────────────────────── -->
    <section class="card" *ngIf="mainTab === 'archimate' && tab === 'diagramme'">
      <div class="page-header">
        <p class="summary">{{ diagrammeSummary }}</p>
        <div class="actions">
          <button type="button" class="icon-btn" title="Générer" [disabled]="diagrammeLoading" (click)="generateDiagramme()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('refresh')"></svg>
          </button>
          <button type="button" class="icon-btn icon-btn-danger" title="Effacer" *ngIf="diagrammeSvg" (click)="clearDiagramme()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('clear')"></svg>
          </button>
          <button type="button" class="icon-btn" title="Exporter SVG" *ngIf="diagrammeSvg" (click)="exportDiagramme('svg')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('download')"></svg>
          </button>
          <button type="button" class="icon-btn" title="Exporter PNG" *ngIf="diagrammeSvg" (click)="exportDiagramme('png')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('download')"></svg>
          </button>
        </div>
      </div>
      <div class="empty-state" *ngIf="diagrammeLoading">Génération de la vue…</div>
      <div class="empty-state" *ngIf="!diagrammeLoading && !diagrammeSvg">Cliquez sur « Générer » pour afficher le diagramme.</div>
      <div class="svg-container" *ngIf="diagrammeTrustedSvg" [innerHTML]="diagrammeTrustedSvg"></div>
    </section>

    <!-- ── Capacités ─────────────────────────────────────────────────────── -->
    <section *ngIf="mainTab === 'archimate' && tab === 'capacites'">
      <div class="page-header">
        <h3>Capacités ({{ capacites.length }})</h3>
        <button type="button" class="btn btn-primary" (click)="openCreateCapacite()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
          Ajouter une capacité
        </button>
      </div>
      <section class="card">
        <div class="empty-state" *ngIf="capacites.length === 0">Aucune capacité métier.</div>
        <div class="table-scroll" *ngIf="capacites.length > 0">
          <table class="table">
            <thead><tr><th>Nom</th><th>Description</th><th>Éléments rattachés</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let capacite of capacites">
                <td>{{ capacite.nom }}</td>
                <td>{{ capacite.description || '—' }}</td>
                <td>{{ capacite._count?.elements || 0 }}</td>
                <td class="row-actions">
                  <button type="button" class="icon-btn icon-btn-view" title="Consulter" (click)="openCapaciteView(capacite)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('eye')"></svg>
                  </button>
                  <button type="button" class="icon-btn icon-btn-edit" title="Modifier" (click)="openCapaciteEdit(capacite)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('edit')"></svg>
                  </button>
                  <button type="button" class="icon-btn icon-btn-danger" title="Supprimer" (click)="removeCapacite(capacite)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('trash')"></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <!-- ── Éléments ──────────────────────────────────────────────────────── -->
    <section *ngIf="mainTab === 'archimate' && tab === 'elements'">
      <div class="page-header">
        <h3>Éléments ({{ elements.length }})</h3>
        <div class="header-actions">
          <select [value]="typeFilter || ''" (change)="filterByType($any($event.target).value)">
            <option value="">Tous les types</option>
            <option *ngFor="let t of typesElement" [value]="t">{{ typeElementLabel(t) }}</option>
          </select>
          <button type="button" class="btn btn-primary" (click)="openCreateElement()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
            Ajouter un élément
          </button>
        </div>
      </div>

      <section class="card">
        <div class="empty-state" *ngIf="elements.length === 0">Aucun élément ArchiMate.</div>
        <div class="table-scroll" *ngIf="elements.length > 0">
          <table class="table">
            <thead><tr><th>Nom</th><th>Type</th><th>Capacité</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let element of elements">
                <td>{{ element.nom }}</td>
                <td>{{ typeElementLabel(element.type) }}</td>
                <td>{{ element.capacite?.nom || '—' }}</td>
                <td class="row-actions">
                  <button type="button" class="icon-btn icon-btn-view" title="Consulter" (click)="openElementView(element)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('eye')"></svg>
                  </button>
                  <button type="button" class="icon-btn icon-btn-edit" title="Modifier" (click)="openElementEdit(element)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('edit')"></svg>
                  </button>
                  <button type="button" class="icon-btn icon-btn-danger" title="Supprimer" (click)="removeElement(element)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('trash')"></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <!-- ── Relations ─────────────────────────────────────────────────────── -->
    <section *ngIf="mainTab === 'archimate' && tab === 'relations'">
      <div class="page-header">
        <h3>Relations ({{ relations.length }})</h3>
        <button type="button" class="btn btn-primary" (click)="openCreateRelation()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('plus')"></svg>
          Ajouter une relation
        </button>
      </div>

      <section class="card">
        <div class="empty-state" *ngIf="relations.length === 0">Aucune relation.</div>
        <div class="table-scroll" *ngIf="relations.length > 0">
          <table class="table">
            <thead><tr><th>Source</th><th>Cible</th><th>Type</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let relation of relations">
                <td>{{ relation.source.nom }}</td>
                <td>{{ relation.target.nom }}</td>
                <td>{{ typeRelationLabel(relation.type) }}</td>
                <td class="row-actions">
                  <button type="button" class="icon-btn icon-btn-view" title="Consulter" (click)="openRelationView(relation)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('eye')"></svg>
                  </button>
                  <button type="button" class="icon-btn icon-btn-danger" title="Supprimer" (click)="removeRelation(relation)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('trash')"></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <!-- ── Popover : ajouter une capacité ────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="createCapacitePopover" (click)="closeCreateCapacite()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="createCapacite($event)">
        <div class="popover-head">
          <h3>Ajouter une capacité</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeCreateCapacite()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <label class="field">Nom<input type="text" [value]="newCapacite.nom" (input)="newCapacite.nom = $any($event.target).value" required /></label>
        <label class="field">Description<textarea [value]="newCapacite.description || ''" (input)="newCapacite.description = $any($event.target).value"></textarea></label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCreateCapacite()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creatingCapacite">{{ creatingCapacite ? 'Création…' : 'Créer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Popover : ajouter un élément ──────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="createElementPopover" (click)="closeCreateElement()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="createElement($event)">
        <div class="popover-head">
          <h3>Ajouter un élément</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeCreateElement()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <div class="grid-2">
          <label class="field">Nom<input type="text" [value]="newElement.nom" (input)="newElement.nom = $any($event.target).value" required /></label>
          <label class="field">
            Type
            <select [value]="newElement.type" (change)="newElement.type = $any($event.target).value">
              <option *ngFor="let t of typesElement" [value]="t">{{ typeElementLabel(t) }}</option>
            </select>
          </label>
        </div>
        <label class="field">
          Capacité métier (optionnel)
          <select [value]="newElement.capaciteMetierId || ''" (change)="newElement.capaciteMetierId = $any($event.target).value || undefined">
            <option value="">— Aucune —</option>
            <option *ngFor="let c of capacites" [value]="c.id">{{ c.nom }}</option>
          </select>
        </label>
        <label class="field">Description<textarea [value]="newElement.description || ''" (input)="newElement.description = $any($event.target).value"></textarea></label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCreateElement()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creatingElement">{{ creatingElement ? 'Création…' : 'Créer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Popover : ajouter une relation ────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="createRelationPopover" (click)="closeCreateRelation()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="createRelation($event)">
        <div class="popover-head">
          <h3>Ajouter une relation</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeCreateRelation()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <div class="grid-2">
          <label class="field">
            Source
            <select [value]="newRelation.sourceId" (change)="newRelation.sourceId = $any($event.target).value">
              <option value="" disabled>Choisir un élément</option>
              <option *ngFor="let e of elements" [value]="e.id">{{ e.nom }}</option>
            </select>
          </label>
          <label class="field">
            Cible
            <select [value]="newRelation.targetId" (change)="newRelation.targetId = $any($event.target).value">
              <option value="" disabled>Choisir un élément</option>
              <option *ngFor="let e of elements" [value]="e.id">{{ e.nom }}</option>
            </select>
          </label>
        </div>
        <label class="field">
          Type
          <select [value]="newRelation.type" (change)="newRelation.type = $any($event.target).value">
            <option *ngFor="let t of typesRelation" [value]="t">{{ typeRelationLabel(t) }}</option>
          </select>
        </label>
        <p class="field-error" *ngIf="relationError">{{ relationError }}</p>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCreateRelation()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="creatingRelation">{{ creatingRelation ? 'Création…' : 'Créer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Popover : consulter une capacité ──────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="capaciteViewTarget as c" (click)="closeCapaciteView()">
      <div class="popover-card" (click)="$event.stopPropagation()">
        <div class="popover-head">
          <h3>Fiche capacité</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeCapaciteView()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <dl class="fiche-list">
          <dt>Nom</dt><dd>{{ c.nom }}</dd>
          <dt>Description</dt><dd>{{ c.description || '—' }}</dd>
          <dt>Éléments rattachés</dt><dd>{{ c._count?.elements || 0 }}</dd>
        </dl>
      </div>
    </div>

    <!-- ── Popover : modifier une capacité ───────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="capaciteEditTarget && capaciteEditDraft as draft" (click)="closeCapaciteEdit()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="saveCapaciteEdit($event)">
        <div class="popover-head">
          <h3>Modifier « {{ capaciteEditTarget.nom }} »</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeCapaciteEdit()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <label class="field">Nom<input type="text" [value]="draft.nom" (input)="draft.nom = $any($event.target).value" required /></label>
        <label class="field">Description<textarea [value]="draft.description || ''" (input)="draft.description = $any($event.target).value"></textarea></label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeCapaciteEdit()">Annuler</button>
          <button type="submit" class="btn btn-success" [disabled]="savingCapacite">{{ savingCapacite ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Popover : consulter un élément ────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="elementViewTarget as e" (click)="closeElementView()">
      <div class="popover-card" (click)="$event.stopPropagation()">
        <div class="popover-head">
          <h3>Fiche élément</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeElementView()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <dl class="fiche-list">
          <dt>Nom</dt><dd>{{ e.nom }}</dd>
          <dt>Type</dt><dd>{{ typeElementLabel(e.type) }}</dd>
          <dt>Capacité</dt><dd>{{ e.capacite?.nom || '—' }}</dd>
          <dt>Description</dt><dd>{{ e.description || '—' }}</dd>
        </dl>
      </div>
    </div>

    <!-- ── Popover : modifier un élément ─────────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="elementEditTarget && elementEditDraft as draft" (click)="closeElementEdit()">
      <form class="popover-card" (click)="$event.stopPropagation()" (submit)="saveElementEdit($event)">
        <div class="popover-head">
          <h3>Modifier « {{ elementEditTarget.nom }} »</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeElementEdit()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <div class="grid-2">
          <label class="field">Nom<input type="text" [value]="draft.nom" (input)="draft.nom = $any($event.target).value" required /></label>
          <label class="field">
            Type
            <select [value]="draft.type" (change)="draft.type = $any($event.target).value">
              <option *ngFor="let t of typesElement" [value]="t">{{ typeElementLabel(t) }}</option>
            </select>
          </label>
        </div>
        <label class="field">
          Capacité métier (optionnel)
          <select [value]="draft.capaciteMetierId || ''" (change)="draft.capaciteMetierId = $any($event.target).value || null">
            <option value="">— Aucune —</option>
            <option *ngFor="let c of capacites" [value]="c.id">{{ c.nom }}</option>
          </select>
        </label>
        <label class="field">Description<textarea [value]="draft.description || ''" (input)="draft.description = $any($event.target).value"></textarea></label>
        <div class="popover-actions">
          <button type="button" class="btn btn-ghost" (click)="closeElementEdit()">Annuler</button>
          <button type="submit" class="btn btn-success" [disabled]="savingElement">{{ savingElement ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </form>
    </div>

    <!-- ── Popover : consulter une relation ──────────────────────────────── -->
    <div class="popover-backdrop" *ngIf="relationViewTarget as r" (click)="closeRelationView()">
      <div class="popover-card" (click)="$event.stopPropagation()">
        <div class="popover-head">
          <h3>Fiche relation</h3>
          <button type="button" class="icon-btn icon-btn-danger" (click)="closeRelationView()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('close')"></svg>
          </button>
        </div>
        <dl class="fiche-list">
          <dt>Source</dt><dd>{{ r.source.nom }}</dd>
          <dt>Cible</dt><dd>{{ r.target.nom }}</dd>
          <dt>Type</dt><dd>{{ typeRelationLabel(r.type) }}</dd>
        </dl>
      </div>
    </div>
  `,
  styles: [
    `
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
      .header-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
      .header-actions select { padding: 0.5rem 0.7rem; border: 1px solid var(--color-border); border-radius: 8px; font: inherit; }
      .table-scroll { overflow-x: auto; }
      .table { width: 100%; min-width: 520px; border-collapse: collapse; }
      .table th, .table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-border); }
      .row-actions { display: flex; gap: 0.4rem; white-space: nowrap; }
      .muted { color: var(--color-text-muted); margin-top: 0.35rem; font-size: 0.9rem; }
      .sub-tabs { margin: 1rem 0 1.25rem; }
      .summary { color: var(--color-text-muted); }
      .actions { display: flex; gap: 0.5rem; }
      .svg-container { overflow: auto; border: 1px solid var(--color-border); border-radius: 12px; padding: 1rem; }
      .svg-container ::ng-deep svg { max-width: 100%; height: auto; }
    `,
  ],
})
export class ArchitectureMetierComponent implements OnInit {
  mainTab: MainTab = 'bpmn';
  tab: Tab = 'capacites';
  typesElement = TYPES_ELEMENT;
  typesRelation = TYPES_RELATION;

  diagrammeSvg = '';
  diagrammeTrustedSvg: SafeHtml | null = null;
  diagrammeSummary = '';
  diagrammeLoading = false;

  capacites: CapaciteMetier[] = [];
  newCapacite: { nom: string; description?: string } = { nom: '' };
  creatingCapacite = false;
  createCapacitePopover = false;
  capaciteViewTarget: CapaciteMetier | null = null;
  capaciteEditTarget: CapaciteMetier | null = null;
  capaciteEditDraft: { nom: string; description?: string } | null = null;
  savingCapacite = false;

  elements: ElementArchimate[] = [];
  typeFilter: TypeElement | '' = '';
  newElement: { nom: string; type: TypeElement; description?: string; capaciteMetierId?: string } = {
    nom: '',
    type: 'ACTEUR_METIER',
  };
  creatingElement = false;
  createElementPopover = false;
  elementViewTarget: ElementArchimate | null = null;
  elementEditTarget: ElementArchimate | null = null;
  elementEditDraft: { nom: string; type: TypeElement; description?: string; capaciteMetierId?: string | null } | null = null;
  savingElement = false;

  relations: RelationArchimate[] = [];
  newRelation: { type: TypeRelation; sourceId: string; targetId: string } = {
    type: 'ASSIGNATION',
    sourceId: '',
    targetId: '',
  };
  creatingRelation = false;
  createRelationPopover = false;
  relationError = '';
  relationViewTarget: RelationArchimate | null = null;

  constructor(
    private archimateService: ArchimateService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private sanitizer: DomSanitizer,
  ) {}

  icon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] ?? '');
  }

  openCreateCapacite(): void {
    this.newCapacite = { nom: '' };
    this.createCapacitePopover = true;
  }

  closeCreateCapacite(): void {
    this.createCapacitePopover = false;
  }

  openCreateElement(): void {
    this.newElement = { nom: '', type: 'ACTEUR_METIER' };
    this.createElementPopover = true;
  }

  closeCreateElement(): void {
    this.createElementPopover = false;
  }

  openCreateRelation(): void {
    this.newRelation = { type: 'ASSIGNATION', sourceId: '', targetId: '' };
    this.relationError = '';
    this.createRelationPopover = true;
  }

  closeCreateRelation(): void {
    this.createRelationPopover = false;
  }

  ngOnInit(): void {
    this.loadCapacites();
    this.loadElements();
    this.loadRelations();
  }

  typeElementLabel(type: TypeElement): string {
    return TYPE_ELEMENT_LABEL[type];
  }
  typeRelationLabel(type: TypeRelation): string {
    return TYPE_RELATION_LABEL[type];
  }

  // ── Capacités ────────────────────────────────────────────────────────────

  loadCapacites(): void {
    this.archimateService.listCapacites().subscribe({
      next: (capacites) => (this.capacites = capacites),
      error: () => this.toast.error('Impossible de charger les capacités.'),
    });
  }

  createCapacite(event: Event): void {
    event.preventDefault();
    this.creatingCapacite = true;
    this.archimateService.createCapacite(this.newCapacite).subscribe({
      next: (capacite) => {
        this.capacites = [...this.capacites, capacite];
        this.creatingCapacite = false;
        this.closeCreateCapacite();
        this.toast.success('Capacité créée.');
      },
      error: () => {
        this.creatingCapacite = false;
        this.toast.error('Impossible de créer cette capacité.');
      },
    });
  }

  async removeCapacite(capacite: CapaciteMetier): Promise<void> {
    const count = capacite._count?.elements ?? 0;
    const warning = count > 0 ? ` ${count} élément(s) y sont rattaché(s) et seront détachés.` : '';
    const confirmed = await this.confirmDialog.confirm(`Supprimer la capacité « ${capacite.nom} » ?${warning}`);
    if (!confirmed) return;
    this.archimateService.deleteCapacite(capacite.id).subscribe({
      next: () => {
        this.capacites = this.capacites.filter((c) => c.id !== capacite.id);
        this.toast.success('Capacité supprimée.');
      },
      error: () => this.toast.error('Impossible de supprimer cette capacité.'),
    });
  }

  openCapaciteView(capacite: CapaciteMetier): void {
    this.capaciteViewTarget = capacite;
  }

  closeCapaciteView(): void {
    this.capaciteViewTarget = null;
  }

  openCapaciteEdit(capacite: CapaciteMetier): void {
    this.capaciteEditTarget = capacite;
    this.capaciteEditDraft = { nom: capacite.nom, description: capacite.description ?? '' };
  }

  closeCapaciteEdit(): void {
    this.capaciteEditTarget = null;
    this.capaciteEditDraft = null;
  }

  saveCapaciteEdit(event: Event): void {
    event.preventDefault();
    if (!this.capaciteEditTarget || !this.capaciteEditDraft || !this.capaciteEditDraft.nom.trim()) return;
    this.savingCapacite = true;
    this.archimateService.updateCapacite(this.capaciteEditTarget.id, this.capaciteEditDraft).subscribe({
      next: (updated) => {
        this.capacites = this.capacites.map((c) => (c.id === updated.id ? { ...c, ...updated } : c));
        this.savingCapacite = false;
        this.closeCapaciteEdit();
        this.toast.success('Capacité modifiée.');
      },
      error: () => {
        this.savingCapacite = false;
        this.toast.error('Impossible de modifier cette capacité.');
      },
    });
  }

  // ── Éléments ─────────────────────────────────────────────────────────────

  loadElements(): void {
    this.archimateService.listElements(this.typeFilter || undefined).subscribe({
      next: (elements) => (this.elements = elements),
      error: () => this.toast.error('Impossible de charger les éléments.'),
    });
  }

  filterByType(type: string): void {
    this.typeFilter = (type as TypeElement) || '';
    this.loadElements();
  }

  createElement(event: Event): void {
    event.preventDefault();
    this.creatingElement = true;
    this.archimateService.createElement(this.newElement).subscribe({
      next: () => {
        this.creatingElement = false;
        this.closeCreateElement();
        this.loadElements();
        this.toast.success('Élément créé.');
      },
      error: () => {
        this.creatingElement = false;
        this.toast.error("Impossible de créer cet élément.");
      },
    });
  }

  openElementView(element: ElementArchimate): void {
    this.elementViewTarget = element;
  }

  closeElementView(): void {
    this.elementViewTarget = null;
  }

  openElementEdit(element: ElementArchimate): void {
    this.elementEditTarget = element;
    this.elementEditDraft = {
      nom: element.nom,
      type: element.type,
      description: element.description ?? '',
      capaciteMetierId: element.capaciteMetierId ?? null,
    };
  }

  closeElementEdit(): void {
    this.elementEditTarget = null;
    this.elementEditDraft = null;
  }

  saveElementEdit(event: Event): void {
    event.preventDefault();
    if (!this.elementEditTarget || !this.elementEditDraft || !this.elementEditDraft.nom.trim()) return;
    this.savingElement = true;
    this.archimateService.updateElement(this.elementEditTarget.id, this.elementEditDraft).subscribe({
      next: () => {
        this.savingElement = false;
        this.closeElementEdit();
        this.loadElements();
        this.toast.success('Élément modifié.');
      },
      error: () => {
        this.savingElement = false;
        this.toast.error('Impossible de modifier cet élément.');
      },
    });
  }

  async removeElement(element: ElementArchimate): Promise<void> {
    const relCount = (element._count?.relationsSource ?? 0) + (element._count?.relationsTarget ?? 0);
    const warning = relCount > 0 ? ` ${relCount} relation(s) impliquant cet élément seront également supprimées.` : '';
    const confirmed = await this.confirmDialog.confirm(`Supprimer l'élément « ${element.nom} » ?${warning}`);
    if (!confirmed) return;
    this.archimateService.deleteElement(element.id).subscribe({
      next: () => {
        this.loadElements();
        this.loadRelations();
        this.toast.success('Élément supprimé.');
      },
      error: () => this.toast.error('Impossible de supprimer cet élément.'),
    });
  }

  // ── Relations ────────────────────────────────────────────────────────────

  loadRelations(): void {
    this.archimateService.listRelations().subscribe({
      next: (relations) => (this.relations = relations),
      error: () => this.toast.error('Impossible de charger les relations.'),
    });
  }

  createRelation(event: Event): void {
    event.preventDefault();
    this.relationError = '';
    if (!this.newRelation.sourceId || !this.newRelation.targetId) {
      this.relationError = 'Choisissez une source et une cible.';
      return;
    }
    if (this.newRelation.sourceId === this.newRelation.targetId) {
      this.relationError = 'La source et la cible doivent être différentes.';
      return;
    }
    this.creatingRelation = true;
    this.archimateService.createRelation(this.newRelation).subscribe({
      next: (relation) => {
        this.relations = [relation, ...this.relations];
        this.creatingRelation = false;
        this.closeCreateRelation();
        this.toast.success('Relation créée.');
      },
      error: () => {
        this.creatingRelation = false;
        this.toast.error('Impossible de créer cette relation.');
      },
    });
  }

  openRelationView(relation: RelationArchimate): void {
    this.relationViewTarget = relation;
  }

  closeRelationView(): void {
    this.relationViewTarget = null;
  }

  async removeRelation(relation: RelationArchimate): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      `Supprimer la relation « ${relation.source.nom} → ${relation.target.nom} » ?`,
    );
    if (!confirmed) return;
    this.archimateService.deleteRelation(relation.id).subscribe({
      next: () => {
        this.relations = this.relations.filter((r) => r.id !== relation.id);
        this.toast.success('Relation supprimée.');
      },
      error: () => this.toast.error('Impossible de supprimer cette relation.'),
    });
  }

  // ── Diagramme ArchiMate ──────────────────────────────────────────────────

  generateDiagramme(): void {
    this.diagrammeLoading = true;
    this.archimateService.generateView().subscribe({
      next: (view: ArchimateView) => {
        this.diagrammeSvg = view.svg;
        this.diagrammeTrustedSvg = this.sanitizer.bypassSecurityTrustHtml(view.svg);
        this.diagrammeSummary = `${view.elementCount} élément(s) — ${view.relationCount} relation(s)`;
        this.diagrammeLoading = false;
      },
      error: () => {
        this.diagrammeLoading = false;
        this.toast.error('Impossible de générer le diagramme ArchiMate.');
      },
    });
  }

  clearDiagramme(): void {
    this.diagrammeSvg = '';
    this.diagrammeTrustedSvg = null;
    this.diagrammeSummary = '';
  }

  exportDiagramme(format: 'svg' | 'png'): void {
    if (!this.diagrammeSvg) return;
    const filename = `diagramme-archimate.${format}`;
    if (format === 'svg') downloadSvg(this.diagrammeSvg, filename);
    else downloadPng(this.diagrammeSvg, filename);
  }
}
