import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from './auth.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  { label: 'Général', items: [{ label: 'Tableau de bord', path: '/dashboard', icon: 'home' }] },
  {
    label: "Architecture d'entreprise",
    items: [
      { label: 'Organisation', path: '/organisation', icon: 'building' },
      { label: 'Stratégie', path: '/strategie', icon: 'target' },
      { label: 'Architecture métier', path: '/architecture-metier', icon: 'layers' },
      { label: 'Portefeuille applicatif', path: '/portefeuille-applicatif', icon: 'grid' },
      { label: 'Urbanisation', path: '/urbanisation', icon: 'map' },
      { label: 'Vues générées', path: '/vues', icon: 'eye' },
    ],
  },
  { label: 'Compte', items: [{ label: 'Paramètres', path: '/parametres', icon: 'settings' }] },
];

const ICON_PATHS: Record<string, string> = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M9.5 20v-6h5v6"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  layers: '<polygon points="12 3 3 8 12 13 21 8 12 3"/><polyline points="3 16 12 21 21 16"/><polyline points="3 12 12 17 21 12"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  map: '<polygon points="1 6 1 21 8 18 16 21 23 18 23 3 16 6 8 3 1 6"/><line x1="8" y1="3" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="21"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.36 9a1.7 1.7 0 0 0 1.56 1.04H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.04Z"/>',
};

