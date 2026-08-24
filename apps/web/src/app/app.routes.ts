import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { InfoComponent } from './info.component';
import { HowtoComponent } from './howto.component';
import { ContactComponent } from './contact.component';
import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';
import { AppShellComponent } from './app-shell.component';
import { DashboardComponent } from './dashboard.component';
import { OrganisationComponent } from './organisation.component';
import { ArchitectureMetierComponent } from './architecture-metier.component';
import { CanevasComponent } from './canevas.component';
import { ApplicationsComponent } from './applications.component';
import { UrbanisationComponent } from './urbanisation.component';
import { VuesComponent } from './vues.component';
import { ParametresComponent } from './parametres.component';
import { VisionComponent } from './vision.component';
import { EcartsComponent } from './ecarts.component';
import { DonneesComponent } from './donnees.component';
import { TechnologieComponent } from './technologie.component';
import { RoadmapComponent } from './roadmap.component';
import { OpportunitesComponent } from './opportunites.component';
import { MiseEnOeuvreComponent } from './mise-en-oeuvre.component';
import { GouvernanceComponent } from './gouvernance.component';
import { EvaluationComponent } from './evaluation.component';
import { WizardComponent } from './wizard.component';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminOrganisationsComponent } from './admin-organisations.component';
import { AdminUtilisateursComponent } from './admin-utilisateurs.component';
import { NotFoundComponent } from './not-found.component';
import { AuthGuard } from './auth.guard';
import { GuestGuard } from './guest.guard';
import { RoleGuard } from './role.guard';

const TENANT_ROLES = ['ADMINISTRATEUR', 'ARCHITECTE'];

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: 'about', component: InfoComponent },
  { path: 'howto', component: HowtoComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'login', component: LoginComponent, canActivate: [GuestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [GuestGuard] },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent, canActivate: [RoleGuard], data: { roles: TENANT_ROLES } },
      { path: 'assistant', component: WizardComponent, canActivate: [RoleGuard], data: { roles: TENANT_ROLES } },
      { path: 'organisation', component: OrganisationComponent, canActivate: [RoleGuard], data: { roles: TENANT_ROLES } },
      { path: 'strategie', redirectTo: 'organisation', pathMatch: 'full' },
      { path: 'architecture-metier', component: ArchitectureMetierComponent, canActivate: [RoleGuard], data: { roles: TENANT_ROLES } },
      { path: 'canevas', component: CanevasComponent, canActivate: [RoleGuard], data: { roles: TENANT_ROLES } },
      { path: 'architecture-systeme', component: ApplicationsComponent, canActivate: [RoleGuard], data: { roles: TENANT_ROLES } },
      { path: 'urbanisation', component: UrbanisationComponent, canActivate: [RoleGuard], data: { roles: TENANT_ROLES } },
      { path: 'vues', component: VuesComponent, canActivate: [RoleGuard], data: { roles: TENANT_ROLES } },
      { path: 'vision', component: VisionComponent, canActivate: [RoleGuard], data: { roles: TENANT_ROLES } },
      { path: 'donnees', component: DonneesComponent, canActivate: [RoleGuard], data: { roles: TENANT_ROLES } },
      { path: 'technologique', component: TechnologieComponent, canActivate: [RoleGuard], data: { roles: TENANT_ROLES } },
      { path: 'migration-planning', component: RoadmapComponent, canActivate: [RoleGuard], data: { roles: TENANT_ROLES } },
      { path: 'mise-en-oeuvre', component: MiseEnOeuvreComponent, canActivate: [RoleGuard], data: { roles: TENANT_ROLES } },
      { path: 'gouvernance', component: GouvernanceComponent, canActivate: [RoleGuard], data: { roles: TENANT_ROLES } },
      { path: 'evaluation', component: EvaluationComponent, canActivate: [RoleGuard], data: { roles: TENANT_ROLES } },
      { path: 'analyse-ecarts', component: EcartsComponent, canActivate: [RoleGuard], data: { roles: TENANT_ROLES } },
      { path: 'opportunites-solutions', component: OpportunitesComponent, canActivate: [RoleGuard], data: { roles: TENANT_ROLES } },
      { path: 'parametres', component: ParametresComponent, canActivate: [RoleGuard], data: { roles: TENANT_ROLES } },
    ],
  },
  {
    path: 'admin',
    component: AppShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: AdminDashboardComponent, canActivate: [RoleGuard], data: { roles: ['SUPERADMIN'] } },
      { path: 'organisations', component: AdminOrganisationsComponent, canActivate: [RoleGuard], data: { roles: ['SUPERADMIN'] } },
      { path: 'utilisateurs', component: AdminUtilisateursComponent, canActivate: [RoleGuard], data: { roles: ['SUPERADMIN'] } },
    ],
  },
  { path: '**', component: NotFoundComponent },
];
