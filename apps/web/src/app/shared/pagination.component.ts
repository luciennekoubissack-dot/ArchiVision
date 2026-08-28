import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Pagination réutilisable pour les listes tabulaires (voir Paginated<T>). */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pager" *ngIf="totalPages > 1">
      <button type="button" class="btn btn-ghost" [disabled]="page <= 1" (click)="pageChange.emit(page - 1)">
        Précédent
      </button>
      <span class="pager-label">Page {{ page }} sur {{ totalPages }} ({{ total }} au total)</span>
      <button type="button" class="btn btn-ghost" [disabled]="page >= totalPages" (click)="pageChange.emit(page + 1)">
        Suivant
      </button>
    </div>
  `,
  styles: [
    `
      .pager { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1rem; }
      .pager-label { color: var(--color-text-muted); font-size: 0.88rem; }
    `,
  ],
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() total = 0;
  @Input() pageSize = 20;
  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }
}
