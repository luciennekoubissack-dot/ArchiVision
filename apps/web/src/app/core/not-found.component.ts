import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="not-found">
      <h1>404</h1>
      <p>Cette page n'existe pas.</p>
      <a routerLink="/" class="btn btn-primary">Retour à l'accueil</a>
    </section>
  `,
  styles: [
    `
      .not-found {
        min-height: 60vh;
        display: grid;
        place-items: center;
        text-align: center;
        gap: 1rem;
        padding: 2rem;
      }
      h1 { font-size: 4rem; color: var(--color-primary); }
      p { color: var(--color-text-muted); }
    `,
  ],
})
export class NotFoundComponent {}
