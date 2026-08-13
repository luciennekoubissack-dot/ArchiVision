import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TypeElement } from './archimate.service';
import { TypeTechComponent } from './technologie.service';
import { ElementKind } from './canevas.service';

export const CANEVAS_DRAG_MIME = 'application/x-archivision-type-element';

export interface CanevasDragPayload {
  kind: ElementKind;
  type?: TypeElement | TypeTechComponent;
}

export const TYPE_ELEMENT_LABEL: Record<TypeElement, string> = {
  VISION: 'Vision',
  OBJECTIF_ARCHIMATE: "Objectif d'architecture",
  PRINCIPE: 'Principe',
  EXIGENCE: 'Exigence',
  ACTEUR_METIER: 'Acteur métier',
  ROLE_METIER: 'Rôle métier',
  PROCESSUS_METIER: 'Processus métier',
  SERVICE_METIER: 'Service métier',
  OBJET_METIER: 'Objet métier',
};

export const TYPE_TECH_COMPONENT_LABEL: Record<TypeTechComponent, string> = {
  SERVEUR: 'Serveur',
  RESEAU: 'Réseau',
  CLOUD: 'Cloud',
  BASE_DE_DONNEES: 'Base de données',
  MIDDLEWARE: 'Middleware',
};

export const MOTIVATION_TYPES: TypeElement[] = ['VISION', 'OBJECTIF_ARCHIMATE', 'PRINCIPE', 'EXIGENCE'];
export const METIER_TYPES: TypeElement[] = [
  'ACTEUR_METIER',
  'ROLE_METIER',
  'PROCESSUS_METIER',
  'SERVICE_METIER',
  'OBJET_METIER',
];
export const TECH_COMPONENT_TYPES: TypeTechComponent[] = ['SERVEUR', 'RESEAU', 'CLOUD', 'BASE_DE_DONNEES', 'MIDDLEWARE'];

/** Couleurs des couches non-ArchiMate (Motivation/Métier restent gérées à
 * part dans canevas.component.ts car elles partagent le même kind ARCHIMATE). */
export const LAYER_COLORS: Record<'APPLICATION' | 'TECH_COMPONENT' | 'DATA_ENTITY', { fill: string; stroke: string; text: string }> = {
  APPLICATION: { fill: '#C8E6C9', stroke: '#2E7D32', text: '#1B4A1E' },
  TECH_COMPONENT: { fill: '#BBDEFB', stroke: '#1565C0', text: '#0D3C73' },
  DATA_ENTITY: { fill: '#FFE0B2', stroke: '#E65100', text: '#8A3400' },
};

interface PaletteItem {
  kind: ElementKind;
  type?: TypeElement | TypeTechComponent;
  label: string;
  colorClass: string;
}

@Component({
  selector: 'app-canevas-palette',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="palette">
      <h3>Éléments</h3>
      <p class="muted">Glissez un élément sur le plan pour l'ajouter.</p>

      <div class="groupe" *ngFor="let groupe of groupes">
        <h4>{{ groupe.titre }}</h4>
        <div
          class="item"
          *ngFor="let item of groupe.items"
          draggable="true"
          (dragstart)="onDragStart($event, item)"
        >
          <span class="pastille" [class]="item.colorClass"></span>
          {{ item.label }}
        </div>
      </div>
    </aside>
  `,
  styles: [
    `
      .palette {
        width: 260px;
        flex-shrink: 0;
        background: var(--color-white);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        padding: 1.25rem;
        align-self: flex-start;
      }
      h3 {
        margin: 0 0 0.25rem;
      }
      .muted {
        color: var(--color-text-muted);
        font-size: 0.82rem;
        margin: 0 0 1rem;
      }
      .groupe {
        margin-bottom: 1.25rem;
      }
      .groupe h4 {
        margin: 0 0 0.5rem;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--color-text-muted);
      }
      .item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.55rem 0.6rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        margin-bottom: 0.4rem;
        cursor: grab;
        font-size: 0.88rem;
        background: var(--color-surface);
        user-select: none;
      }
      .item:active {
        cursor: grabbing;
      }
      .pastille {
        width: 10px;
        height: 10px;
        border-radius: 3px;
        flex-shrink: 0;
      }
      .pastille-motivation {
        background: #e6e6fa;
        border: 1.5px solid #7a6fbe;
      }
      .pastille-metier {
        background: #ffffb3;
        border: 1.5px solid #c6a700;
      }
      .pastille-application {
        background: #c8e6c9;
        border: 1.5px solid #2e7d32;
      }
      .pastille-tech {
        background: #bbdefb;
        border: 1.5px solid #1565c0;
      }
      .pastille-donnee {
        background: #ffe0b2;
        border: 1.5px solid #e65100;
      }
    `,
  ],
})
export class CanevasPaletteComponent {
  groupes: { titre: string; items: PaletteItem[] }[] = [
    {
      titre: 'Motivation',
      items: MOTIVATION_TYPES.map((type) => ({
        kind: 'ARCHIMATE',
        type,
        label: TYPE_ELEMENT_LABEL[type],
        colorClass: 'pastille-motivation',
      })),
    },
    {
      titre: 'Métier',
      items: METIER_TYPES.map((type) => ({
        kind: 'ARCHIMATE',
        type,
        label: TYPE_ELEMENT_LABEL[type],
        colorClass: 'pastille-metier',
      })),
    },
    {
      titre: 'Applicatif',
      items: [{ kind: 'APPLICATION', label: 'Application', colorClass: 'pastille-application' }],
    },
    {
      titre: 'Technologique',
      items: TECH_COMPONENT_TYPES.map((type) => ({
        kind: 'TECH_COMPONENT',
        type,
        label: TYPE_TECH_COMPONENT_LABEL[type],
        colorClass: 'pastille-tech',
      })),
    },
    {
      titre: 'Données',
      items: [{ kind: 'DATA_ENTITY', label: 'Entité de données', colorClass: 'pastille-donnee' }],
    },
  ];

  onDragStart(event: DragEvent, item: PaletteItem): void {
    const payload: CanevasDragPayload = { kind: item.kind, type: item.type };
    event.dataTransfer?.setData(CANEVAS_DRAG_MIME, JSON.stringify(payload));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
  }
}
