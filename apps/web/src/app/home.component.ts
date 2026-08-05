import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicHeaderComponent } from './public-header.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicHeaderComponent],
  template: `
    <app-public-header />
    <main class="home-page">
      <section class="hero">
        <div class="hero-content">
          <img src="assets/logo.png" alt="ArchiVision logo" class="logo" />
          <h1>ArchiVision</h1>
          <p>
            Une plateforme de modélisation d'architecture d'entreprise : documentez le
            référentiel de votre organisation — capacités, éléments ArchiMate, portefeuille
            applicatif, urbanisation — et obtenez des vues générées automatiquement, jamais
            dessinées à la main.
          </p>
          <div class="hero-actions">
            <a routerLink="/register" class="btn btn-primary">Créer mon organisation</a>
            <a routerLink="/login" class="btn btn-outline">Se connecter</a>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-content">
          <h2>Comment ça marche</h2>
          <p>
            Le référentiel est la source unique de vérité : chaque capacité, application ou
            zone n'existe qu'une fois. Les diagrammes (vue ArchiMate, organigramme, plan
            d'occupation des sols) sont générés à la demande à partir de ces données —
            aucun éditeur graphique à manier.
          </p>
          <div class="feature-grid">
            <article>
              <h3>Organisation et rôles</h3>
              <p>Inscrivez votre organisation, invitez vos collègues avec un rôle adapté : Architecte, Dirigeant, Représentant ou Collaborateur.</p>
            </article>
            <article>
              <h3>Deux piliers</h3>
              <p>Architecture métier (ArchiMate, couche Métier) et urbanisation du système d'information (zones, quartiers, îlots).</p>
            </article>
          </div>
        </div>
      </section>

      <section class="section features">
        <article>
          <h3>Modélisation métier</h3>
          <p>Capacités, éléments ArchiMate et relations, organisés en quelques clics.</p>
        </article>
        <article>
          <h3>Vues générées</h3>
          <p>Vue ArchiMate, organigramme et plan d'occupation des sols, toujours à jour, exportables en SVG/PNG.</p>
        </article>
        <article>
          <h3>Urbanisation applicative</h3>
          <p>Cartographiez vos zones, applications et affectations pour piloter votre portefeuille.</p>
        </article>
      </section>
    </main>
  `,
  styles: [
    `
      .home-page { display: grid; gap: 3rem; padding: 2rem 1.5rem 3rem; }
      .hero { display: grid; gap: 2rem; align-items: center; grid-template-columns: minmax(280px, 1fr) 1.5fr; max-width: 1100px; margin: 0 auto; }
      .hero-content { display: grid; gap: 1.5rem; }
      .logo { max-width: 140px; width: 100%; display: block; }
      h1 { font-size: clamp(2.4rem, 3.6vw, 3.6rem); }
      p { color: var(--color-text-muted); max-width: 720px; line-height: 1.8; }
      .hero-actions { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 0.5rem; }
      .section { padding: 2rem 0; border-top: 1px solid var(--color-border); max-width: 1100px; margin: 0 auto; width: 100%; }
      .section-content { display: grid; gap: 1rem; }
      .feature-grid { display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 1rem; }
      .feature-grid article { padding: 1.35rem; border-radius: var(--radius-lg); background: var(--color-surface); border: 1px solid var(--color-border); }
      .section h2 { font-size: 1.8rem; margin-bottom: 0.75rem; }
      .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; max-width: 1100px; margin: 0 auto; }
      .features article { padding: 1.6rem; border-radius: var(--radius-lg); background: white; box-shadow: var(--shadow-md); }
      .features h3 { margin-bottom: 0.6rem; }

      @media (max-width: 860px) {
        .hero { grid-template-columns: 1fr; text-align: center; }
        .hero-content { justify-items: center; }
        .features { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class HomeComponent {}
