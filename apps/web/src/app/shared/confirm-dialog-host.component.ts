import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog-host',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="backdrop" *ngIf="confirmDialog.state() as state">
      <div class="dialog">
        <p>{{ state.message }}</p>
        <div class="actions">
          <button type="button" class="btn btn-ghost" (click)="confirmDialog.respond(false)">Annuler</button>
          <button type="button" class="btn btn-danger" (click)="confirmDialog.respond(true)">Confirmer</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        display: grid;
        place-items: center;
        z-index: 1100;
      }
      .dialog {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        max-width: 380px;
        width: calc(100% - 2rem);
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
      }
      .dialog p {
        margin-bottom: 1.25rem;
        line-height: 1.5;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.6rem;
      }
    `,
  ],
})
export class ConfirmDialogHostComponent {
  constructor(public confirmDialog: ConfirmDialogService) {}
}
