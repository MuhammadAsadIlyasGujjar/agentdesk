import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ApiService, ProductDto } from '../../core/services/api.service';
import { CartStore } from '../../core/services/cart.store';

/** Normal CRUD page — yahan koi AI nahi.
 *  Iska maqsad: cart bharna, taake agent ka `get_cart_contents` client tool
 *  test kiya ja sake. */
@Component({
  selector: 'app-shop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="page">
      <h2>Shop</h2>
      <div class="grid">
        @for (p of products(); track p.id) {
          <div class="card">
            <div class="emoji">{{ p.emoji }}</div>
            <div class="name">{{ p.name }}</div>
            <div class="desc">{{ p.description }}</div>
            <div class="price">Rs {{ p.price | number }}</div>
            <button [disabled]="p.stock === 0" (click)="add(p)">
              {{ p.stock === 0 ? 'Out of stock' : 'Cart mein daalo' }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 20px; overflow-y: auto; height: 100%; box-sizing: border-box; }
    h2 { margin: 0 0 14px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center; }
    .emoji { font-size: 34px; }
    .name { font-weight: 600; margin: 6px 0 2px; font-size: 14px; }
    .desc { font-size: 11px; color: #64748b; min-height: 28px; }
    .price { font-weight: 700; margin: 8px 0; }
    button { width: 100%; border: 0; border-radius: 8px; padding: 8px; background: #2563eb; color: #fff; cursor: pointer; font-size: 13px; }
    button:disabled { background: #cbd5e1; cursor: default; }
  `],
})
export class ShopComponent {
  private api = inject(ApiService);
  private cart = inject(CartStore);

  products = signal<ProductDto[]>([]);

  constructor() {
    this.api.products().subscribe((rows) => this.products.set(rows));
  }

  add(p: ProductDto): void {
    this.cart.add({ productId: p.id, name: p.name, price: p.price });
  }
}
