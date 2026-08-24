import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

const STEPS = ['pending', 'paid', 'shipped', 'delivered'];

@Component({
  selector: 'app-order-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    @if (!order()?.found) {
      <p class="empty">{{ order()?.message ?? 'Order nahi mila.' }}</p>
    } @else {
      <div class="head">
        <strong>{{ order().orderNumber }}</strong>
        <span class="status" [class.cancelled]="cancelled()">{{ order().status }}</span>
      </div>
      <div class="who">{{ order().customerName }} · Rs {{ order().total | number }}</div>

      @if (!cancelled()) {
        <div class="track">
          @for (s of steps; track s; let i = $index) {
            <div class="step" [class.done]="i <= activeIndex()">
              <span class="dot"></span>
              <span class="label">{{ s }}</span>
            </div>
          }
        </div>
      }

      <ul class="items">
        @for (it of order().items ?? []; track it.name) {
          <li>{{ it.qty }} × {{ it.name }} <span>Rs {{ it.unitPrice | number }}</span></li>
        }
      </ul>
    }
  `,
  styles: [`
    .head { display: flex; justify-content: space-between; align-items: center; }
    .status { font-size: 11px; text-transform: uppercase; background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 999px; }
    .status.cancelled { background: #fee2e2; color: #b91c1c; }
    .who { font-size: 12px; color: #64748b; margin: 2px 0 10px; }
    .track { display: flex; gap: 4px; margin-bottom: 10px; }
    .step { flex: 1; text-align: center; }
    .dot { display: block; height: 6px; border-radius: 3px; background: #e2e8f0; margin-bottom: 4px; }
    .step.done .dot { background: #16a34a; }
    .label { font-size: 10px; color: #94a3b8; text-transform: capitalize; }
    .step.done .label { color: #16a34a; }
    .items { list-style: none; margin: 0; padding: 0; font-size: 12px; }
    .items li { display: flex; justify-content: space-between; padding: 3px 0; border-top: 1px solid #f1f5f9; }
    .empty { color: #64748b; font-size: 13px; margin: 0; }
  `],
})
export class OrderStatusComponent {
  data = input<any>();
  order = computed(() => this.data() ?? {});
  steps = STEPS;
  cancelled = computed(() => this.order().status === 'cancelled');
  activeIndex = computed(() => STEPS.indexOf(this.order().status));
}
