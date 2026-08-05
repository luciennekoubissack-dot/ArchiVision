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
import { ObjectifsComponent } from './objectifs.component';
import { ArchitectureMetierComponent } from './architecture-metier.component';
import { ApplicationsComponent } from './applications.component';
import { UrbanisationComponent } from './urbanisation.component';
import { VuesComponent } from './vues.component';
import { ParametresComponent } from './parametres.component';
import { NotFoundComponent } from './not-found.component';
import { AuthGuard } from './auth.guard';
import { GuestGuard } from './guest.guard';

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
      { path: 'dashboard', component: DashboardComponent },
      { path: 'organisation', component: OrganisationComponent },
      { path: 'strategie', component: ObjectifsComponent },
      { path: 'architecture-metier', component: ArchitectureMetierComponent },
      { path: 'portefeuille-applicatif', component: ApplicationsComponent },
      { path: 'urbanisation', component: UrbanisationComponent },
      { path: 'vues', component: VuesComponent },
      { path: 'parametres', component: ParametresComponent },
    ],
  },
  { path: '**', component: NotFoundComponent },
];
