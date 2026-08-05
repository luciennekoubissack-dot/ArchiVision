import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicHeaderComponent } from './public-header.component';

@Component({
  selector: 'app-info',
  standalone: true,
  imports: [CommonModule, PublicHeaderComponent],
  template: `
    <app-public-header />
    <main class="info-page">
      <h2>À propos</h2>
      <p>
        ArchiVision est une plateforme de modélisation d'architecture d'entreprise
        conforme au référentiel Métier ArchiMate. Le référentiel — organisations,
        capacités, éléments métier, applications, zones d'urbanisation — est la source
        unique de vérité ; les vues sont générées à la demande, jamais dessinées à la main.
      </p>
      <section>
        <h3>Vision</h3>
        <p>
          Permettre à une organisation de documenter et de comprendre son architecture,
          et à ses membres de collaborer en interne dessus, sans passer par un éditeur
          graphique.
        </p>
      </section>
      <section>
        <h3>Modules</h3>
        <ul>
          <li>Organisation : informations, membres et rôles, services, organigramme</li>
          <li>Stratégie : objectifs de l'organisation</li>
          <li>Architecture métier : capacités, éléments ArchiMate, relations</li>
          <li>Portefeuille applicatif et urbanisation (zones, quartiers, îlots)</li>
          <li>Vues générées : ArchiMate, organigramme, plan d'occupation des sols</li>
        </ul>
      </section>
    </main>
  `,
  styles: [
    `
      .info-page { padding: 2rem 1.5rem 3rem; display: grid; gap: 1.5rem; max-width: 900px; margin: 0 auto; }
      h2 { font-size: 2.2rem; }
      ul { list-style: inside disc; line-height: 1.9; }
      p, li { color: var(--color-text-muted); }
      section { background: white; padding: 1.5rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-md); }
    `,
  ],
})
export class InfoComponent {}
