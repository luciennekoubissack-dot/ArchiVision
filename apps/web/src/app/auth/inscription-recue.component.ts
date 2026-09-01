import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inscription-recue',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="auth-screen">
      <div class="auth-card">
        <img src="assets/logo.png" alt="ArchiVision" class="logo" />
        <div class="check">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h1>Inscription enregistrée</h1>
        <p class="subtitle">
          Votre organisation a bien été créée et est en attente de validation par
          l'équipe ArchiVision. Vous recevrez un e-mail contenant le lien de
          connexion dès qu'elle aura été validée.
        </p>
        <a routerLink="/" class="btn btn-primary">Retour à l'accueil</a>
        <p class="switch">
          Déjà validé ? <a routerLink="/login">Se connecter</a>
        </p>
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
        max-width: 440px;
        background: var(--color-white);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
        padding: 2.75rem 2.25rem;
        text-align: center;
      }
      .logo { width: 56px; height: 56px; border-radius: 12px; margin-bottom: 1rem; }
      .check {
        width: 56px;
        height: 56px;
        margin: 0 auto 1rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-success);
        background: var(--color-success-light);
      }
      h1 { font-size: 1.5rem; font-weight: 800; }
      .subtitle { color: var(--color-text-muted); margin: 0.6rem 0 1.75rem; font-size: 0.95rem; line-height: 1.6; }
      .btn-primary { width: 100%; padding: 0.85rem; font-size: 1rem; border-radius: var(--radius-sm); display: inline-block; text-decoration: none; }
      .switch { margin-top: 1.5rem; font-size: 0.9rem; color: var(--color-text-muted); }
      .switch a { color: var(--color-primary); font-weight: 700; text-decoration: none; }
    `,
  ],
})
export class InscriptionRecueComponent {}
