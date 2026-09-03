import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-reinitialiser-mot-de-passe',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="auth-screen">
      <div class="auth-card" *ngIf="!token">
        <img src="assets/logo.png" alt="ArchiVision" class="logo" />
        <h1>Lien invalide</h1>
        <p class="subtitle">Ce lien de réinitialisation est incomplet.</p>
        <a routerLink="/mot-de-passe-oublie" class="btn btn-primary">Demander un nouveau lien</a>
      </div>

      <form class="auth-card" *ngIf="token" (submit)="submit($event)" novalidate>
        <img src="assets/logo.png" alt="ArchiVision" class="logo" />
        <h1>Nouveau mot de passe</h1>
        <p class="subtitle">Choisissez le nouveau mot de passe de votre compte.</p>

        <label class="field">
          Mot de passe
          <input
            type="password"
            name="password"
            placeholder="8 caractères minimum"
            [value]="password"
            (input)="password = $any($event.target).value"
            required
            minlength="8"
            autocomplete="new-password"
          />
        </label>

        <label class="field">
          Confirmer le mot de passe
          <input
            type="password"
            name="passwordConfirm"
            [value]="passwordConfirm"
            (input)="passwordConfirm = $any($event.target).value"
            required
            autocomplete="new-password"
          />
        </label>

        <p class="field-error" *ngIf="error">{{ error }}</p>

        <button type="submit" class="btn btn-primary" [disabled]="submitting">
          {{ submitting ? 'Enregistrement…' : 'Choisir ce mot de passe' }}
        </button>

        <p class="switch">
          <a routerLink="/mot-de-passe-oublie">Demander un nouveau lien</a>
        </p>
      </form>
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
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }
      .logo { width: 56px; height: 56px; border-radius: 12px; margin: 0 auto 0.5rem; }
      h1 { font-size: 1.4rem; font-weight: 800; }
      .subtitle { color: var(--color-text-muted); font-size: 0.95rem; line-height: 1.6; }
      .field { display: flex; flex-direction: column; gap: 0.35rem; text-align: left; font-size: 0.9rem; font-weight: 600; }
      .field input {
        padding: 0.7rem 0.85rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font: inherit;
        font-weight: 400;
      }
      .field-error { color: var(--color-danger); font-size: 0.85rem; }
      .btn-primary { width: 100%; padding: 0.85rem; font-size: 1rem; border-radius: var(--radius-sm); }
      .switch { margin-top: 0.25rem; text-align: center; font-size: 0.9rem; }
      .switch a { color: var(--color-primary); font-weight: 700; text-decoration: none; }
    `,
  ],
})
export class ReinitialiserMotDePasseComponent implements OnInit {
  token = '';
  password = '';
  passwordConfirm = '';
  submitting = false;
  error = '';

  constructor(private route: ActivatedRoute, private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  submit(event: Event): void {
    event.preventDefault();
    this.error = '';

    if (this.password.length < 8) {
      this.error = 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }
    if (this.password !== this.passwordConfirm) {
      this.error = 'Les deux mots de passe ne correspondent pas.';
      return;
    }

    this.submitting = true;
    this.auth.resetPassword({ token: this.token, password: this.password }).subscribe({
      next: () => {
        const isSuperAdmin = this.auth.hasRole('SUPERADMIN');
        this.router.navigate([isSuperAdmin ? '/admin' : '/dashboard']);
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.message ?? 'Ce lien a peut-être expiré. Demandez-en un nouveau.';
      },
    });
  }
}
