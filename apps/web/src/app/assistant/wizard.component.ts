import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { OrganisationService, Organisation } from '../organisation/organisation.service';
import { PartiesPrenantesService, PartiePrenante } from '../organisation/parties-prenantes.service';
import { ToastService } from '../shared/toast.service';
import { AuthService } from '../auth/auth.service';
import { BpmnComponent } from '../vision/bpmn.component';
import { ArchitectureMetierComponent } from '../architecture-metier/architecture-metier.component';
import { DonneesComponent } from '../donnees/donnees.component';
import { ApplicationsComponent } from '../architecture-systeme/applications.component';
import { TechnologieComponent } from '../technologie/technologie.component';
import { RoadmapComponent } from '../roadmap/roadmap.component';

interface WizardStep {
  key: string;
  numero: number;
  titre: string;
  sousTitre: string;
  icon: string;
}

const STEPS: WizardStep[] = [
  { key: 'vision', numero: 1, titre: 'Vision stratégique', sousTitre: 'Vision, problématiques à résoudre et parties prenantes', icon: 'target' },
  { key: 'bpmn', numero: 2, titre: 'Procédures', sousTitre: 'Processus métier, support et de pilotage', icon: 'flow' },
  { key: 'metier', numero: 3, titre: 'Architecture métier', sousTitre: 'Capacités, acteurs et éléments ArchiMate', icon: 'layers' },
  { key: 'donnees', numero: 4, titre: 'Architecture des données', sousTitre: 'Entités, attributs et relations', icon: 'database' },
  { key: 'applicatif', numero: 5, titre: 'Architecture applicative', sousTitre: 'Portefeuille d’applications', icon: 'grid' },
  { key: 'techno', numero: 6, titre: 'Architecture technologique', sousTitre: 'Composants et déploiements', icon: 'server' },
  { key: 'roadmap', numero: 7, titre: 'Roadmap de transformation', sousTitre: 'Projets, priorités et échéances', icon: 'flag' },
  { key: 'synthese', numero: 8, titre: 'Synthèse', sousTitre: 'Architecture générée automatiquement', icon: 'eye' },
];

/// Question(s) guide pour chaque étape de la démarche TOGAF ADM, pour aider
/// l'utilisateur à savoir quoi renseigner sans connaître la méthode par cœur.
/// Uniquement pour les étapes sans page dédiée (les étapes 2 à 7 embarquent
/// un composant qui affiche déjà sa propre question — voir bpmn/architecture-
/// metier/donnees/applications/technologie/roadmap.component.ts).
const STEP_QUESTIONS: Record<string, string> = {
  vision: 'Quels sont les objectifs de l’entreprise ? Quels problèmes veut-on résoudre ? Quelle est sa vision ?',
};

const ICONS: Record<string, string> = {
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  flow: '<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7.2 7.4 10 15.5M16.8 7.4 14 15.5M7.5 6h9"/>',
  layers: '<polygon points="12 3 3 8 12 13 21 8 12 3"/><polyline points="3 16 12 21 21 16"/><polyline points="3 12 12 17 21 12"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  server: '<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><line x1="7" y1="7" x2="7.01" y2="7"/><line x1="7" y1="17" x2="7.01" y2="17"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h13l-3 4 3 4H5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
};

