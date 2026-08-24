import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicHeaderComponent } from './public-header.component';
import { PublicFooterComponent } from './public-footer.component';

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
            Renseignez votre référentiel vision, procédures, capacités métier, données,
            applications, infrastructure  grâce à un assistant guidé, puis visualisez et
            modifiez votre architecture sur un canevas interactif : glisser-déposer, connexions
            entre les différentes couches, export en image.
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
              <p>Créez un compte, décrivez votre entreprise (secteur, taille, vision). Vous êtes connecté·e immédiatement, aucune validation à attendre.</p>
            </article>
            <article class="step-card">
              <span class="step-number">2</span>
              <h3>Suivez l'assistant</h3>
              <p>Etapes guidées vision, procédures, architecture métier, données, applicatif, technologique, roadmap .</p>
            </article>
            <article class="step-card">
              <span class="step-number">3</span>
              <h3>Générez et modifiez sur le canevas</h3>
              <p>Un clic sur « Générer » positionne automatiquement tous les éléments. Glissez-déposez, reliez-les entre eux, réorganisez librement.</p>
            </article>
          </div>
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

      <section class="section features">
        <article>
          <h3>Canevas interactif</h3>
          <p>Glissez-déposez des éléments ArchiMate, applications, composants techniques et données ; reliez-les en glissant depuis leurs points d'ancrage ; exportez en PNG.</p>
        </article>
        <article>
          <h3>Assistant TOGAF ADM</h3>
          <p>Vision, procédures (métier, support, pilotage), architecture métier, données, applicatif, technologique, roadmap — une question à chaque étape.</p>
        </article>
        <article>
          <h3>Vues générées</h3>
          <p>Vue ArchiMate, organigramme et plan d'occupation des sols, toujours à jour, exportables en SVG/PNG.</p>
        </article>
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
      .hero p { color: rgba(255, 255, 255, 0.88); max-width: 620px; line-height: 1.8; margin: 0 auto; }
      p { color: var(--color-text-muted); max-width: 720px; line-height: 1.8; }
      .hero-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; margin-top: 0.5rem; }
      .btn-on-dark { border-color: rgba(255, 255, 255, 0.65); color: var(--color-white); }
      .btn-on-dark:hover:not(:disabled) { background: rgba(255, 255, 255, 0.14); }

      .section { padding: 3.5rem 1.5rem; border-top: 1px solid var(--color-border); }
      .section-content { max-width: 1100px; margin: 0 auto; display: grid; gap: 1rem; }
      .feature-grid { display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 1rem; }
      .feature-grid article {
        padding: 1.35rem;
        border-radius: var(--radius-lg);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        transition: transform 0.25s ease, box-shadow 0.25s ease;
        animation: fadeInUp 0.6s ease both;
      }
      .feature-grid article:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
      .feature-grid article:nth-child(2) { animation-delay: 0.08s; }
      .section h2 { font-size: 1.8rem; margin-bottom: 0.75rem; }
      .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; max-width: 1100px; margin: 0 auto; }
      .features article {
        padding: 1.6rem;
        border-radius: var(--radius-lg);
        background: var(--color-white);
        border: 1px solid var(--color-border);
        transition: transform 0.25s ease, box-shadow 0.25s ease;
        animation: fadeInUp 0.6s ease both;
      }
      .features article:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
      .features article:nth-child(2) { animation-delay: 0.08s; }
      .features article:nth-child(3) { animation-delay: 0.16s; }
      .features h3 { margin-bottom: 0.6rem; }

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
        .features { grid-template-columns: 1fr; }
        .steps-grid { grid-template-columns: 1fr; }
        .feature-grid { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class HomeComponent {}