const ROLE_LABEL: Record<string, string> = {
  ARCHITECTE: 'Architecte',
  DIRIGEANT: 'Dirigeant',
  REPRESENTANT: 'Représentant',
  COLLABORATEUR: 'Collaborateur',
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="shell" [class.sidebar-open]="sidebarOpen()">
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-mark"><img src="assets/logo.png" alt="" /></span>
          <span>ArchiVision</span>
        </div>

        <nav class="nav">
          <ng-container *ngFor="let group of navGroups">
            <span class="nav-group-label">{{ group.label }}</span>
            <a
              *ngFor="let item of group.items"
              [routerLink]="item.path"
              routerLinkActive="active"
              (click)="sidebarOpen.set(false)"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="iconSvg(item.icon)"></svg>
              <span>{{ item.label }}</span>
            </a>
          </ng-container>
        </nav>

        <div class="sidebar-footer" *ngIf="auth.currentUser() as user">
          <div class="user-card">
            <span class="avatar">{{ initials(user.nom) }}</span>
            <div class="user-info">
              <span class="user-name">{{ user.nom }}</span>
              <span class="user-email">{{ user.email }}</span>
            </div>
          </div>
          <button type="button" class="logout-btn" (click)="logout()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <button type="button" class="burger" (click)="sidebarOpen.set(!sidebarOpen())" aria-label="Menu">☰</button>
          <div class="breadcrumb">
            <span class="crumb-muted">Pages</span>
            <span class="crumb-sep">/</span>
            <span class="crumb-current">{{ pageTitle() }}</span>
          </div>
          <div class="spacer"></div>
          <div class="topbar-actions" *ngIf="auth.currentUser() as user">
            <span class="badge badge-neutral">{{ roleLabel(user.role) }}</span>
            <a routerLink="/parametres" class="icon-btn" aria-label="Paramètres">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="iconSvg('settings')"></svg>
            </a>
          </div>
        </header>

        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .shell { display: flex; min-height: 100vh; }
      .sidebar {
        width: 268px;
        background: var(--color-white);
        border-right: 1px solid var(--color-border);
        color: var(--color-text);
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .brand { display: flex; align-items: center; gap: 0.7rem; font-weight: 800; letter-spacing: 0.01em; margin-bottom: 0.75rem; }
      .brand-mark {
        display: inline-flex;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: var(--gradient-primary);
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-glow-primary);
      }
      .brand-mark img { width: 20px; height: 20px; filter: brightness(0) invert(1); }

      .nav { display: flex; flex-direction: column; gap: 0.2rem; flex: 1; overflow-y: auto; }
      .nav-group-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        font-weight: 800;
        color: var(--color-text-muted);
        padding: 0.9rem 0.6rem 0.3rem;
      }
      .nav-group-label:first-child { padding-top: 0.2rem; }
      .nav a {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        color: var(--color-text-muted);
        text-decoration: none;
        padding: 0.6rem 0.7rem;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.9rem;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .nav a svg { flex-shrink: 0; opacity: 0.8; }
      .nav a:hover { background: var(--color-surface); color: var(--color-text); }
      .nav a.active {
        background: var(--color-black);
        color: white;
        box-shadow: var(--shadow-sm);
      }
      .nav a.active svg { opacity: 1; }

      .sidebar-footer {
        border-top: 1px solid var(--color-border);
        margin-top: 0.5rem;
        padding-top: 1rem;
        display: grid;
        gap: 0.75rem;
      }
      .user-card { display: flex; align-items: center; gap: 0.65rem; }
      .avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: var(--gradient-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 0.85rem;
        flex-shrink: 0;
      }
      .user-info { display: flex; flex-direction: column; min-width: 0; }
      .user-info .user-name { font-weight: 700; font-size: 0.88rem; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .user-info .user-email { font-size: 0.76rem; color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .logout-btn {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        width: 100%;
        background: none;
        border: 1px solid var(--color-border);
        color: var(--color-text-muted);
        padding: 0.6rem 0.7rem;
        border-radius: 12px;
        font: inherit;
        font-weight: 600;
        font-size: 0.88rem;
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
      }
      .logout-btn:hover { background: var(--color-danger-light); color: var(--color-danger); border-color: var(--color-danger-light); }

      .main { flex: 1; display: flex; flex-direction: column; min-width: 0; background: var(--color-surface); }
      .topbar {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.9rem 1.75rem;
        background: var(--color-white);
        border-bottom: 1px solid var(--color-border);
      }
      .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.92rem; }
      .crumb-muted { color: var(--color-text-muted); }
      .crumb-sep { color: var(--color-border); }
      .crumb-current { font-weight: 700; }
      .spacer { flex: 1; }
      .burger { display: none; background: none; border: none; font-size: 1.3rem; cursor: pointer; }
      .topbar-actions { display: flex; align-items: center; gap: 0.75rem; }
      .icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: var(--color-surface);
        color: var(--color-text-muted);
        text-decoration: none;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .icon-btn:hover { background: var(--color-primary-light); color: var(--color-primary); }

      .content { padding: 1.75rem; flex: 1; }

      @media (max-width: 900px) {
        .sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          transform: translateX(-100%);
          transition: transform 0.2s ease;
          z-index: 50;
        }
        .sidebar-open .sidebar { transform: translateX(0); }
        .burger { display: inline-block; }
      }
    `,
  ],
})
export class AppShellComponent implements OnInit, OnDestroy {
  navGroups = NAV_GROUPS;
  sidebarOpen = signal(false);
  pageTitle = signal('');
  private iconCache = new Map<string, SafeHtml>();
  private routerSub?: Subscription;

  constructor(public auth: AuthService, private router: Router, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.updatePageTitle(this.router.url);
    this.routerSub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.updatePageTitle((e as NavigationEnd).urlAfterRedirects);
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private updatePageTitle(url: string): void {
    const allItems = this.navGroups.flatMap((g) => g.items);
    const match = allItems.find((item) => url.startsWith(item.path));
    this.pageTitle.set(match?.label ?? '');
  }

  iconSvg(icon: string): SafeHtml {
    let cached = this.iconCache.get(icon);
    if (!cached) {
      cached = this.sanitizer.bypassSecurityTrustHtml(ICON_PATHS[icon] ?? '');
      this.iconCache.set(icon, cached);
    }
    return cached;
  }

  roleLabel(role: string): string {
    return ROLE_LABEL[role] ?? role;
  }

  initials(nom: string): string {
    const parts = nom.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
