import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack">
      <div
        *ngFor="let message of toast.messages()"
        class="toast"
        [class.toast-success]="message.type === 'success'"
        [class.toast-error]="message.type === 'error'"
        [class.toast-info]="message.type === 'info'"
      >
        <span>{{ message.text }}</span>
        <button type="button" (click)="toast.dismiss(message.id)" aria-label="Fermer">×</button>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-stack {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
        display: grid;
        gap: 0.6rem;
        max-width: 360px;
      }
      .toast {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.85rem 1rem;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        font-size: 0.9rem;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
      }
      .toast-success { background: #16a34a; }
      .toast-error { background: #dc2626; }
      .toast-info { background: #0e4a86; }
      .toast button {
        background: transparent;
        border: none;
        color: inherit;
        font-size: 1.1rem;
        line-height: 1;
        cursor: pointer;
      }
    `,
  ],
})
export class ToastHostComponent {
  constructor(public toast: ToastService) {}
}
