import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, RoleUtilisateur } from './auth.service';

const ROLE_LABEL: Record<RoleUtilisateur, string> = {
  ARCHITECTE: 'Architecte',
  DIRIGEANT: 'Dirigeant',
  REPRESENTANT: 'Représentant',
  COLLABORATEUR: 'Collaborateur',
};

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header"><h2>Paramètres</h2></div>
    <section class="card" *ngIf="auth.currentUser() as user">
      <h3>Mon profil</h3>
      <dl>
        <dt>Nom</dt>
        <dd>{{ user.nom }}</dd>
        <dt>Email</dt>
        <dd>{{ user.email }}</dd>
        <dt>Rôle</dt>
        <dd>{{ roleLabel(user.role) }}</dd>
      </dl>
      <button type="button" class="btn btn-danger" (click)="logout()">Se déconnecter</button>
    </section>
  `,
  styles: [
    `
      dl { display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem; margin: 1.25rem 0; }
      dt { color: var(--color-text-muted); font-weight: 600; }
      dd { font-weight: 700; }
    `,
  ],
})
export class ParametresComponent {
  constructor(public auth: AuthService, private router: Router) {}

  roleLabel(role: RoleUtilisateur): string {
    return ROLE_LABEL[role];
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