@Component({
  selector: 'app-wizard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    BpmnComponent,
    ArchitectureMetierComponent,
    DonneesComponent,
    ApplicationsComponent,
    TechnologieComponent,
    RoadmapComponent,
  ],
  template: `

    <div class="stepper card">
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
        <span class="step-label">
          <span class="step-titre">{{ s.titre }}</span>
        </span>
      </button>
    </div>

    <section class="card step-content">
      <div class="step-content-header">
        <span class="icon-badge icon-badge-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon(current.icon)"></svg>
        </span>
        <div>
          <h3>Étape {{ current.numero }} — {{ current.titre }}</h3>
          <p class="muted">{{ current.sousTitre }}</p>
        </div>
      </div>

      <div class="step-question" *ngIf="stepQuestion(current.key) as q">
        <strong>À se demander :</strong> {{ q }}
      </div>

      <!-- ── Étape 1 : Vision ─────────────────────────────────────────────── -->
      <div *ngIf="current.key === 'vision' && organisation">
        <label class="field">
          Vision
          <textarea placeholder="Quelle est la vision de l'entreprise ?" [value]="organisation.vision || ''" (input)="organisation.vision = $any($event.target).value" [disabled]="!canEdit"></textarea>
        </label>
        <label class="field">
          Problèmes à résoudre
          <textarea placeholder="Quels problèmes veut-on résoudre ?" [value]="organisation.problemesResoudre || ''" (input)="organisation.problemesResoudre = $any($event.target).value" [disabled]="!canEdit"></textarea>
        </label>
        <button class="btn btn-primary" *ngIf="canEdit" (click)="saveVision()" [disabled]="savingVision">
          {{ savingVision ? 'Enregistrement…' : 'Enregistrer' }}
        </button>

        <hr />
        <h3>Parties prenantes</h3>
        <form class="inline-form" *ngIf="canEdit" (submit)="addPartiePrenante($event)">
          <input type="text" placeholder="Nom" [value]="newPartie.nom" (input)="newPartie.nom = $any($event.target).value" required />
          <input type="text" placeholder="Rôle (ex. client, régulateur)" [value]="newPartie.role || ''" (input)="newPartie.role = $any($event.target).value" />
          <button type="submit" class="btn btn-outline">Ajouter</button>
        </form>
        <div class="empty-state" *ngIf="partiesPrenantes.length === 0">Aucune partie prenante renseignée.</div>
        <ul class="list" *ngIf="partiesPrenantes.length > 0">
          <li class="list-item" *ngFor="let p of partiesPrenantes">
            <div><strong>{{ p.nom }}</strong><span class="badge badge-neutral" *ngIf="p.role">{{ p.role }}</span></div>
            <button class="btn btn-ghost" *ngIf="canEdit" (click)="removePartiePrenante(p)">Retirer</button>
          </li>
        </ul>
      </div>

      <!-- ── Étapes 2 à 7 : modules embarqués ─────────────────────────────── -->
      <!-- hideDiagram : dans l'assistant on ne montre que les listes/formulaires,
           les diagrammes restent sur les pages dédiées. -->
      <app-bpmn *ngIf="current.key === 'bpmn'" [hideDiagram]="true"></app-bpmn>
      <app-architecture-metier *ngIf="current.key === 'metier'" [hideDiagram]="true"></app-architecture-metier>
      <app-donnees *ngIf="current.key === 'donnees'" [hideDiagram]="true"></app-donnees>
      <app-applications *ngIf="current.key === 'applicatif'" [hideDiagram]="true"></app-applications>
      <app-technologie *ngIf="current.key === 'techno'" [hideDiagram]="true"></app-technologie>
      <app-roadmap *ngIf="current.key === 'roadmap'"></app-roadmap>

      <!-- ── Étape 8 : Synthèse ───────────────────────────────────────────── -->
      <div *ngIf="current.key === 'synthese'" class="synthese">
        <p class="muted">
          Les informations saisies dans les étapes précédentes alimentent automatiquement l'architecture
          d'entreprise. Cliquez sur « Générer » ci-dessous pour ouvrir le canevas interactif avec tous
          les éléments positionnés automatiquement — vous pourrez ensuite les déplacer et les relier librement.
        </p>
        <div class="synthese-grid">
          <a class="synthese-card" routerLink="/canevas">
            <span class="icon-badge icon-badge-warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('layers')"></svg>
            </span>
            <div>
              <strong>Canevas d'architecture</strong>
              <p class="muted">Plan de travail interactif, modifiable</p>
            </div>
          </a>
          <a class="synthese-card" routerLink="/vues">
            <span class="icon-badge icon-badge-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('layers')"></svg>
            </span>
            <div>
              <strong>Vue ArchiMate</strong>
              <p class="muted">Éléments et relations métier générés</p>
            </div>
          </a>
          <a class="synthese-card" routerLink="/organisation">
            <span class="icon-badge icon-badge-violet">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('grid')"></svg>
            </span>
            <div>
              <strong>Organigramme</strong>
              <p class="muted">Structure des services et des équipes</p>
            </div>
          </a>
          <a class="synthese-card" routerLink="/urbanisation">
            <span class="icon-badge icon-badge-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('server')"></svg>
            </span>
            <div>
              <strong>Plan d'occupation des sols</strong>
              <p class="muted">Répartition des applications par zone</p>
            </div>
          </a>
          <a class="synthese-card" routerLink="/roadmap">
            <span class="icon-badge icon-badge-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon('flag')"></svg>
            </span>
            <div>
              <strong>Roadmap</strong>
              <p class="muted">Feuille de route de transformation</p>
            </div>
          </a>
        </div>
      </div>

      <div class="step-nav">
        <button class="btn btn-outline" [disabled]="current.numero === 1" (click)="previous()">← Étape précédente</button>
        <span class="step-progress">Étape {{ current.numero }} / {{ steps.length }}</span>
        <button *ngIf="current.numero < steps.length" class="btn btn-primary" (click)="next()">Étape suivante →</button>
        <button *ngIf="current.numero === steps.length" class="btn btn-primary" (click)="goToCanevas()">Générer →</button>
      </div>
    </section>
  `,
  styles: [
    `
      .muted { color: var(--color-text-muted); font-size: 0.92rem; }
      hr { border: none; border-top: 1px solid var(--color-border); margin: 1.5rem 0; }
      .inline-form { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
      .inline-form input { padding: 0.6rem 0.75rem; border: 1px solid var(--color-border); border-radius: 8px; font: inherit; }
      .list { list-style: none; display: grid; gap: 0.5rem; }
      .list-item { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.75rem; border: 1px solid var(--color-border); border-radius: 10px; }
      .list-item .badge { margin-left: 0.5rem; }

      .stepper {
        display: flex;
        align-items: stretch;
        gap: 0;
        overflow-x: auto;
        margin-bottom: 1.5rem;
        padding: 1rem;
      }
      .step {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex: 1;
        min-width: 150px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem 0.75rem;
        border-radius: var(--radius-sm);
        position: relative;
        text-align: left;
      }
      .step:not(:last-child)::after {
        content: '';
        position: absolute;
        top: 50%;
        right: -0.5rem;
        width: 1rem;
        height: 2px;
        background: var(--color-border);
      }
      .step:hover { background: var(--color-surface); }
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
      }
      .step-circle svg { width: 16px; height: 16px; }
      .step-titre { font-size: 0.85rem; font-weight: 600; color: var(--color-text-muted); }
      .step.active .step-circle { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-light); }
      .step.active .step-titre { color: var(--color-text); }
      .step.done .step-circle { border-color: var(--color-success); color: var(--color-success); background: var(--color-success-light); }

      .step-content-header {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .step-content-header .icon-badge svg { width: 22px; height: 22px; }
      .step-content-header h3 { font-size: 1.2rem; margin-bottom: 0.25rem; }

      .step-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--color-border);
      }
      .step-progress { color: var(--color-text-muted); font-size: 0.85rem; font-weight: 600; }

      .synthese-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
      }
      .synthese-card {
        display: flex;
        align-items: center;
        gap: 0.9rem;
        padding: 1rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        text-decoration: none;
        color: inherit;
        transition: box-shadow 0.15s ease, transform 0.15s ease;
      }
      .synthese-card:hover { box-shadow: var(--shadow-sm); transform: translateY(-2px); }
      .synthese-card .icon-badge svg { width: 20px; height: 20px; }
      .synthese-card strong { display: block; margin-bottom: 0.15rem; }
    `,
  ],
})
export class WizardComponent implements OnInit {
  steps = STEPS;
  current: WizardStep = STEPS[0];

