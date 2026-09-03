import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-mot-de-passe-oublie',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="auth-screen">
      <form class="auth-card" *ngIf="!sent" (submit)="submit($event)" novalidate>
        <img src="assets/logo.png" alt="ArchiVision" class="logo" />
        <h1>Mot de passe oublié</h1>
        <p class="subtitle">
          Indiquez l'adresse e-mail de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe.
        </p>

        <label class="field">
          Email
          <input
            type="email"
            name="email"
            placeholder="vous@entreprise.com"
            [value]="email"
            (input)="email = $any($event.target).value"
            required
            autocomplete="email"
          />
        </label>

        <p class="field-error" *ngIf="error">{{ error }}</p>

        <button type="submit" class="btn btn-primary" [disabled]="loading">
          {{ loading ? 'Envoi…' : 'Envoyer le lien' }}
        </button>

        <p class="switch">
          <a routerLink="/login">← Retour à la connexion</a>
        </p>
      </form>

      <div class="auth-card" *ngIf="sent">
        <img src="assets/logo.png" alt="ArchiVision" class="logo" />
        <h1>E-mail envoyé</h1>
        <p class="subtitle">{{ confirmationMessage }}</p>
        <a routerLink="/login" class="btn btn-primary">Retour à la connexion</a>
      </div>
    </section>
  `,
  styles: [
    `
      .auth-screen {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: var(--color-black);
      }
      .auth-card {
        width: 100%;
        max-width: 400px;
        background: var(--color-white);
        border-radius: 8px;
        box-shadow: var(--shadow-md);
        padding: 2.75rem 2.25rem;
        text-align: center;
      }
      .logo { width: 56px; height: 56px; border-radius: 12px; margin-bottom: 1rem; }
      h1 { font-size: 1.4rem; font-weight: 800; }
      .subtitle { color: var(--color-text-muted); margin: 0.4rem 0 1.75rem; font-size: 0.92rem; line-height: 1.6; }
      .field { display: flex; flex-direction: column; gap: 0.35rem; text-align: left; font-size: 0.9rem; font-weight: 600; }
      .field input {
        padding: 0.7rem 0.85rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font: inherit;
        font-weight: 400;
      }
      .field-error { color: var(--color-danger); font-size: 0.85rem; margin-top: 0.6rem; }
      button[type='submit'] { width: 100%; margin-top: 1.25rem; padding: 0.85rem; font-size: 1rem; border-radius: var(--radius-sm); }
      .switch { margin-top: 1.5rem; text-align: center; font-size: 0.9rem; }
      .switch a { color: var(--color-primary); font-weight: 700; text-decoration: none; }
    `,
  ],
})
export class MotDePasseOublieComponent {
  email = '';
  loading = false;
  error = '';
  sent = false;
  confirmationMessage = '';

  constructor(private auth: AuthService) {}

  submit(event: Event): void {
    event.preventDefault();
    this.error = '';

    if (!this.email.trim()) {
      this.error = 'Renseignez votre adresse e-mail.';
      return;
    }

    this.loading = true;
    this.auth.forgotPassword(this.email.trim()).subscribe({
      next: (response) => {
        this.loading = false;
        this.sent = true;
        this.confirmationMessage = response.message;
      },
      error: () => {
        this.loading = false;
        this.error = "Adresse e-mail invalide.";
      },
    });
  }
}
