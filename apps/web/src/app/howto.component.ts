import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicHeaderComponent } from './public-header.component';

@Component({
  selector: 'app-howto',
  standalone: true,
  imports: [CommonModule, PublicHeaderComponent],
  template: `
    <app-public-header />
    <main class="howto-page">
      <h2>Comment utiliser ArchiVision</h2>
      <ol>
        <li>Créez votre organisation (nom, secteur, taille, pays) — vous devenez son premier Architecte.</li>
        <li>Structurez vos services et invitez vos collègues avec le rôle adapté (Dirigeant, Représentant, Collaborateur).</li>
        <li>Définissez vos objectifs stratégiques.</li>
        <li>Modélisez vos capacités métier, éléments ArchiMate et leurs relations.</li>
        <li>Ajoutez votre portefeuille applicatif et structurez l'urbanisation (zones, quartiers, îlots).</li>
        <li>Consultez les vues générées automatiquement (ArchiMate, organigramme, plan d'occupation des sols) et exportez-les.</li>
      </ol>
    </main>
  `,
  styles: [
    `
      .howto-page { padding: 2rem 1.5rem 3rem; display: grid; gap: 1.5rem; max-width: 900px; margin: 0 auto; }
      h2 { font-size: 2.2rem; }
      ol { counter-reset: step; display: grid; gap: 1rem; }
      li {
        background: white;
        padding: 1.4rem;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
        list-style: none;
        position: relative;
        padding-left: 4rem;
        color: var(--color-text-muted);
      }
      li::before {
        counter-increment: step;
        content: counter(step);
        position: absolute;
        top: 1.25rem;
        left: 1.25rem;
        width: 2rem;
        height: 2rem;
        border-radius: 999px;
        background: var(--color-primary);
        color: white;
        display: grid;
        place-items: center;
        font-weight: 700;
      }
    `,
  ],
})
export class HowtoComponent {}
