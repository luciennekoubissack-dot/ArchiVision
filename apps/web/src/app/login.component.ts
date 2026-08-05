import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="auth-screen">
      <form class="auth-card" (submit)="login($event)" novalidate>
        <img src="assets/logo.png" alt="ArchiVision" class="logo" />
        <h1>Bon retour</h1>
        <p class="subtitle">Connectez-vous pour retrouver votre organisation.</p>

        <label class="field">
          Email
          <span class="field-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>
            <input
              type="email"
              name="email"
              placeholder="vous@entreprise.com"
              [value]="email"
              (input)="email = $any($event.target).value"
              required
              autocomplete="email"
            />
          </span>
        </label>

        <label class="field">
          Mot de passe
          <span class="field-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              [value]="password"
              (input)="password = $any($event.target).value"
              required
              autocomplete="current-password"
            />
          </span>
        </label>

        <p class="field-error" *ngIf="error">{{ error }}</p>

        <button type="submit" class="btn btn-primary" [disabled]="loading">
          {{ loading ? 'Connexion…' : 'Se connecter' }}
        </button>

        <p class="switch">
          Pas encore de compte ? <a routerLink="/register">Créer mon organisation</a>
        </p>
      </form>
    </section>
  `,
  styles: [
    `
      .auth-screen {
        position: relative;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        overflow: hidden;
        background: var(--color-black);
      }
      .auth-screen::before,
      .auth-screen::after {
        content: '';
        position: absolute;
        border-radius: 50%;
        filter: blur(70px);
        opacity: 0.55;
      }
      .auth-screen::before {
        width: 480px;
        height: 480px;
        top: -160px;
        left: -140px;
        background: radial-gradient(circle, #2f6fed, transparent 70%);
      }
      .auth-screen::after {
        width: 420px;
        height: 420px;
        bottom: -160px;
        right: -120px;
        background: radial-gradient(circle, #6d5bd0, transparent 70%);
      }
      .auth-card {
        position: relative;
        z-index: 1;
        width: 100%;
        max-width: 400px;
        background: var(--color-white);
        border-radius: var(--radius-lg);
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
        padding: 2.75rem 2.25rem;
        text-align: center;
      }
      .logo { width: 56px; height: 56px; border-radius: 14px; margin-bottom: 1rem; box-shadow: var(--shadow-glow-primary); }
      h1 { font-size: 1.6rem; font-weight: 800; }
      .subtitle { color: var(--color-text-muted); margin: 0.4rem 0 1.75rem; font-size: 0.92rem; }
      .field { text-align: left; }
      button[type='submit'] { width: 100%; margin-top: 0.5rem; padding: 0.85rem; font-size: 1rem; border-radius: var(--radius-sm); }
      .switch { margin-top: 1.5rem; text-align: center; font-size: 0.9rem; color: var(--color-text-muted); }
      .switch a { color: var(--color-primary); font-weight: 700; text-decoration: none; }
    `,
  ],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  login(event: Event): void {
    event.preventDefault();
    this.error = '';
    this.loading = true;

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.status === 401
            ? 'Email ou mot de passe incorrect.'
            : 'Impossible de se connecter. Réessayez.';
      },
    });
  }
}
