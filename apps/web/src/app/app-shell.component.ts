import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
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

const TENANT_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Général',
    items: [
      { label: 'Tableau de bord', path: '/dashboard', icon: 'home' },
      { label: "Assistant d'architecture", path: '/assistant', icon: 'wand' },
    ],
  },
  {
    label: "Architecture d'entreprise",
    items: [
      { label: 'Organisation', path: '/organisation', icon: 'building' },
      { label: 'Stratégie', path: '/strategie', icon: 'target' },
      { label: 'Architecture métier', path: '/architecture-metier', icon: 'layers' },
      { label: 'Canevas', path: '/canevas', icon: 'canvas' },
      { label: 'Portefeuille applicatif', path: '/portefeuille-applicatif', icon: 'grid' },
      { label: 'Urbanisation', path: '/urbanisation', icon: 'map' },
      { label: 'Vues générées', path: '/vues', icon: 'eye' },
    ],
  },
  {
    label: 'Modélisation avancée',
    items: [
      { label: 'Processus (BPMN)', path: '/processus', icon: 'flow' },
      { label: 'Données', path: '/donnees', icon: 'database' },
      { label: 'Technologique', path: '/technologique', icon: 'server' },
      { label: 'Roadmap', path: '/roadmap', icon: 'flag' },
    ],
  },
  { label: 'Compte', items: [{ label: 'Paramètres', path: '/parametres', icon: 'settings' }] },
];

const SUPERADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Plateforme',
    items: [
      { label: 'Tableau de bord', path: '/admin/dashboard', icon: 'home' },
      { label: 'Entreprises', path: '/admin/organisations', icon: 'building' },
      { label: 'Utilisateurs', path: '/admin/utilisateurs', icon: 'users' },
    ],
  },
];

const ALL_NAV_GROUPS = [...TENANT_NAV_GROUPS, ...SUPERADMIN_NAV_GROUPS];

const ICON_PATHS: Record<string, string> = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M9.5 20v-6h5v6"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  layers: '<polygon points="12 3 3 8 12 13 21 8 12 3"/><polyline points="3 16 12 21 21 16"/><polyline points="3 12 12 17 21 12"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  map: '<polygon points="1 6 1 21 8 18 16 21 23 18 23 3 16 6 8 3 1 6"/><line x1="8" y1="3" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="21"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  flow: '<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7.2 7.4 10 15.5M16.8 7.4 14 15.5M7.5 6h9"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  server: '<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><line x1="7" y1="7" x2="7.01" y2="7"/><line x1="7" y1="17" x2="7.01" y2="17"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h13l-3 4 3 4H5"/>',
  wand: '<path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M15 9l-1.2-1.2M3 21l9-9M17.8 6.2 19 5"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.36 9a1.7 1.7 0 0 0 1.56 1.04H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.04Z"/>',
  chevronLeft: '<polyline points="15 18 9 12 15 6"/>',
  chevronRight: '<polyline points="9 18 15 12 9 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  canvas: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 9v12"/>',
};

