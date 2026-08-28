import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="public-footer">
      <div class="footer-content">
        <div class="footer-brand">
          <img src="assets/logo.png" alt="" />
          <span>ArchiVision</span>
          <p>Modélisation d'architecture d'entreprise guidée, du référentiel au canevas interactif.</p>
        </div>
        <nav class="footer-links">
          <a routerLink="/about">À propos</a>
          <a routerLink="/howto">Comment utiliser</a>
          <a routerLink="/contact">Contact</a>
          <a routerLink="/login">Se connecter</a>
        </nav>
      </div>
      <div class="footer-bottom">
        <span>© {{ year }} ArchiVision. Tous droits réservés.</span>
      </div>
    </footer>
  `,
  styles: [
    `
      .public-footer {
        background: var(--color-black);
        color: #aab0c4;
        padding: 3rem 1.5rem 1.5rem;
        margin-top: 2rem;
      }
      .footer-content {
        max-width: 1100px;
        margin: 0 auto;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 2rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .footer-brand { display: flex; flex-direction: column; gap: 0.5rem; max-width: 320px; }
      .footer-brand img { width: 34px; height: 34px; }
      .footer-brand span { font-weight: 800; color: white; font-size: 1.05rem; }
      .footer-brand p { color: #7c84a0; font-size: 0.88rem; line-height: 1.6; max-width: none; }
      .footer-links { display: flex; flex-direction: column; gap: 0.75rem; }
      .footer-links a { color: #aab0c4; text-decoration: none; font-weight: 600; font-size: 0.92rem; transition: color 0.2s ease; }
      .footer-links a:hover { color: white; }
      .footer-bottom {
        max-width: 1100px;
        margin: 0 auto;
        padding-top: 1.25rem;
        font-size: 0.82rem;
        color: #6b7394;
      }
    `,
  ],
})
export class PublicFooterComponent {
  year = new Date().getFullYear();
}
