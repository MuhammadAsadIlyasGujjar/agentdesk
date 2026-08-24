import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CartStore } from '../../../core/services/cart.store';

interface ProductRow {
  id: string; name: string; price: number; emoji: string;
  category: string; rating: number; inStock: boolean;
}

/**
 * MODULE 1 / DAY 5 — structured output ka faida.
 * Tool ne jo JSON diya, uski shape pehle se tay hai — isliye yahan
 * koi parsing/guessing nahi, seedha type-safe binding.
 */
@Component({
  selector: 'app-product-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    @if (products().length === 0) {
      <p class="empty">Koi product nahi mila.</p>
    } @else {
      <div class="grid">
        @for (p of products(); track p.id) {
          <div class="card" [class.out]="!p.inStock">
            <div class="emoji">{{ p.emoji }}</div>
            <div class="name">{{ p.name }}</div>
            <div class="meta">{{ p.category }} · ⭐ {{ p.rating }}</div>
            <div class="price">Rs {{ p.price | number }}</div>
            @if (p.inStock) {
              <button (click)="add(p)">Cart mein daalo</button>
            } @else {
              <span class="badge">Out of stock</span>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; text-align: center; }
    .card.out { opacity: .55; }
    .emoji { font-size: 28px; }
    .name { font-weight: 600; font-size: 13px; margin: 4px 0; }
    .meta { font-size: 11px; color: #64748b; }
    .price { font-weight: 700; color: #0f172a; margin: 6px 0; }
    button { width: 100%; border: 0; border-radius: 6px; padding: 6px; background: #2563eb; color: #fff; cursor: pointer; font-size: 12px; }
    button:hover { background: #1d4ed8; }
    .badge { font-size: 11px; color: #b91c1c; }
    .empty { color: #64748b; font-size: 13px; margin: 0; }
  `],
})
export class ProductGridComponent {
  private cart = inject(CartStore);

  data = input<any>();
  products = computed<ProductRow[]>(() => this.data()?.products ?? []);

  add(p: ProductRow): void {
    this.cart.add({ productId: p.id, name: p.name, price: p.price });
  }
}
