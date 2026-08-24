import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { LoginComponent } from './login.component';
import { AppShellComponent } from './app-shell.component';
import { NotFoundComponent } from './not-found.component';
import { AuthGuard } from './auth.guard';
import { GuestGuard } from './guest.guard';
import { RoleGuard } from './role.guard';

const TENANT_ROLES = ['ADMINISTRATEUR', 'ARCHITECTE'];

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: 'about', loadComponent: () => import('./info.component').then((m) => m.InfoComponent) },
  { path: 'howto', loadComponent: () => import('./howto.component').then((m) => m.HowtoComponent) },
  { path: 'contact', loadComponent: () => import('./contact.component').then((m) => m.ContactComponent) },
  { path: 'login', component: LoginComponent, canActivate: [GuestGuard] },
  {
    path: 'register',
    loadComponent: () => import('./register.component').then((m) => m.RegisterComponent),
    canActivate: [GuestGuard],
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard.component').then((m) => m.DashboardComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'assistant',
        loadComponent: () => import('./wizard.component').then((m) => m.WizardComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'organisation',
        loadComponent: () => import('./organisation.component').then((m) => m.OrganisationComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      { path: 'strategie', redirectTo: 'organisation', pathMatch: 'full' },
      {
        path: 'architecture-metier',
        loadComponent: () => import('./architecture-metier.component').then((m) => m.ArchitectureMetierComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'canevas',
        loadComponent: () => import('./canevas.component').then((m) => m.CanevasComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'architecture-systeme',
        loadComponent: () => import('./applications.component').then((m) => m.ApplicationsComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'urbanisation',
        loadComponent: () => import('./urbanisation.component').then((m) => m.UrbanisationComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'vues',
        loadComponent: () => import('./vues.component').then((m) => m.VuesComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'vision',
        loadComponent: () => import('./vision.component').then((m) => m.VisionComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'donnees',
        loadComponent: () => import('./donnees.component').then((m) => m.DonneesComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'technologique',
        loadComponent: () => import('./technologie.component').then((m) => m.TechnologieComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'migration-planning',
        loadComponent: () => import('./roadmap.component').then((m) => m.RoadmapComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'mise-en-oeuvre',
        loadComponent: () => import('./mise-en-oeuvre.component').then((m) => m.MiseEnOeuvreComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'gouvernance',
        loadComponent: () => import('./gouvernance.component').then((m) => m.GouvernanceComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'evaluation',
        loadComponent: () => import('./evaluation.component').then((m) => m.EvaluationComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'analyse-ecarts',
        loadComponent: () => import('./ecarts.component').then((m) => m.EcartsComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'opportunites-solutions',
        loadComponent: () => import('./opportunites.component').then((m) => m.OpportunitesComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'parametres',
        loadComponent: () => import('./parametres.component').then((m) => m.ParametresComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
    ],
  },
  {
    path: 'admin',
    component: AppShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./admin-dashboard.component').then((m) => m.AdminDashboardComponent),
        canActivate: [RoleGuard],
        data: { roles: ['SUPERADMIN'] },
      },
      {
        path: 'organisations',
        loadComponent: () => import('./admin-organisations.component').then((m) => m.AdminOrganisationsComponent),
        canActivate: [RoleGuard],
        data: { roles: ['SUPERADMIN'] },
      },
      {
        path: 'utilisateurs',
        loadComponent: () => import('./admin-utilisateurs.component').then((m) => m.AdminUtilisateursComponent),
        canActivate: [RoleGuard],
        data: { roles: ['SUPERADMIN'] },
      },
    ],
  },
  { path: '**', component: NotFoundComponent },
];
