import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { CartStore } from './core/services/cart.store';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DecimalPipe],
  template: `
    <div class="shell">
      <header>
        <div class="brand">🤖 AgentDesk</div>
        <nav>
          <a routerLink="/chat" routerLinkActive="active">Chat</a>
          <a routerLink="/shop" routerLinkActive="active">Shop</a>
          <a routerLink="/orders" routerLinkActive="active">Orders</a>
        </nav>
        <div class="cart" title="Cart sirf browser mein hai — isi liye wo ek CLIENT tool hai">
          🛒 {{ cart.count() }}
          @if (cart.count() > 0) {
            <span class="total">Rs {{ cart.total() | number }}</span>
          }
        </div>
      </header>

      <main>
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .shell { display: flex; flex-direction: column; height: 100vh; }
    header {
      display: flex; align-items: center; gap: 20px;
      padding: 0 18px; height: 54px;
      background: #0f172a; color: #fff; flex: none;
    }
    .brand { font-weight: 700; }
    nav { display: flex; gap: 4px; }
    nav a {
      color: #cbd5e1; text-decoration: none; font-size: 13px;
      padding: 6px 12px; border-radius: 8px;
    }
    nav a:hover { background: #1e293b; }
    nav a.active { background: #2563eb; color: #fff; }
    .cart { margin-left: auto; font-size: 13px; display: flex; gap: 8px; align-items: center; }
    .total { background: #1e293b; padding: 3px 8px; border-radius: 999px; font-size: 11px; }
    main { flex: 1; min-height: 0; background: #f1f5f9; }
  `],
})
export class App {
  cart = inject(CartStore);
}
