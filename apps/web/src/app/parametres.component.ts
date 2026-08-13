import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, RoleUtilisateur } from './auth.service';
import { ToastService } from './toast.service';

const ROLE_LABEL: Record<RoleUtilisateur, string> = {
  SUPERADMIN: 'Superadmin',
  ADMINISTRATEUR: 'Administrateur',
  ARCHITECTE: 'Architecte',
};

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card" *ngIf="auth.currentUser() as user">
      <h3>Mon profil</h3>

      <div class="profile-row">
        <span class="avatar-preview">
          <img *ngIf="form.avatarUrl" [src]="form.avatarUrl" [alt]="user.nom" />
          <ng-container *ngIf="!form.avatarUrl">{{ initials(user.nom) }}</ng-container>
        </span>
        <dl>
          <dt>Email</dt>
          <dd>{{ user.email }}</dd>
          <dt>Rôle</dt>
          <dd>{{ roleLabel(user.role) }}</dd>
        </dl>
      </div>

      <form (submit)="save($event)">
        <label class="field">
          Nom
          <input type="text" [value]="form.nom" (input)="form.nom = $any($event.target).value" required />
        </label>
        <label class="field">
          Photo de profil (URL)
          <input
            type="text"
            placeholder="https://…"
            [value]="form.avatarUrl"
            (input)="form.avatarUrl = $any($event.target).value"
          />
        </label>
        <button type="submit" class="btn btn-primary" [disabled]="saving">
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </form>

      <hr />
      <button type="button" class="btn btn-danger" (click)="logout()">Se déconnecter</button>
    </section>
  `,
  styles: [
    `
      .profile-row { display: flex; align-items: center; gap: 1.25rem; margin: 1.25rem 0 1.5rem; }
      .avatar-preview {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--gradient-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 1.3rem;
        flex-shrink: 0;
        overflow: hidden;
        box-shadow: var(--shadow-glow-primary);
      }
      .avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
      dl { display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1rem; }
      dt { color: var(--color-text-muted); font-weight: 600; font-size: 0.9rem; }
      dd { font-weight: 700; }
      hr { border: none; border-top: 1px solid var(--color-border); margin: 1.5rem 0; }
    `,
  ],
})
export class ParametresComponent implements OnInit {
  form: { nom: string; avatarUrl: string } = { nom: '', avatarUrl: '' };
  saving = false;

  constructor(public auth: AuthService, private router: Router, private toast: ToastService) {}

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.form = { nom: user.nom, avatarUrl: user.avatarUrl ?? '' };
    }
  }

  roleLabel(role: RoleUtilisateur): string {
    return ROLE_LABEL[role];
  }

  initials(nom: string): string {
    const parts = nom.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  save(event: Event): void {
    event.preventDefault();
    if (!this.form.nom.trim()) return;
    this.saving = true;
    this.auth
      .updateMe({ nom: this.form.nom, avatarUrl: this.form.avatarUrl || undefined })
      .subscribe({
        next: () => {
          this.saving = false;
          this.toast.success('Profil mis à jour.');
        },
        error: () => {
          this.saving = false;
          this.toast.error('Impossible de mettre à jour le profil.');
        },
      });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
