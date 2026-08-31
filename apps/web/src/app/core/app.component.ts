import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHostComponent } from '../shared/toast-host.component';
import { ConfirmDialogHostComponent } from '../shared/confirm-dialog-host.component';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastHostComponent, ConfirmDialogHostComponent],
  template: `
    <router-outlet />
    <app-toast-host />
    <app-confirm-dialog-host />
  `,
})
export class AppComponent implements OnInit {
  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    // Revalide en arrière-plan la session restaurée depuis localStorage : ne
    // bloque ni le rendu ni la navigation, se contente de corriger l'état si
    // le serveur a expiré la session ou désactivé le compte entre-temps.
    this.auth.refreshMe();
  }
}
