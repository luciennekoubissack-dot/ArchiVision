import { Injectable, signal } from '@angular/core';

interface ConfirmState {
  message: string;
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly state = signal<ConfirmState | null>(null);

  confirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.state.set({ message, resolve });
    });
  }

  respond(result: boolean): void {
    const current = this.state();
    if (!current) return;
    this.state.set(null);
    current.resolve(result);
  }
}
