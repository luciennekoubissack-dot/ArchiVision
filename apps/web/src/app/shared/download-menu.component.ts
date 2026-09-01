import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DownloadFormatOption {
  value: string;
  label: string;
}

/**
 * Bouton de téléchargement unique avec menu de choix de format, pour
 * remplacer les séries de boutons "Exporter SVG" / "Exporter PNG" / etc.
 * dispersés sur les écrans de diagramme.
 */
@Component({
  selector: 'app-download-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="download-menu">
      <button
        type="button"
        class="icon-btn"
        title="Télécharger"
        [disabled]="disabled || formats.length === 0"
        (click)="toggle($event)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 21h16" />
        </svg>
      </button>
      <ul class="download-menu-list" *ngIf="open">
        <li *ngFor="let format of formats">
          <button type="button" (click)="choose(format.value)">{{ format.label }}</button>
        </li>
      </ul>
    </div>
  `,
  styles: [
    `
      .download-menu { position: relative; display: inline-flex; }
      .download-menu-list {
        position: absolute;
        top: calc(100% + 0.35rem);
        right: 0;
        z-index: 20;
        list-style: none;
        margin: 0;
        padding: 0.35rem;
        min-width: 160px;
        background: var(--color-surface, #fff);
        border: 1px solid var(--color-border);
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }
      .download-menu-list button {
        display: block;
        width: 100%;
        text-align: left;
        padding: 0.5rem 0.7rem;
        border: none;
        background: none;
        border-radius: 6px;
        font: inherit;
        cursor: pointer;
      }
      .download-menu-list button:hover { background: var(--color-hover, rgba(0, 0, 0, 0.05)); }
    `,
  ],
})
export class DownloadMenuComponent {
  @Input() formats: DownloadFormatOption[] = [];
  @Input() disabled = false;
  @Output() download = new EventEmitter<string>();

  open = false;

  constructor(private host: ElementRef<HTMLElement>) {}

  toggle(event: Event): void {
    event.stopPropagation();
    if (this.disabled || this.formats.length === 0) return;
    this.open = !this.open;
  }

  choose(value: string): void {
    this.open = false;
    this.download.emit(value);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.open && !this.host.nativeElement.contains(event.target as Node)) {
      this.open = false;
    }
  }
}
