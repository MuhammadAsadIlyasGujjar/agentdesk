import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-orders-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <table>
      <tr>
        <th>Order</th><th>Customer</th><th>Status</th><th class="r">Total</th>
      </tr>
      @for (o of orders(); track o.orderNumber) {
        <tr>
          <td><strong>{{ o.orderNumber }}</strong></td>
          <td>{{ o.customerName }}</td>
          <td><span class="pill">{{ o.status }}</span></td>
          <td class="r">Rs {{ o.total | number }}</td>
        </tr>
      }
    </table>
  `,
  styles: [`
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; color: #64748b; font-weight: 500; padding-bottom: 6px; }
    td { padding: 5px 0; border-top: 1px solid #f1f5f9; }
    .r { text-align: right; }
    .pill { background: #f1f5f9; border-radius: 999px; padding: 2px 8px; font-size: 11px; }
  `],
})
export class OrdersListComponent {
  data = input<any>();
  orders = computed<any[]>(() => this.data()?.orders ?? []);
}
