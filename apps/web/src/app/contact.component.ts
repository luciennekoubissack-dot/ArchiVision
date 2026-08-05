import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicHeaderComponent } from './public-header.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, PublicHeaderComponent],
  template: `
    <app-public-header />
    <main class="contact-page">
      <h2>Contact</h2>
      <section class="card">
        <p>
          Pour toute question sur ArchiVision, contactez l'équipe du projet à
          <a href="mailto:contact&#64;archivision.local">contact&#64;archivision.local</a>.
        </p>
      </section>
    </main>
  `,
  styles: [
    `
      .contact-page { padding: 2rem 1.5rem 3rem; display: grid; gap: 1.5rem; max-width: 900px; margin: 0 auto; }
      h2 { font-size: 2.2rem; }
      p { color: var(--color-text-muted); line-height: 1.8; }
      a { color: var(--color-primary); font-weight: 700; }
    `,
  ],
})
export class ContactComponent {}
