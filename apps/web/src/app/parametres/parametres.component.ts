import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, RoleUtilisateur } from '../auth/auth.service';
import { ToastService } from '../shared/toast.service';

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
          <img *ngIf="avatarPreview || form.avatarUrl" [src]="avatarPreview || form.avatarUrl" [alt]="user.nom" />
          <ng-container *ngIf="!avatarPreview && !form.avatarUrl">{{ initials(user.nom) }}</ng-container>
        </span>
        <dl>
          <dt>Email</dt>
          <dd>{{ user.email }}</dd>
          <dt>Rôle</dt>
          <dd>{{ roleLabel(user.role) }}</dd>
        </dl>
      </div>

      <form (submit)="save($event)">
        <div class="photo-upload">
          <button
            type="button"
            class="photo-circle"
            (click)="fileInput.click()"
            [class.has-photo]="avatarPreview || form.avatarUrl"
          >
            <img *ngIf="avatarPreview || form.avatarUrl" [src]="avatarPreview || form.avatarUrl" alt="Photo de profil" />
            <svg
              *ngIf="!avatarPreview && !form.avatarUrl"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
              <circle cx="12" cy="14" r="3.5" />
            </svg>
          </button>
          <span class="photo-label">{{ uploadingAvatar ? 'Envoi…' : 'Photo de profil' }}</span>
          <button
            type="button"
            class="link-btn"
            *ngIf="(avatarPreview || form.avatarUrl) && !uploadingAvatar"
            (click)="removeAvatar()"
          >
            Retirer la photo
          </button>
          <input
            #fileInput
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            (change)="onAvatarSelected($event)"
          />
        </div>

        <label class="field">
          Nom
          <input type="text" [value]="form.nom" (input)="form.nom = $any($event.target).value" required />
        </label>
        <button type="submit" class="btn btn-primary" [disabled]="saving || uploadingAvatar">
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

      .photo-upload { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; margin-bottom: 1.25rem; }
      .photo-circle {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: var(--color-primary);
        color: var(--color-white);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        overflow: hidden;
        flex-shrink: 0;
      }
      .photo-circle.has-photo { background: var(--color-surface); }
      .photo-circle img { width: 100%; height: 100%; object-fit: cover; }
      .photo-label { font-size: 0.75rem; color: var(--color-text-muted); font-weight: 600; }
      .link-btn {
        background: none;
        border: none;
        padding: 0;
        font: inherit;
        font-size: 0.8rem;
        color: var(--color-danger);
        cursor: pointer;
        text-decoration: underline;
      }
    `,
  ],
})
export class ParametresComponent implements OnInit {
  form: { nom: string; avatarUrl: string } = { nom: '', avatarUrl: '' };
  avatarPreview: string | null = null;
  saving = false;
  uploadingAvatar = false;

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

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.avatarPreview = URL.createObjectURL(file);
    this.uploadingAvatar = true;
    this.auth.uploadAvatar(file).subscribe({
      next: (res) => {
        this.form.avatarUrl = res.url;
        this.uploadingAvatar = false;
      },
      error: () => {
        this.uploadingAvatar = false;
        this.avatarPreview = null;
        this.toast.error("Impossible d'envoyer cette photo. Réessayez avec une image plus légère (PNG, JPEG ou WEBP, 5 Mo max).");
      },
    });
    input.value = '';
  }

  removeAvatar(): void {
    this.avatarPreview = null;
    this.form.avatarUrl = '';
  }

  save(event: Event): void {
    event.preventDefault();
    if (!this.form.nom.trim()) return;
    this.saving = true;
    // avatarUrl est envoyé même vide : une chaîne vide retire la photo côté serveur.
    this.auth
      .updateMe({ nom: this.form.nom, avatarUrl: this.form.avatarUrl })
      .subscribe({
        next: () => {
          this.saving = false;
          this.avatarPreview = null;
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