  organisation: Organisation | null = null;
  savingVision = false;
  partiesPrenantes: PartiePrenante[] = [];
  newPartie: { nom: string; role?: string } = { nom: '' };

  constructor(
    private auth: AuthService,
    private organisationService: OrganisationService,
    private partiesPrenantesService: PartiesPrenantesService,
    private toast: ToastService,
    private router: Router,
    private sanitizer: DomSanitizer,
  ) {}

  goToCanevas(): void {
    this.router.navigate(['/canevas']);
  }

  get canEdit(): boolean {
    return this.auth.hasRole('ADMINISTRATEUR', 'ARCHITECTE');
  }

  ngOnInit(): void {
    this.organisationService.getMine().subscribe({
      next: (org) => (this.organisation = org),
      error: () => this.toast.error("Impossible de charger l'organisation."),
    });
    this.partiesPrenantesService.list().subscribe({
      next: (parties) => (this.partiesPrenantes = parties),
      error: () => this.toast.error('Impossible de charger les parties prenantes.'),
    });
  }

  icon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] ?? '');
  }

  goTo(step: WizardStep): void {
    this.current = step;
  }

  stepQuestion(key: string): string | null {
    return STEP_QUESTIONS[key] ?? null;
  }

  next(): void {
    const idx = this.steps.findIndex((s) => s.key === this.current.key);
    if (idx < this.steps.length - 1) this.current = this.steps[idx + 1];
  }

  previous(): void {
    const idx = this.steps.findIndex((s) => s.key === this.current.key);
    if (idx > 0) this.current = this.steps[idx - 1];
  }

  saveVision(): void {
    if (!this.organisation) return;
    this.savingVision = true;
    this.organisationService
      .updateMine({
        vision: this.organisation.vision ?? undefined,
        problemesResoudre: this.organisation.problemesResoudre ?? undefined,
      })
      .subscribe({
        next: (org) => {
          this.organisation = org;
          this.savingVision = false;
          this.toast.success('Vision enregistrée.');
        },
        error: () => {
          this.savingVision = false;
          this.toast.error('Impossible d’enregistrer la vision.');
        },
      });
  }

  addPartiePrenante(event: Event): void {
    event.preventDefault();
    if (!this.newPartie.nom.trim()) return;
    this.partiesPrenantesService.create(this.newPartie).subscribe({
      next: (p) => {
        this.partiesPrenantes = [...this.partiesPrenantes, p];
        this.newPartie = { nom: '' };
        this.toast.success('Partie prenante ajoutée.');
      },
      error: () => this.toast.error("Impossible d'ajouter cette partie prenante."),
    });
  }

  removePartiePrenante(p: PartiePrenante): void {
    this.partiesPrenantesService.delete(p.id).subscribe({
      next: () => {
        this.partiesPrenantes = this.partiesPrenantes.filter((x) => x.id !== p.id);
        this.toast.success('Partie prenante retirée.');
      },
      error: () => this.toast.error('Impossible de retirer cette partie prenante.'),
    });
  }
}
