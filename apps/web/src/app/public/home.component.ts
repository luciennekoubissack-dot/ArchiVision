import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicHeaderComponent } from './public-header.component';
import { PublicFooterComponent } from './public-footer.component';

interface Apercu {
  src: string;
  titre: string;
  legende: string;
}

interface Module {
  titre: string;
  texte: string;
}

interface Nouveaute {
  date: string;
  titre: string;
  texte: string;
}

const APERCUS: Apercu[] = [
  {
    src: '/assets/architecture-vision-template.png',
    titre: 'Diagramme de vision',
    legende: "Cible, besoins, produit, objectifs métier : le canevas de vision est pré-rempli à partir des informations d'inscription, puis ajustable.",
  },
  {
    src: '/assets/archimate-template.png',
    titre: 'Vue ArchiMate',
    legende: 'Couches motivation et métier générées automatiquement depuis le référentiel, exportables en SVG/PNG.',
  },
  {
    src: '/assets/bpmn_exemple.jpg',
    titre: 'Diagramme BPMN',
    legende: "Décrivez les étapes d'un processus en langage naturel : une proposition de diagramme (tâches, passerelles, flux) est générée, puis éditable.",
  },
  {
    src: '/assets/diagramme-de-composant.png',
    titre: 'Diagramme de composants',
    legende: "Applications et échanges disposés automatiquement à l'ouverture de l'éditeur, réorganisables au glisser-déposer.",
  },
  {
    src: '/assets/diagramme-deploiement-template.png',
    titre: 'Diagramme de déploiement',
    legende: 'Composants techniques et artefacts applicatifs, notation UML, disposition générée puis modifiable.',
  },
  {
    src: '/assets/Organigramme.jpg',
    titre: 'Organigramme',
    legende: "Structure des services et des équipes de l'organisation, vue toujours à jour.",
  },
];

const MODULES: Module[] = [
  {
    titre: 'Vision & exigences',
    texte: "Vision d'architecture, problèmes à résoudre, parties prenantes et exigences fonctionnelles / non fonctionnelles.",
  },
  {
    titre: 'Procédures (BPMN)',
    texte: 'Processus métier, support et de pilotage. Génération d’une proposition de diagramme depuis les étapes saisies.',
  },
  {
    titre: 'Architecture métier',
    texte: 'Capacités, acteurs, rôles et éléments ArchiMate, reliés aux processus et aux objectifs.',
  },
  {
    titre: 'Architecture des données',
    texte: 'Entités, attributs et relations. Diagramme de classe généré, avec déduction des relations clé étrangère.',
  },
  {
    titre: 'Architecture applicative',
    texte: "Portefeuille d'applications, échanges, diagramme de composants et vue d'architecture applicative.",
  },
  {
    titre: 'Architecture technologique',
    texte: 'Composants d’infrastructure, déploiements et diagramme de déploiement UML.',
  },
  {
    titre: 'Canevas interactif',
    texte: 'Toutes les couches sur un même plan : glisser-déposer, connexions inter-couches, export PNG.',
  },
  {
    titre: 'Roadmap & gouvernance',
    texte: 'Feuille de route de transformation, analyse des écarts AS-IS / TO-BE, politiques et évaluations.',
  },
];

