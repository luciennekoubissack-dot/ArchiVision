import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/// Petite bulle d'aide contextuelle affichée à côté d'un label de champ.
/// Survol/focus révèle le texte — pas de dépendance externe.
@Component({
  selector: 'app-info-tip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="info-tip" tabindex="0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="11" x2="12" y2="16.5" />
        <circle cx="12" cy="7.75" r="0.5" fill="currentColor" stroke="none" />
      </svg>
      <span class="info-tip-bubble">{{ text }}</span>
    </span>
  `,
  styles: [
    `
      .info-tip {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-muted);
        cursor: help;
        vertical-align: middle;
        margin-left: 0.35rem;
      }
      .info-tip:hover,
      .info-tip:focus {
        color: var(--color-primary);
        outline: none;
      }
      .info-tip-bubble {
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%) translateY(4px);
        width: max-content;
        max-width: 240px;
        background: var(--color-black);
        color: var(--color-white);
        font-size: 0.78rem;
        font-weight: 500;
        line-height: 1.35;
        padding: 0.55rem 0.75rem;
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-md);
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.12s ease, transform 0.12s ease;
        z-index: 20;
      }
      .info-tip-bubble::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: var(--color-black);
      }
      .info-tip:hover .info-tip-bubble,
      .info-tip:focus .info-tip-bubble {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(0);
      }
    `,
  ],
})
export class InfoTipComponent {
  @Input({ required: true }) text!: string;
}
