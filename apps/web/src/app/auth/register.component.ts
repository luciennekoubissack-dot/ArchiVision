import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  ActeurItem,
  ApplicationItem,
  AuthService,
  BpmnProcessusItem,
  CapaciteItem,
  DataEntityItem,
  ObjectifItem,
  PartiePrenanteItem,
  TechComponentItem,
} from './auth.service';
import { InfoTipComponent } from '../shared/info-tip.component';

interface WizardStep {
  key: string;
  numero: number;
  titre: string;
  icon: string;
  optionnelle: boolean;
}

const STEPS: WizardStep[] = [
  { key: 'entreprise', numero: 1, titre: 'Entreprise', icon: 'building', optionnelle: false },
  { key: 'strategie', numero: 2, titre: 'Stratégie', icon: 'target', optionnelle: true },
  { key: 'bpmn', numero: 3, titre: 'Processus', icon: 'flow', optionnelle: true },
  { key: 'metier', numero: 4, titre: 'Métier', icon: 'layers', optionnelle: true },
  { key: 'donnees', numero: 5, titre: 'Données', icon: 'database', optionnelle: true },
  { key: 'applicatif', numero: 6, titre: 'Applicatif', icon: 'grid', optionnelle: true },
  { key: 'techno', numero: 7, titre: 'Technologique', icon: 'server', optionnelle: true },
  { key: 'recap', numero: 8, titre: 'Récapitulatif', icon: 'eye', optionnelle: false },
];

const ICONS: Record<string, string> = {
  building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  flow: '<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7.2 7.4 10 15.5M16.8 7.4 14 15.5M7.5 6h9"/>',
  layers: '<polygon points="12 3 3 8 12 13 21 8 12 3"/><polyline points="3 16 12 21 21 16"/><polyline points="3 12 12 17 21 12"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  server: '<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><line x1="7" y1="7" x2="7.01" y2="7"/><line x1="7" y1="17" x2="7.01" y2="17"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  camera: '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="14" r="3.5"/>',
};

const POSTES_CONVENTIONNELS = [
  "Agent d'entretien",
  'Agent de sécurité',
  'Secrétaire',
  'Comptable',
  'Responsable RH',
  'Assistant(e) administratif(ve)',
  'Technicien(ne)',
  'Chef de projet',
  'Directeur / Directrice',
  'Chargé(e) de clientèle',
];

