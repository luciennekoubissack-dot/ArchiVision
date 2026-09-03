import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, InvitationDetails, RoleUtilisateur } from './auth.service';

const ROLE_LABEL: Record<RoleUtilisateur, string> = {
  SUPERADMIN: 'Superadmin',
  ADMINISTRATEUR: 'Administrateur',
  ARCHITECTE: 'Architecte',
};

@Component({
  selector: 'app-rejoindre',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="auth-screen">
      <div class="auth-card" *ngIf="loading">
        <img src="assets/logo.png" alt="ArchiVision" class="logo" />
        <p class="subtitle">Vérification du lien d'invitation…</p>
      </div>

      <div class="auth-card" *ngIf="!loading && loadError">
        <img src="assets/logo.png" alt="ArchiVision" class="logo" />
        <h1>Lien invalide</h1>
        <p class="subtitle">{{ loadError }}</p>
        <a routerLink="/login" class="btn btn-primary">Aller à la connexion</a>
      </div>

      <form class="auth-card" *ngIf="!loading && invitation as inv" (submit)="submit($event)" novalidate>
        <img src="assets/logo.png" alt="ArchiVision" class="logo" />
        <h1>Rejoindre {{ inv.organisationNom }}</h1>
        <p class="subtitle">
          Vous êtes invité comme <strong>{{ roleLabel(inv.role) }}</strong>. Créez votre compte pour accéder à l'espace de travail.
        </p>

        <label class="field">
          Email
          <input type="email" [value]="inv.email" disabled />
        </label>

        <label class="field">
          Votre nom
          <input
            type="text"
            name="nom"
            [value]="nom"
            (input)="nom = $any($event.target).value"
            required
            autocomplete="name"
          />
        </label>

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
          {{ submitting ? 'Création…' : 'Créer mon compte' }}
        </button>
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
        max-width: 440px;
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
      .field input:disabled { background: var(--color-surface); color: var(--color-text-muted); }
      .field-error { color: var(--color-danger); font-size: 0.85rem; }
      .btn-primary { width: 100%; padding: 0.85rem; font-size: 1rem; border-radius: var(--radius-sm); }
    `,
  ],
})
export class RejoindreComponent implements OnInit {
  token = '';
  invitation: InvitationDetails | null = null;
  loading = true;
  loadError = '';

  nom = '';
  password = '';
  passwordConfirm = '';
  submitting = false;
  error = '';

  constructor(private route: ActivatedRoute, private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.loading = false;
      this.loadError = "Ce lien d'invitation est incomplet.";
      return;
    }

    this.auth.invitationDetails(this.token).subscribe({
      next: (invitation) => {
        this.invitation = invitation;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.loadError =
          err?.error?.message ?? "Ce lien d'invitation est invalide ou a expiré. Demandez un nouveau lien à votre administrateur.";
      },
    });
  }

  roleLabel(role: RoleUtilisateur): string {
    return ROLE_LABEL[role];
  }

  submit(event: Event): void {
    event.preventDefault();
    this.error = '';

    if (!this.nom.trim()) {
      this.error = 'Renseignez votre nom.';
      return;
    }
    if (this.password.length < 8) {
      this.error = 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }
    if (this.password !== this.passwordConfirm) {
      this.error = 'Les deux mots de passe ne correspondent pas.';
      return;
    }

    this.submitting = true;
    this.auth.acceptInvitation({ token: this.token, nom: this.nom.trim(), password: this.password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.message ?? "Impossible de créer le compte. Le lien a peut-être expiré.";
      },
    });
  }
}
