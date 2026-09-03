import { Routes } from '@angular/router';
import { HomeComponent } from '../public/home.component';
import { LoginComponent } from '../auth/login.component';
import { AppShellComponent } from './app-shell.component';
import { NotFoundComponent } from './not-found.component';
import { AuthGuard } from '../auth/auth.guard';
import { GuestGuard } from '../auth/guest.guard';
import { RoleGuard } from '../auth/role.guard';

const TENANT_ROLES = ['ADMINISTRATEUR', 'ARCHITECTE'];

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: 'about', loadComponent: () => import('../public/info.component').then((m) => m.InfoComponent) },
  { path: 'howto', loadComponent: () => import('../public/howto.component').then((m) => m.HowtoComponent) },
  { path: 'contact', loadComponent: () => import('../public/contact.component').then((m) => m.ContactComponent) },
  { path: 'login', component: LoginComponent, canActivate: [GuestGuard] },
  {
    path: 'register',
    loadComponent: () => import('../auth/register.component').then((m) => m.RegisterComponent),
    canActivate: [GuestGuard],
  },
  {
    path: 'inscription-recue',
    loadComponent: () => import('../auth/inscription-recue.component').then((m) => m.InscriptionRecueComponent),
  },
  {
    path: 'rejoindre',
    loadComponent: () => import('../auth/rejoindre.component').then((m) => m.RejoindreComponent),
  },
  {
    path: 'mot-de-passe-oublie',
    loadComponent: () => import('../auth/mot-de-passe-oublie.component').then((m) => m.MotDePasseOublieComponent),
    canActivate: [GuestGuard],
  },
  {
    path: 'reinitialiser-mot-de-passe',
    loadComponent: () =>
      import('../auth/reinitialiser-mot-de-passe.component').then((m) => m.ReinitialiserMotDePasseComponent),
    canActivate: [GuestGuard],
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('../dashboard/dashboard.component').then((m) => m.DashboardComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'assistant',
        loadComponent: () => import('../assistant/wizard.component').then((m) => m.WizardComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'organisation',
        loadComponent: () => import('../organisation/organisation.component').then((m) => m.OrganisationComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      { path: 'strategie', redirectTo: 'organisation', pathMatch: 'full' },
      {
        path: 'architecture-metier',
        loadComponent: () => import('../architecture-metier/architecture-metier.component').then((m) => m.ArchitectureMetierComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'canevas',
        redirectTo: 'architecture-metier',
      },
      {
        path: 'architecture-systeme',
        loadComponent: () => import('../architecture-systeme/applications.component').then((m) => m.ApplicationsComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'urbanisation',
        loadComponent: () => import('../urbanisation/urbanisation.component').then((m) => m.UrbanisationComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'vues',
        loadComponent: () => import('../vues/vues.component').then((m) => m.VuesComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'vision',
        loadComponent: () => import('../vision/vision.component').then((m) => m.VisionComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'donnees',
        loadComponent: () => import('../donnees/donnees.component').then((m) => m.DonneesComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'technologique',
        loadComponent: () => import('../technologie/technologie.component').then((m) => m.TechnologieComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'migration-planning',
        loadComponent: () => import('../roadmap/roadmap.component').then((m) => m.RoadmapComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'mise-en-oeuvre',
        loadComponent: () => import('../mise-en-oeuvre/mise-en-oeuvre.component').then((m) => m.MiseEnOeuvreComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'gouvernance',
        loadComponent: () => import('../gouvernance/gouvernance.component').then((m) => m.GouvernanceComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'evaluation',
        loadComponent: () => import('../evaluation/evaluation.component').then((m) => m.EvaluationComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'analyse-ecarts',
        loadComponent: () => import('../ecarts/ecarts.component').then((m) => m.EcartsComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'opportunites-solutions',
        loadComponent: () => import('../opportunites/opportunites.component').then((m) => m.OpportunitesComponent),
        canActivate: [RoleGuard],
        data: { roles: TENANT_ROLES },
      },
      {
        path: 'parametres',
        loadComponent: () => import('../parametres/parametres.component').then((m) => m.ParametresComponent),
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
        loadComponent: () => import('../admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
        canActivate: [RoleGuard],
        data: { roles: ['SUPERADMIN'] },
      },
      {
        path: 'organisations',
        loadComponent: () => import('../admin/admin-organisations.component').then((m) => m.AdminOrganisationsComponent),
        canActivate: [RoleGuard],
        data: { roles: ['SUPERADMIN'] },
      },
      {
        path: 'utilisateurs',
        loadComponent: () => import('../admin/admin-utilisateurs.component').then((m) => m.AdminUtilisateursComponent),
        canActivate: [RoleGuard],
        data: { roles: ['SUPERADMIN'] },
      },
    ],
  },
  { path: '**', component: NotFoundComponent },
];