const TECH_TYPES: { value: TechComponentItem['type']; label: string }[] = [
  { value: 'SERVEUR', label: 'Serveur' },
  { value: 'RESEAU', label: 'Réseau' },
  { value: 'CLOUD', label: 'Cloud' },
  { value: 'BASE_DE_DONNEES', label: 'Base de données' },
  { value: 'MIDDLEWARE', label: 'Middleware' },
];

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, InfoTipComponent],
  template: `
    <section class="auth-screen">
      <div class="auth-image">
        <div class="auth-image-overlay">
          <span class="auth-image-eyebrow">ArchiVision</span>
          <p class="auth-image-quote">Modélisez votre architecture d'entreprise étape par étape, du référentiel au canevas interactif.</p>
        </div>
      </div>

      <div class="auth-form-col">
        <div class="wizard-top">
          <img src="assets/logo.png" alt="ArchiVision" class="logo-sm" />
          <span class="switch">Déjà un compte ? <a routerLink="/login">Se connecter</a></span>
        </div>

        <h1>Créer mon organisation</h1>
        <p class="subtitle">Quelques informations pour démarrer votre référentiel d'architecture d'entreprise.</p>

        <div class="stepper">
          <button
            type="button"
            class="step"
            *ngFor="let s of steps"
            [class.active]="s.key === current.key"
            [class.done]="s.numero < current.numero"
            (click)="goTo(s)"
          >
            <span class="step-circle">
              <svg *ngIf="s.numero < current.numero" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('check')"></svg>
              <ng-container *ngIf="s.numero >= current.numero">{{ s.numero }}</ng-container>
            </span>
            <span class="step-titre">{{ s.titre }}</span>
          </button>
        </div>

        <p class="field-error" *ngIf="error">{{ error }}</p>

        <div class="step-body">
          <!-- ── Étape 1 : Entreprise & compte administrateur ─────────────── -->
          <div *ngIf="current.key === 'entreprise'">
            <div class="entreprise-head">
              <div class="entreprise-fields">
                <label class="field">
                  Nom de l'organisation <app-info-tip text="Le nom officiel de votre entreprise, tel qu'il apparaîtra dans toute la plateforme." />
                  <input type="text" [value]="organisationNom" (input)="organisationNom = $any($event.target).value" required />
                </label>
              </div>
              <div class="photo-upload">
                <button type="button" class="photo-circle" (click)="fileInput.click()" [class.has-photo]="logoPreview">
                  <img *ngIf="logoPreview" [src]="logoPreview" alt="Logo" />
                  <svg *ngIf="!logoPreview" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('camera')"></svg>
                </button>
                <span class="photo-label">{{ uploadingLogo ? 'Envoi…' : 'Logo' }}</span>
                <input #fileInput type="file" accept="image/png,image/jpeg,image/webp" hidden (change)="onLogoSelected($event)" />
              </div>
            </div>

            <div class="grid-2">
              <label class="field">
                Secteur <app-info-tip text="Le secteur d'activité principal, ex. Banque, Santé, Distribution." />
                <input type="text" [value]="secteur" (input)="secteur = $any($event.target).value" />
              </label>
              <label class="field">
                Taille <app-info-tip text="Effectif approximatif de l'entreprise, ex. 150 collaborateurs." />
                <input type="text" [value]="taille" (input)="taille = $any($event.target).value" placeholder="ex. 150 collaborateurs" />
              </label>
            </div>

            <label class="field">
              Pays <app-info-tip text="Le pays du siège social de l'entreprise." />
              <input type="text" [value]="pays" (input)="pays = $any($event.target).value" />
            </label>

            <label class="field">
              Description courte <app-info-tip text="Une ou deux phrases décrivant l'activité de l'entreprise (facultatif)." />
              <textarea rows="2" [value]="organisationDescription" (input)="organisationDescription = $any($event.target).value"></textarea>
            </label>

            <hr />
            <h3>Compte administrateur</h3>

            <label class="field">
              Votre nom <app-info-tip text="Le nom du premier administrateur du compte — vous pourrez inviter d'autres membres ensuite." />
              <input type="text" [value]="nom" (input)="nom = $any($event.target).value" required />
            </label>

            <div class="grid-2">
              <label class="field">
                Email <app-info-tip text="Sert d'identifiant de connexion à la plateforme." />
                <input type="email" [value]="email" (input)="email = $any($event.target).value" required autocomplete="email" />
              </label>
              <label class="field">
                Mot de passe <app-info-tip text="8 caractères minimum. Choisissez un mot de passe que vous seul(e) connaissez." />
                <input type="password" [value]="password" (input)="password = $any($event.target).value" required minlength="8" autocomplete="new-password" />
              </label>
            </div>
          </div>

          <!-- ── Étape 2 : Stratégie ──────────────────────────────────────── -->
          <div *ngIf="current.key === 'strategie'">
            <label class="field">
              Vision <app-info-tip text="Où voulez-vous emmener l'entreprise à moyen terme ? Cette vision guide toute l'architecture." />
              <textarea rows="3" placeholder="Quelle est la vision de l'entreprise ?" [value]="vision" (input)="vision = $any($event.target).value"></textarea>
            </label>
            <label class="field">
              Problèmes à résoudre <app-info-tip text="Les difficultés concrètes que la transformation doit résoudre en priorité." />
              <textarea rows="3" placeholder="Quels problèmes veut-on résoudre ?" [value]="problemesResoudre" (input)="problemesResoudre = $any($event.target).value"></textarea>
            </label>

            <hr />
            <h3>Objectifs stratégiques <app-info-tip text="Ce que l'entreprise cherche à atteindre, ex. Réduire les délais de traitement de 30%." /></h3>
            <form class="inline-form" (submit)="addObjectif($event)">
              <input type="text" placeholder="Nom de l'objectif" [value]="newObjectif.nom" (input)="newObjectif.nom = $any($event.target).value" required />
              <input type="text" placeholder="Description (facultatif)" [value]="newObjectif.description" (input)="newObjectif.description = $any($event.target).value" />
              <button type="submit" class="btn btn-outline">Ajouter</button>
            </form>
            <ul class="list" *ngIf="objectifs.length">
              <li class="list-item" *ngFor="let o of objectifs; let i = index">
                <div><strong>{{ o.nom }}</strong><span class="muted" *ngIf="o.description"> — {{ o.description }}</span></div>
                <button type="button" class="btn btn-ghost" (click)="objectifs.splice(i, 1)">Retirer</button>
              </li>
            </ul>

            <hr />
            <h3>Parties prenantes <app-info-tip text="Acteurs externes influents pour votre transformation : régulateur, partenaire clé, client majeur…" /></h3>
            <form class="inline-form" (submit)="addPartie($event)">
              <input type="text" placeholder="Nom" [value]="newPartie.nom" (input)="newPartie.nom = $any($event.target).value" required />
              <input type="text" placeholder="Rôle (ex. régulateur)" [value]="newPartie.role" (input)="newPartie.role = $any($event.target).value" />
              <button type="submit" class="btn btn-outline">Ajouter</button>
            </form>
            <ul class="list" *ngIf="partiesPrenantes.length">
              <li class="list-item" *ngFor="let p of partiesPrenantes; let i = index">
                <div><strong>{{ p.nom }}</strong><span class="badge badge-neutral" *ngIf="p.role">{{ p.role }}</span></div>
                <button type="button" class="btn btn-ghost" (click)="partiesPrenantes.splice(i, 1)">Retirer</button>
              </li>
            </ul>
          </div>

          <!-- ── Étape 3 : Processus (BPMN) ───────────────────────────────── -->
          <div *ngIf="current.key === 'bpmn'">
            <p class="muted">Listez vos principaux processus métier — vous pourrez générer et affiner leurs diagrammes BPMN directement après l'inscription.</p>
            <form class="inline-form" (submit)="addProcessus($event)">
              <input type="text" placeholder="Nom du processus" [value]="newProcessus.nom" (input)="newProcessus.nom = $any($event.target).value" required />
              <input type="text" placeholder="Description (facultatif)" [value]="newProcessus.description" (input)="newProcessus.description = $any($event.target).value" />
              <button type="submit" class="btn btn-outline">Ajouter</button>
            </form>
            <ul class="list" *ngIf="bpmnProcessus.length">
              <li class="list-item" *ngFor="let p of bpmnProcessus; let i = index">
                <div><strong>{{ p.nom }}</strong><span class="muted" *ngIf="p.description"> — {{ p.description }}</span></div>
                <button type="button" class="btn btn-ghost" (click)="bpmnProcessus.splice(i, 1)">Retirer</button>
              </li>
            </ul>
            <div class="empty-state" *ngIf="!bpmnProcessus.length">Aucun processus renseigné pour l'instant.</div>
          </div>

          <!-- ── Étape 4 : Architecture métier ────────────────────────────── -->
          <div *ngIf="current.key === 'metier'">
            <h3>Postes <app-info-tip text="Cochez les postes présents dans votre entreprise, ou ajoutez-en un qui ne figure pas dans la liste." /></h3>
            <div class="checkbox-grid">
              <label class="checkbox-item" *ngFor="let poste of postesConventionnels">
                <input type="checkbox" [checked]="selectedPostes.includes(poste)" (change)="togglePoste(poste)" />
                {{ poste }}
              </label>
            </div>
            <form class="inline-form" (submit)="addCustomPoste($event)">
              <input type="text" placeholder="Ajouter un autre poste" [value]="newPoste" (input)="newPoste = $any($event.target).value" />
              <button type="submit" class="btn btn-outline">Ajouter</button>
            </form>
            <ul class="list" *ngIf="customPostes.length">
              <li class="list-item" *ngFor="let p of customPostes; let i = index">
                <div>{{ p }}</div>
                <button type="button" class="btn btn-ghost" (click)="customPostes.splice(i, 1)">Retirer</button>
              </li>
            </ul>

            <hr />
            <h3>Fonctions <app-info-tip text="Les rôles/responsabilités exercés, indépendamment du poste — ex. Validation des dossiers, Contrôle qualité." /></h3>
            <form class="inline-form" (submit)="addFonction($event)">
              <input type="text" placeholder="Nom de la fonction" [value]="newFonction.nom" (input)="newFonction.nom = $any($event.target).value" required />
              <button type="submit" class="btn btn-outline">Ajouter</button>
            </form>
            <ul class="list" *ngIf="fonctions.length">
              <li class="list-item" *ngFor="let f of fonctions; let i = index">
                <div>{{ f.nom }}</div>
                <button type="button" class="btn btn-ghost" (click)="fonctions.splice(i, 1)">Retirer</button>
              </li>
            </ul>

            <hr />
            <h3>Capacités métier <app-info-tip text="Ce que l'entreprise sait faire, ex. Gestion des formations, Recouvrement." /></h3>
            <form class="inline-form" (submit)="addCapacite($event)">
              <input type="text" placeholder="Nom de la capacité" [value]="newCapacite.nom" (input)="newCapacite.nom = $any($event.target).value" required />
              <input type="text" placeholder="Description (facultatif)" [value]="newCapacite.description" (input)="newCapacite.description = $any($event.target).value" />
              <button type="submit" class="btn btn-outline">Ajouter</button>
            </form>
            <ul class="list" *ngIf="capacitesMetier.length">
              <li class="list-item" *ngFor="let c of capacitesMetier; let i = index">
                <div><strong>{{ c.nom }}</strong><span class="muted" *ngIf="c.description"> — {{ c.description }}</span></div>
                <button type="button" class="btn btn-ghost" (click)="capacitesMetier.splice(i, 1)">Retirer</button>
              </li>
            </ul>
          </div>

          <!-- ── Étape 5 : Architecture des données ───────────────────────── -->
          <div *ngIf="current.key === 'donnees'">
            <p class="muted">Quelles sont les principales données manipulées par l'entreprise ?</p>
            <form class="inline-form" (submit)="addDataEntity($event)">
              <input type="text" placeholder="Nom de l'entité (ex. Client)" [value]="newDataEntity.nom" (input)="newDataEntity.nom = $any($event.target).value" required />
              <input type="text" placeholder="Description (facultatif)" [value]="newDataEntity.description" (input)="newDataEntity.description = $any($event.target).value" />
              <button type="submit" class="btn btn-outline">Ajouter</button>
            </form>
            <ul class="list" *ngIf="dataEntities.length">
              <li class="list-item" *ngFor="let d of dataEntities; let i = index">
                <div><strong>{{ d.nom }}</strong><span class="muted" *ngIf="d.description"> — {{ d.description }}</span></div>
                <button type="button" class="btn btn-ghost" (click)="dataEntities.splice(i, 1)">Retirer</button>
              </li>
            </ul>
            <div class="empty-state" *ngIf="!dataEntities.length">Aucune entité renseignée pour l'instant.</div>
          </div>

          <!-- ── Étape 6 : Architecture applicative ───────────────────────── -->
          <div *ngIf="current.key === 'applicatif'">
            <p class="muted">Quelles applications utilisez-vous déjà ?</p>
            <form class="inline-form" (submit)="addApplication($event)">
              <input type="text" placeholder="Nom de l'application" [value]="newApplication.nom" (input)="newApplication.nom = $any($event.target).value" required />
              <button type="submit" class="btn btn-outline">Ajouter</button>
            </form>
            <ul class="list" *ngIf="applications.length">
              <li class="list-item" *ngFor="let a of applications; let i = index">
                <div><strong>{{ a.nom }}</strong></div>
                <button type="button" class="btn btn-ghost" (click)="applications.splice(i, 1)">Retirer</button>
              </li>
            </ul>
            <div class="empty-state" *ngIf="!applications.length">Aucune application renseignée pour l'instant.</div>
          </div>

          <!-- ── Étape 7 : Architecture technologique ─────────────────────── -->
          <div *ngIf="current.key === 'techno'">
            <p class="muted">Quels composants techniques font tourner votre système d'information ?</p>
            <form class="inline-form" (submit)="addTechComponent($event)">
              <input type="text" placeholder="Nom du composant" [value]="newTechComponent.nom" (input)="newTechComponent.nom = $any($event.target).value" required />
              <select [value]="newTechComponent.type" (change)="newTechComponent.type = $any($event.target).value">
                <option *ngFor="let t of techTypes" [value]="t.value">{{ t.label }}</option>
              </select>
              <button type="submit" class="btn btn-outline">Ajouter</button>
            </form>
            <ul class="list" *ngIf="techComponents.length">
              <li class="list-item" *ngFor="let t of techComponents; let i = index">
                <div><strong>{{ t.nom }}</strong><span class="badge badge-neutral">{{ techLabel(t.type) }}</span></div>
                <button type="button" class="btn btn-ghost" (click)="techComponents.splice(i, 1)">Retirer</button>
              </li>
            </ul>
            <div class="empty-state" *ngIf="!techComponents.length">Aucun composant renseigné pour l'instant.</div>
          </div>

          <!-- ── Étape 8 : Récapitulatif ───────────────────────────────────── -->
          <div *ngIf="current.key === 'recap'" class="recap">
            <div class="recap-row"><span>Organisation</span><strong>{{ organisationNom || '—' }}</strong></div>
            <div class="recap-row"><span>Administrateur</span><strong>{{ nom || '—' }} ({{ email || '—' }})</strong></div>
            <div class="recap-row"><span>Vision renseignée</span><strong>{{ vision ? 'Oui' : 'Non' }}</strong></div>
            <div class="recap-row"><span>Objectifs stratégiques</span><strong>{{ objectifs.length }}</strong></div>
            <div class="recap-row"><span>Parties prenantes</span><strong>{{ partiesPrenantes.length }}</strong></div>
            <div class="recap-row"><span>Processus métier</span><strong>{{ bpmnProcessus.length }}</strong></div>
            <div class="recap-row"><span>Postes</span><strong>{{ selectedPostes.length + customPostes.length }}</strong></div>
            <div class="recap-row"><span>Fonctions</span><strong>{{ fonctions.length }}</strong></div>
            <div class="recap-row"><span>Capacités métier</span><strong>{{ capacitesMetier.length }}</strong></div>
            <div class="recap-row"><span>Entités de données</span><strong>{{ dataEntities.length }}</strong></div>
            <div class="recap-row"><span>Applications</span><strong>{{ applications.length }}</strong></div>
            <div class="recap-row"><span>Composants technologiques</span><strong>{{ techComponents.length }}</strong></div>
            <p class="muted" style="margin-top: 1rem;">Tout ce qui n'a pas été rempli pourra l'être plus tard, directement depuis l'application.</p>
          </div>
        </div>

        <div class="step-nav">
          <button type="button" class="btn btn-outline" [disabled]="current.numero === 1" (click)="previous()">← Précédent</button>
          <button type="button" class="btn btn-ghost" *ngIf="current.numero > 1 && current.numero < steps.length" (click)="next()">Passer cette étape</button>
          <button type="button" class="btn btn-primary" *ngIf="current.numero < steps.length" (click)="next()">Suivant →</button>
          <button type="button" class="btn btn-primary" *ngIf="current.numero === steps.length" [disabled]="loading" (click)="submit()">
            {{ loading ? 'Création…' : "Terminer l'inscription" }}
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .auth-screen {
        height: 100vh;
        display: grid;
        grid-template-columns: 40% 60%;
        overflow: hidden;
      }
      .auth-image {
        position: relative;
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.55), rgba(31, 59, 179, 0.55)), url('/assets/im.jpg') center/cover no-repeat;
        display: flex;
        align-items: flex-end;
      }
      .auth-image-overlay { padding: 2.5rem; color: var(--color-white); }
      .auth-image-eyebrow {
        display: inline-block;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        background: rgba(255, 255, 255, 0.16);
        padding: 0.35rem 0.8rem;
        border-radius: 999px;
        margin-bottom: 0.9rem;
      }
      .auth-image-quote { font-size: 1.25rem; font-weight: 700; line-height: 1.5; max-width: 340px; }

      .auth-form-col {
        height: 100vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0.85rem 3rem;
      }
      .logo { width: 56px; height: 56px; border-radius: 12px; margin-bottom: 1rem; }
      .wizard-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem; }
      .logo-sm { width: 32px; height: 32px; border-radius: 8px; }
      h1 { font-size: 1.3rem; font-weight: 800; }
      h3 { font-size: 0.94rem; margin-bottom: 0.5rem; display: flex; align-items: center; }
      .subtitle { color: var(--color-text-muted); margin: 0.25rem 0 0.85rem; font-size: 0.86rem; }
      .muted { color: var(--color-text-muted); font-size: 0.86rem; }
      .field { text-align: left; display: flex; align-items: center; flex-wrap: wrap; margin-bottom: 0.55rem; }
      .field input, .field textarea { flex-basis: 100%; }
      .field input, .field select, .field textarea { padding: 0.5rem 0.7rem; margin-top: 0.25rem; }
      .field textarea { min-height: 50px; }
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
      hr { border: none; border-top: 1px solid var(--color-border); margin: 0.75rem 0; }
      .switch { font-size: 0.86rem; color: var(--color-text-muted); }
      .switch a { color: var(--color-primary); font-weight: 700; text-decoration: none; }

      @media (max-width: 900px) {
        .auth-screen { grid-template-columns: 1fr; height: auto; min-height: 100vh; }
        .auth-image { min-height: 200px; }
        .auth-form-col { height: auto; }
      }

      .entreprise-head { display: flex; align-items: flex-start; gap: 1.5rem; }
      .entreprise-fields { flex: 1; }
      .photo-upload { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; flex-shrink: 0; }
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

      .inline-form { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
      .inline-form input, .inline-form select {
        padding: 0.6rem 0.75rem;
        border: 1px solid var(--color-border);
        border-radius: 8px;
        font: inherit;
        flex: 1;
        min-width: 140px;
      }
      .list { list-style: none; display: grid; gap: 0.5rem; margin-bottom: 0.5rem; }
      .list-item { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.75rem; border: 1px solid var(--color-border); border-radius: 10px; }
      .list-item .badge { margin-left: 0.5rem; }

      .checkbox-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem 1rem; margin-bottom: 1rem; }
      .checkbox-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }

      .recap { display: grid; gap: 0.35rem; }
      .recap-row { display: flex; justify-content: space-between; padding: 0.4rem 0.8rem; background: var(--color-surface); border-radius: 10px; font-size: 0.85rem; }

      .stepper {
        display: flex;
        align-items: stretch;
        gap: 0;
        overflow-x: auto;
        margin-bottom: 0.75rem;
        padding: 0.35rem 0.25rem;
        border-bottom: 1px solid var(--color-border);
      }
      .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
        flex: 1;
        min-width: 76px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
        position: relative;
      }
      .step:not(:last-child)::after {
        content: '';
        position: absolute;
        top: 16px;
        left: 55%;
        width: 90%;
        height: 2px;
        background: var(--color-border);
      }
      .step-circle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        flex-shrink: 0;
        border-radius: 50%;
        border: 2px solid var(--color-border);
        color: var(--color-text-muted);
        font-weight: 700;
        font-size: 0.85rem;
        background: var(--color-white);
        z-index: 1;
      }
      .step-circle svg { width: 15px; height: 15px; }
      .step-titre { font-size: 0.72rem; font-weight: 600; color: var(--color-text-muted); text-align: center; }
      .step.active .step-circle { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-light); }
      .step.active .step-titre { color: var(--color-text); }
      .step.done .step-circle { border-color: var(--color-success); color: var(--color-success); background: var(--color-success-light); }

      .step-body { min-height: 0; }

      .step-nav {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.6rem;
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--color-border);
      }
      .step-nav .btn-outline { margin-right: auto; }

      @media (max-width: 560px) {
        .grid-2 { grid-template-columns: 1fr; }
        .entreprise-head { flex-direction: column; align-items: center; text-align: center; }
      }
    `,
  ],
})
export class RegisterComponent {
  steps = STEPS;
  current: WizardStep = STEPS[0];
  postesConventionnels = POSTES_CONVENTIONNELS;
  techTypes = TECH_TYPES;

