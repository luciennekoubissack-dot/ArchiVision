import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="public-header">
      <a routerLink="/" class="brand">
        <img src="assets/logo.png" alt="ArchiVision" />
        <span>ArchiVision</span>
      </a>
      <nav>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Accueil</a>
        <a routerLink="/about" routerLinkActive="active">À propos</a>
        <a routerLink="/howto" routerLinkActive="active">Comment utiliser</a>
        <a routerLink="/contact" routerLinkActive="active">Contact</a>
      </nav>
      <div class="header-actions">
        <a routerLink="/login" class="btn btn-outline">Se connecter</a>
        <a routerLink="/register" class="btn btn-primary">Créer mon organisation</a>
      </div>
    </header>
  `,
  styles: [
    `
      .public-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.5rem;
        background: var(--color-white);
        box-shadow: var(--shadow-sm);
        flex-wrap: wrap;
      }
      .brand { display: inline-flex; align-items: center; gap: 0.65rem; text-decoration: none; color: var(--color-black); font-weight: 800; }
      .brand img { width: 32px; height: 32px; border-radius: 6px; }
      nav { display: flex; gap: 1.25rem; flex-wrap: wrap; }
      nav a { color: var(--color-text-muted); text-decoration: none; font-weight: 600; }
      nav a.active, nav a:hover { color: var(--color-primary); }
      .header-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
    `,
  ],
})
export class PublicHeaderComponent {}
