import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ApiService, OrderDto } from '../../core/services/api.service';

@Component({
  selector: 'app-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, DatePipe],
  template: `
    <div class="page">
      <h2>Orders</h2>
      <table>
        <tr>
          <th>Order</th><th>Customer</th><th>Status</th><th>Items</th>
          <th class="r">Total</th><th>Date</th>
        </tr>
        @for (o of orders(); track o.id) {
          <tr>
            <td><strong>{{ o.orderNumber }}</strong></td>
            <td>{{ o.customerName }}</td>
            <td><span class="pill" [class]="o.status">{{ o.status }}</span></td>
            <td>{{ o.items.length }}</td>
            <td class="r">Rs {{ o.total | number }}</td>
            <td>{{ o.createdAt | date: 'MMM d' }}</td>
          </tr>
        }
      </table>
      <p class="hint">
        💡 Chat par jaa kar likhein: <code>order ORD-1004 cancel kar do</code> —
        approval card aayega, aur approve karne par ye table badal jayega.
      </p>
    </div>
  `,
  styles: [`
    .page { padding: 20px; overflow-y: auto; height: 100%; box-sizing: border-box; }
    h2 { margin: 0 0 14px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; font-size: 13px; }
    th { text-align: left; background: #f8fafc; color: #475569; font-weight: 500; padding: 10px; }
    td { padding: 10px; border-top: 1px solid #f1f5f9; }
    .r { text-align: right; }
    .pill { font-size: 11px; border-radius: 999px; padding: 2px 9px; background: #e2e8f0; }
    .pill.delivered { background: #dcfce7; color: #15803d; }
    .pill.cancelled { background: #fee2e2; color: #b91c1c; }
    .pill.shipped { background: #dbeafe; color: #1d4ed8; }
    .hint { font-size: 12px; color: #64748b; margin-top: 14px; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
  `],
})
export class OrdersComponent {
  private api = inject(ApiService);
  orders = signal<OrderDto[]>([]);

  constructor() {
    this.api.orders().subscribe((rows) => this.orders.set(rows));
  }
}