  loading = false;
  error = '';

  // Étape 1
  organisationNom = '';
  secteur = '';
  taille = '';
  pays = '';
  organisationDescription = '';
  logoUrl: string | null = null;
  logoPreview: string | null = null;
  uploadingLogo = false;
  nom = '';
  email = '';
  password = '';

  // Étape 2
  vision = '';
  problemesResoudre = '';
  objectifs: ObjectifItem[] = [];
  newObjectif: ObjectifItem = { nom: '', description: '' };
  partiesPrenantes: PartiePrenanteItem[] = [];
  newPartie: PartiePrenanteItem = { nom: '', role: '' };

  // Étape 3
  bpmnProcessus: BpmnProcessusItem[] = [];
  newProcessus: BpmnProcessusItem = { nom: '', description: '' };

  // Étape 4
  selectedPostes: string[] = [];
  customPostes: string[] = [];
  newPoste = '';
  fonctions: { nom: string }[] = [];
  newFonction: { nom: string } = { nom: '' };
  capacitesMetier: CapaciteItem[] = [];
  newCapacite: CapaciteItem = { nom: '', description: '' };

  // Étape 5
  dataEntities: DataEntityItem[] = [];
  newDataEntity: DataEntityItem = { nom: '', description: '' };

  // Étape 6
  applications: ApplicationItem[] = [];
  newApplication: ApplicationItem = { nom: '' };

