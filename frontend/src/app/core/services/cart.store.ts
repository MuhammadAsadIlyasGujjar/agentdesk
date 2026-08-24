import { Injectable, computed, signal } from '@angular/core';

export interface CartLine {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

/**
 * Signals-based store.
 *
 * 🔑 YEHI wo state hai jo SERVER ke paas nahi hai — sirf browser mein hai.
 * Isi liye "cart dekho" ek CLIENT-SIDE tool banta hai, server tool nahi.
 * (MODULE 1 / DAY 2 ka core distinction, code mein.)
 */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly _lines = signal<CartLine[]>([]);

  readonly lines = this._lines.asReadonly();
  readonly count = computed(() => this._lines().reduce((n, l) => n + l.qty, 0));
  readonly total = computed(() => this._lines().reduce((n, l) => n + l.qty * l.price, 0));

  add(line: Omit<CartLine, 'qty'>, qty = 1): void {
    this._lines.update((lines) => {
      const found = lines.find((l) => l.productId === line.productId);
      if (found) {
        return lines.map((l) => (l.productId === line.productId ? { ...l, qty: l.qty + qty } : l));
      }
      return [...lines, { ...line, qty }];
    });
  }

  remove(productId: string): void {
    this._lines.update((lines) => lines.filter((l) => l.productId !== productId));
  }

  clear(): void {
    this._lines.set([]);
  }
}
