import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main>
      <h1>ArchiVision</h1>
      <p>Plateforme de modélisation d'architecture d'entreprise.</p>
      <router-outlet />
    </main>
  `,
  styles: [`
    main {
      padding: 2rem;
    }
  `],
})
export class AppComponent {
  title = 'ArchiVision';
}