  // Étape 7
  techComponents: TechComponentItem[] = [];
  newTechComponent: TechComponentItem = { nom: '', type: 'SERVEUR' };

  constructor(
    private auth: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer,
  ) {}

  icon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] ?? '');
  }

  techLabel(value: string): string {
    return this.techTypes.find((t) => t.value === value)?.label ?? value;
  }

  goTo(step: WizardStep): void {
    if (step.numero === 1 || this.current.numero >= 1) this.current = step;
  }

  next(): void {
    if (this.current.numero === 1 && !this.validateEntreprise()) return;
    const idx = this.steps.findIndex((s) => s.key === this.current.key);
    if (idx < this.steps.length - 1) {
      this.error = '';
      this.current = this.steps[idx + 1];
    }
  }

  previous(): void {
    const idx = this.steps.findIndex((s) => s.key === this.current.key);
    if (idx > 0) {
      this.error = '';
      this.current = this.steps[idx - 1];
    }
  }

  private validateEntreprise(): boolean {
    if (!this.organisationNom.trim() || !this.nom.trim() || !this.email.trim() || this.password.length < 8) {
      this.error = 'Merci de compléter tous les champs requis (mot de passe : 8 caractères minimum).';
      return false;
    }
    this.error = '';
    return true;
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.logoPreview = URL.createObjectURL(file);
    this.uploadingLogo = true;
    this.auth.uploadLogo(file).subscribe({
      next: (res) => {
        this.logoUrl = res.url;
        this.uploadingLogo = false;
      },
      error: () => {
        this.uploadingLogo = false;
        this.error = "Impossible d'envoyer ce logo. Réessayez avec une image plus légère.";
      },
    });
  }

  addObjectif(event: Event): void {
    event.preventDefault();
    if (!this.newObjectif.nom.trim()) return;
    this.objectifs = [...this.objectifs, { ...this.newObjectif }];
    this.newObjectif = { nom: '', description: '' };
  }

  addPartie(event: Event): void {
    event.preventDefault();
    if (!this.newPartie.nom.trim()) return;
    this.partiesPrenantes = [...this.partiesPrenantes, { ...this.newPartie }];
    this.newPartie = { nom: '', role: '' };
  }

  addProcessus(event: Event): void {
    event.preventDefault();
    if (!this.newProcessus.nom.trim()) return;
    this.bpmnProcessus = [...this.bpmnProcessus, { ...this.newProcessus }];
    this.newProcessus = { nom: '', description: '' };
  }

  togglePoste(poste: string): void {
    this.selectedPostes = this.selectedPostes.includes(poste)
      ? this.selectedPostes.filter((p) => p !== poste)
      : [...this.selectedPostes, poste];
  }

  addCustomPoste(event: Event): void {
    event.preventDefault();
    if (!this.newPoste.trim()) return;
    this.customPostes = [...this.customPostes, this.newPoste.trim()];
    this.newPoste = '';
  }

  addFonction(event: Event): void {
    event.preventDefault();
    if (!this.newFonction.nom.trim()) return;
    this.fonctions = [...this.fonctions, { ...this.newFonction }];
    this.newFonction = { nom: '' };
  }

  addCapacite(event: Event): void {
    event.preventDefault();
    if (!this.newCapacite.nom.trim()) return;
    this.capacitesMetier = [...this.capacitesMetier, { ...this.newCapacite }];
    this.newCapacite = { nom: '', description: '' };
  }

  addDataEntity(event: Event): void {
    event.preventDefault();
    if (!this.newDataEntity.nom.trim()) return;
    this.dataEntities = [...this.dataEntities, { ...this.newDataEntity }];
    this.newDataEntity = { nom: '', description: '' };
  }

  addApplication(event: Event): void {
    event.preventDefault();
    if (!this.newApplication.nom.trim()) return;
    this.applications = [...this.applications, { ...this.newApplication }];
    this.newApplication = { nom: '' };
  }

  addTechComponent(event: Event): void {
    event.preventDefault();
    if (!this.newTechComponent.nom.trim()) return;
    this.techComponents = [...this.techComponents, { ...this.newTechComponent }];
    this.newTechComponent = { nom: '', type: 'SERVEUR' };
  }

  submit(): void {
    if (!this.validateEntreprise()) {
      this.current = this.steps[0];
      return;
    }

    const acteurs: ActeurItem[] = [
      ...this.selectedPostes.map((nom) => ({ nom, type: 'ACTEUR_METIER' as const })),
      ...this.customPostes.map((nom) => ({ nom, type: 'ACTEUR_METIER' as const })),
      ...this.fonctions.map((f) => ({ nom: f.nom, type: 'ROLE_METIER' as const })),
    ];

    this.loading = true;
    this.auth
      .register({
        organisationNom: this.organisationNom,
        organisationDescription: this.organisationDescription || undefined,
        secteur: this.secteur || undefined,
        taille: this.taille || undefined,
        pays: this.pays || undefined,
        logoUrl: this.logoUrl || undefined,
        vision: this.vision || undefined,
        problemesResoudre: this.problemesResoudre || undefined,
        nom: this.nom,
        email: this.email,
        password: this.password,
        objectifs: this.objectifs.length ? this.objectifs : undefined,
        partiesPrenantes: this.partiesPrenantes.length ? this.partiesPrenantes : undefined,
        bpmnProcessus: this.bpmnProcessus.length ? this.bpmnProcessus : undefined,
        capacitesMetier: this.capacitesMetier.length ? this.capacitesMetier : undefined,
        acteurs: acteurs.length ? acteurs : undefined,
        dataEntities: this.dataEntities.length ? this.dataEntities : undefined,
        applications: this.applications.length ? this.applications : undefined,
        techComponents: this.techComponents.length ? this.techComponents : undefined,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/canevas']);
        },
        error: (err) => {
          this.loading = false;
          this.error =
            err?.status === 409
              ? 'Un compte existe déjà avec cet email.'
              : "Impossible de créer l'organisation. Vérifiez les champs saisis.";
          this.current = this.steps[0];
        },
      });
  }
}
