import { Component } from '@angular/core';

@Component({
  selector: 'app-not-found',
  template: `
    <div class="not-found">
      <h1>404</h1>
      <p>Página no encontrada</p>
      <a routerLink="/">Volver al inicio</a>
    </div>
  `,
  styles: [`
    .not-found {
      min-height: 80vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      h1 { font-size: 96px; font-weight: 900; color: var(--primary); margin: 0; }
      p { font-size: 20px; color: var(--text-muted); margin: 12px 0 28px; }
      a { padding: 12px 28px; background: var(--primary); color: white; border-radius: 10px; font-weight: 600; text-decoration: none; }
    }
  `]
})
export class NotFoundComponent {}
