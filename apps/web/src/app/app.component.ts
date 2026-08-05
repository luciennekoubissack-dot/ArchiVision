import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHostComponent } from './toast-host.component';
import { ConfirmDialogHostComponent } from './confirm-dialog-host.component';

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
export class AppComponent {}