const ROLE_LABEL: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  ADMINISTRATEUR: 'Administrateur',
  ARCHITECTE: 'Architecte',
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="shell" [class.sidebar-open]="sidebarOpen()" [class.collapsed]="collapsed()">
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-mark"><img src="assets/logo.png" alt="" /></span>
          <span class="brand-text">
            <span class="brand-name">ArchiVision</span>
            <span class="brand-sub">{{ auth.hasRole('SUPERADMIN') ? 'Console plateforme' : "Architecture d'entreprise" }}</span>
          </span>
        </div>

        <nav class="nav">
          <ng-container *ngFor="let group of filteredGroups(); trackBy: trackByLabel">
            <span class="nav-group-label">{{ group.label }}</span>
            <a
              *ngFor="let item of group.items; trackBy: trackByLabel"
              [routerLink]="item.path"
              routerLinkActive="active"
              [title]="item.label"
              (click)="sidebarOpen.set(false)"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="iconSvg(item.icon)"></svg>
              <span>{{ item.label }}</span>
            </a>
          </ng-container>
          <p class="nav-empty" *ngIf="filteredGroups().length === 0">Aucun module ne correspond.</p>
        </nav>

        <button type="button" class="collapse-toggle" (click)="collapsed.set(!collapsed())">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="iconSvg(collapsed() ? 'chevronRight' : 'chevronLeft')"></svg>
          <span>Réduire</span>
        </button>

        <div class="sidebar-footer" *ngIf="auth.currentUser() as user">
          <div class="user-card">
            <span class="avatar">
              <img *ngIf="user.avatarUrl" [src]="user.avatarUrl" [alt]="user.nom" />
              <ng-container *ngIf="!user.avatarUrl">{{ initials(user.nom) }}</ng-container>
            </span>
            <div class="user-info">
              <span class="user-name">{{ user.nom }}</span>
              <span class="user-email">{{ user.email }}</span>
            </div>
          </div>
          <button type="button" class="logout-btn" title="Déconnexion" (click)="logout()">
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

          <div class="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="iconSvg('search')"></svg>
            <input
              type="search"
              placeholder="Rechercher un module…"
              [value]="navSearch()"
              (input)="navSearch.set($any($event.target).value)"
            />
          </div>

          <div class="spacer"></div>
          <div class="topbar-actions" *ngIf="auth.currentUser() as user">
            <span class="badge badge-neutral">{{ roleLabel(user.role) }}</span>
            <a routerLink="/parametres" class="icon-btn" aria-label="Paramètres" *ngIf="user.role !== 'SUPERADMIN'">
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
        background: var(--color-black);
        color: #aab0c4;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        transition: width 0.2s ease;
      }
      .collapsed .sidebar { width: 84px; }
      .collapsed .brand-text,
      .collapsed .nav-group-label,
      .collapsed .nav a span:not(.sr-only),
      .collapsed .collapse-toggle span,
      .collapsed .user-info,
      .collapsed .logout-btn span {
        display: none;
      }
      .collapsed .nav a { justify-content: center; }
      .collapsed .user-card { justify-content: center; }
      .collapsed .logout-btn { justify-content: center; }

      .brand { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 0.75rem; }
      .brand-mark {
        display: inline-flex;
        width: 34px;
        height: 34px;
        border-radius: 9px;
        background: var(--color-primary);
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .brand-mark img { width: 20px; height: 20px; filter: brightness(0) invert(1); }
      .brand-text { display: flex; flex-direction: column; min-width: 0; }
      .brand-name { font-weight: 800; color: white; font-size: 0.98rem; }
      .brand-sub { font-size: 0.7rem; color: #6b7394; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .nav { display: flex; flex-direction: column; gap: 0.2rem; flex: 1; overflow-y: auto; overflow-x: hidden; }
      .nav-group-label {
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        font-weight: 800;
        color: #565d7a;
        padding: 0.9rem 0.6rem 0.3rem;
      }
      .nav-group-label:first-child { padding-top: 0.2rem; }
      .nav-empty { font-size: 0.85rem; color: #565d7a; padding: 0.5rem 0.6rem; }
      .nav a {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        color: #9aa1ba;
        text-decoration: none;
        padding: 0.6rem 0.7rem;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.9rem;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .nav a svg { flex-shrink: 0; opacity: 0.85; }
      .nav a:hover { background: rgba(255, 255, 255, 0.07); color: white; }
      .nav a.active {
        background: var(--color-white);
        color: var(--color-black);
      }
      .nav a.active svg { opacity: 1; }

      .collapse-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #8891ac;
        padding: 0.5rem;
        border-radius: 10px;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .collapse-toggle:hover { background: rgba(255, 255, 255, 0.07); color: white; }

      .sidebar-footer {
        border-top: 1px solid rgba(255, 255, 255, 0.08);
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
        background: var(--color-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 0.85rem;
        flex-shrink: 0;
        overflow: hidden;
      }
      .avatar img { width: 100%; height: 100%; object-fit: cover; }
      .user-info { display: flex; flex-direction: column; min-width: 0; }
      .user-info .user-name { font-weight: 700; font-size: 0.88rem; color: white; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .user-info .user-email { font-size: 0.76rem; color: #7c84a0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .logout-btn {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        width: 100%;
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #9aa1ba;
        padding: 0.6rem 0.7rem;
        border-radius: 10px;
        font: inherit;
        font-weight: 600;
        font-size: 0.88rem;
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
      }
      .logout-btn:hover { background: rgba(220, 38, 38, 0.16); color: #f87171; border-color: transparent; }

      .main { flex: 1; display: flex; flex-direction: column; min-width: 0; background: var(--color-surface); }
      .topbar {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        padding: 0.9rem 1.75rem;
        background: var(--color-white);
        border-bottom: 1px solid var(--color-border);
      }
      .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.92rem; flex-shrink: 0; }
      .crumb-muted { color: var(--color-text-muted); }
      .crumb-sep { color: var(--color-border); }
      .crumb-current { font-weight: 700; }
      .spacer { flex: 1; }
      .burger { display: none; background: none; border: none; font-size: 1.3rem; cursor: pointer; }

      .search-box {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        background: var(--color-surface);
        border-radius: 999px;
        padding: 0.55rem 1rem;
        color: var(--color-text-muted);
        max-width: 260px;
        flex: 1;
      }
      .search-box input {
        border: none;
        background: none;
        outline: none;
        font: inherit;
        font-size: 0.88rem;
        color: var(--color-text);
        width: 100%;
      }
      .search-box input::placeholder { color: var(--color-text-muted); }

      .topbar-actions { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
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
        .search-box { display: none; }
      }
    `,
  ],
})
export class AppShellComponent implements OnInit, OnDestroy {
  sidebarOpen = signal(false);
  collapsed = signal(false);
  pageTitle = signal('');
  navSearch = signal('');
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

  filteredGroups = computed<NavGroup[]>(() => {
    const base = this.auth.currentUser()?.role === 'SUPERADMIN' ? SUPERADMIN_NAV_GROUPS : TENANT_NAV_GROUPS;
    const term = this.navSearch().trim().toLowerCase();
    if (!term) return base;
    return base
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.label.toLowerCase().includes(term)),
      }))
      .filter((group) => group.items.length > 0);
  });

  trackByLabel(_index: number, item: { label: string }): string {
    return item.label;
  }

  private updatePageTitle(url: string): void {
    const allItems = ALL_NAV_GROUPS.flatMap((g) => g.items);
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