const NOUVEAUTES: Nouveaute[] = [
  {
    date: 'Septembre 2026',
    titre: 'Génération automatique des diagrammes',
    texte:
      "À la première ouverture d'un éditeur (classe, composants, architecture applicative, déploiement), l'application dispose automatiquement les éléments déjà saisis et trace les liens. Un bouton « Réorganiser le diagramme » permet de relancer la disposition à tout moment.",
  },
  {
    date: 'Septembre 2026',
    titre: 'Validation des organisations par la plateforme',
    texte:
      "Une nouvelle organisation reste en attente jusqu'à sa vérification par l'équipe ArchiVision : nom, localisation, secteur, responsable et objectif sont contrôlés avant validation. Un e-mail contenant le lien de connexion est alors envoyé.",
  },
  {
    date: 'Septembre 2026',
    titre: 'Diagramme de vision pré-rempli',
    texte:
      "Le canevas de vision (cible, besoins, produit, objectifs métier, concurrents…) est amorcé automatiquement à partir des informations d'inscription. L'utilisateur n'a plus qu'à compléter et affiner.",
  },
  {
    date: 'Septembre 2026',
    titre: 'Inscription repensée et responsive',
    texte:
      "Le formulaire de création d'organisation regroupe les informations essentielles sur une seule étape, s'adapte au mobile et à la tablette, et n'indique une étape comme terminée que lorsque tous ses champs sont remplis.",
  },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicHeaderComponent, PublicFooterComponent],
  template: `
    <app-public-header />
    <main class="home-page">
      <section class="hero">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <span class="eyebrow">Plateforme d'architecture d'entreprise</span>
          <h1>Pensez, modélisez, faites évoluer votre architecture d'entreprise</h1>
          <p>
            ArchiVision guide votre organisation, étape par étape, de la vision stratégique
            jusqu'aux composants d'infrastructure, selon la démarche TOGAF ADM. Vous saisissez
            un référentiel unique ; l'application génère les vues, les diagrammes et un canevas
            interactif, toujours à jour.
          </p>
          <div class="hero-actions">
            <a routerLink="/register" class="btn btn-primary">Créer mon organisation</a>
            <a routerLink="/login" class="btn btn-outline btn-on-dark">Se connecter</a>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-content">
          <h2>Comment démarrer</h2>
          <p>
            Trois étapes suffisent pour passer d'une organisation vide à une architecture
            d'entreprise complète, modifiable à tout moment.
          </p>
          <div class="steps-grid">
            <article class="step-card">
              <span class="step-number">1</span>
              <h3>Inscrivez votre organisation</h3>
              <p>
                Créez un compte et décrivez votre entreprise : nom, secteur, localisation,
                responsable et objectif principal. Votre inscription est vérifiée par l'équipe
                ArchiVision, puis vous recevez un e-mail avec le lien de connexion.
              </p>
            </article>
            <article class="step-card">
              <span class="step-number">2</span>
              <h3>Suivez l'assistant</h3>
              <p>
                Étapes guidées : vision, procédures, architecture métier, données, applicatif,
                technologique et roadmap. Une question à chaque étape pour savoir quoi renseigner.
              </p>
            </article>
            <article class="step-card">
              <span class="step-number">3</span>
              <h3>Générez et modifiez</h3>
              <p>
                À l'ouverture d'un éditeur, les éléments saisis sont positionnés et reliés
                automatiquement. Glissez-déposez, ajustez les connexions, exportez en image.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section class="section apercu">
        <div class="section-content">
          <h2>Un aperçu de l'application</h2>
          <p>Les diagrammes et vues produits par ArchiVision à partir de votre référentiel.</p>
          <div class="apercu-grid">
            <figure class="shot" *ngFor="let a of apercus">
              <div class="shot-frame">
                <span class="shot-dots"><i></i><i></i><i></i></span>
                <img [src]="a.src" [alt]="a.titre" loading="lazy" />
              </div>
              <figcaption>
                <strong>{{ a.titre }}</strong>
                <span>{{ a.legende }}</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-content">
          <h2>Les modules</h2>
          <p>Un référentiel unique, décliné en huit espaces de travail complémentaires.</p>
          <div class="modules-grid">
            <article class="module-card" *ngFor="let m of modules">
              <h3>{{ m.titre }}</h3>
              <p>{{ m.texte }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="section nouveautes">
        <div class="section-content">
          <h2>Dernières améliorations</h2>
          <p>Ce qui a changé récemment sur la plateforme.</p>
          <ol class="timeline">
            <li *ngFor="let n of nouveautes">
              <span class="timeline-dot" aria-hidden="true"></span>
              <div class="timeline-body">
                <span class="timeline-date">{{ n.date }}</span>
                <h3>{{ n.titre }}</h3>
                <p>{{ n.texte }}</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section class="section">
        <div class="section-content">
          <h2>Organisation et rôles</h2>
          <div class="feature-grid">
            <article>
              <h3>Un référentiel unique</h3>
              <p>Chaque capacité, application, processus ou zone n'existe qu'une fois. Les vues et le canevas sont générés à la demande à partir de ces données.</p>
            </article>
            <article>
              <h3>Deux rôles simples</h3>
              <p>La personne qui inscrit l'organisation devient <strong>Administrateur</strong> ; elle peut ensuite inviter des collègues comme <strong>Architecte</strong>, avec les mêmes droits sur le référentiel.</p>
            </article>
          </div>
        </div>
      </section>

      <section class="cta">
        <div class="cta-content">
          <h2>Prêt à démarrer ?</h2>
          <p>Créez votre organisation en quelques minutes et générez votre première architecture d'entreprise.</p>
          <a routerLink="/register" class="btn btn-primary">Créer mon organisation</a>
        </div>
      </section>
    </main>
    <app-public-footer />
  `,
  styles: [
    `
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(18px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes heroDrift {
        from { transform: translate(0, 0); }
        to { transform: translate(-18px, 14px); }
      }

      .home-page { display: grid; gap: 0; }

      .hero {
        position: relative;
        isolation: isolate;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        min-height: 70vh;
        padding: 3rem 1.5rem;
        color: var(--color-white);
        background: linear-gradient(135deg, rgba(15, 20, 35, 0.78), rgba(31, 59, 179, 0.55)), url('/assets/hero.jpg') center/cover no-repeat;
        overflow: hidden;
      }
      .hero-overlay {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background:
          radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.14), transparent 40%),
          radial-gradient(circle at 85% 80%, rgba(255, 255, 255, 0.09), transparent 35%);
        animation: heroDrift 18s ease-in-out infinite alternate;
      }
      .hero-content {
        position: relative;
        z-index: 1;
        display: grid;
        gap: 1.25rem;
        justify-items: center;
        max-width: 760px;
        margin: 0 auto;
        animation: fadeInUp 0.8s ease both;
      }
      .eyebrow {
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #d7deff;
        background: rgba(255, 255, 255, 0.14);
        padding: 0.4rem 0.9rem;
        border-radius: 999px;
      }
      h1 { font-size: clamp(2.1rem, 3.6vw, 3.1rem); line-height: 1.18; }
      .hero p { color: rgba(255, 255, 255, 0.88); max-width: 640px; line-height: 1.8; margin: 0 auto; }
      p { color: var(--color-text-muted); max-width: 720px; line-height: 1.8; }
      .hero-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; margin-top: 0.5rem; }
      .btn-on-dark { border-color: rgba(255, 255, 255, 0.65); color: var(--color-white); }
      .btn-on-dark:hover:not(:disabled) { background: rgba(255, 255, 255, 0.14); }

      .section { padding: 3.5rem 1.5rem; border-top: 1px solid var(--color-border); }
      .section-content { max-width: 1100px; margin: 0 auto; display: grid; gap: 1rem; }
      .section h2 { font-size: 1.8rem; margin-bottom: 0.25rem; }

      .feature-grid { display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 1rem; }
      .feature-grid article {
        padding: 1.35rem;
        border-radius: var(--radius-lg);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        transition: transform 0.25s ease, box-shadow 0.25s ease;
      }
      .feature-grid article:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }

      /* ── Aperçu (captures) ─────────────────────────────────────────────── */
      .apercu { background: var(--color-surface); }
      .apercu-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
        margin-top: 0.75rem;
      }
      .shot {
        margin: 0;
        display: grid;
        gap: 0.75rem;
        animation: fadeInUp 0.6s ease both;
      }
      .shot-frame {
        border-radius: var(--radius-lg);
        border: 1px solid var(--color-border);
        background: var(--color-white);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
        transition: transform 0.25s ease, box-shadow 0.25s ease;
      }
      .shot-frame:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
      .shot-dots {
        display: flex;
        gap: 0.4rem;
        padding: 0.6rem 0.85rem;
        border-bottom: 1px solid var(--color-border);
        background: var(--color-surface);
      }
      .shot-dots i { width: 10px; height: 10px; border-radius: 50%; background: var(--color-border); }
      .shot-frame img { display: block; width: 100%; height: 220px; object-fit: cover; object-position: top left; background: var(--color-white); }
      .shot figcaption { display: grid; gap: 0.25rem; }
      .shot figcaption strong { font-size: 0.98rem; }
      .shot figcaption span { color: var(--color-text-muted); font-size: 0.88rem; line-height: 1.55; }

      /* ── Modules ──────────────────────────────────────────────────────── */
      .modules-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1rem;
        margin-top: 0.75rem;
      }
      .module-card {
        padding: 1.35rem;
        border-radius: var(--radius-lg);
        background: var(--color-white);
        border: 1px solid var(--color-border);
        border-top: 3px solid var(--color-primary);
        transition: transform 0.25s ease, box-shadow 0.25s ease;
      }
      .module-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
      .module-card h3 { font-size: 1.02rem; margin-bottom: 0.4rem; }
      .module-card p { font-size: 0.9rem; line-height: 1.6; max-width: none; }

      /* ── Nouveautés (timeline) ────────────────────────────────────────── */
      .nouveautes { background: var(--color-primary-light); }
      .timeline { list-style: none; padding: 0; margin: 1rem 0 0; display: grid; gap: 1.25rem; }
      .timeline li { position: relative; padding-left: 1.75rem; }
      .timeline li::before {
        content: '';
        position: absolute;
        left: 6px;
        top: 1.4rem;
        bottom: -1.25rem;
        width: 2px;
        background: rgba(31, 59, 179, 0.25);
      }
      .timeline li:last-child::before { display: none; }
      .timeline-dot {
        position: absolute;
        left: 0;
        top: 0.35rem;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--color-primary);
        box-shadow: 0 0 0 4px var(--color-white);
      }
      .timeline-body {
        background: var(--color-white);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: 1.1rem 1.25rem;
      }
      .timeline-date {
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--color-primary);
      }
      .timeline-body h3 { font-size: 1.05rem; margin: 0.2rem 0 0.4rem; }
      .timeline-body p { font-size: 0.92rem; line-height: 1.65; max-width: none; }

      .steps-grid { display: grid; grid-template-columns: repeat(3, minmax(220px, 1fr)); gap: 1.25rem; margin-top: 0.5rem; }
      .step-card {
        position: relative;
        padding: 1.6rem 1.35rem 1.35rem;
        border-radius: var(--radius-lg);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        transition: transform 0.25s ease, box-shadow 0.25s ease;
        animation: fadeInUp 0.6s ease both;
      }
      .step-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
      .step-card:nth-child(2) { animation-delay: 0.08s; }
      .step-card:nth-child(3) { animation-delay: 0.16s; }
      .step-card h3 { margin: 0.75rem 0 0.5rem; font-size: 1.05rem; }
      .step-card p { color: var(--color-text-muted); font-size: 0.92rem; line-height: 1.6; max-width: none; }
      .step-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--color-primary);
        color: var(--color-white);
        font-weight: 700;
      }

      .cta {
        padding: 3.5rem 1.5rem;
        text-align: center;
        background: var(--color-primary-light);
        border-top: 1px solid var(--color-border);
      }
      .cta-content { max-width: 640px; margin: 0 auto; display: grid; gap: 1rem; justify-items: center; }
      .cta h2 { font-size: 1.7rem; }
      .cta p { color: var(--color-text-muted); }

      @media (max-width: 860px) {
        .steps-grid { grid-template-columns: 1fr; }
        .feature-grid { grid-template-columns: 1fr; }
        .apercu-grid { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class HomeComponent {
  apercus = APERCUS;
  modules = MODULES;
  nouveautes = NOUVEAUTES;
}
