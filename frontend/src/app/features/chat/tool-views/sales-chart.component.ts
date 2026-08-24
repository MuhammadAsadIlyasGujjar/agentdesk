import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

interface Row { label: string; value: number; count: number }

/**
 * Chart ke liye koi library nahi — bas CSS bars.
 * Point ye hai ki tool ka STRUCTURED result seedha visual ban jata hai.
 */
@Component({
  selector: 'app-sales-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="title">{{ data()?.title }}</div>
    @for (r of rows(); track r.label) {
      <div class="row">
        <div class="label">{{ r.label }}</div>
        <div class="track">
          <div class="bar" [style.width.%]="pct(r)"></div>
        </div>
        <div class="value">Rs {{ r.value | number }}</div>
      </div>
    }
  `,
  styles: [`
    .title { font-weight: 600; font-size: 13px; margin-bottom: 8px; }
    .row { display: grid; grid-template-columns: 90px 1fr 90px; align-items: center; gap: 8px; margin-bottom: 5px; }
    .label { font-size: 12px; color: #475569; text-transform: capitalize; }
    .track { background: #f1f5f9; border-radius: 4px; height: 16px; }
    .bar { background: linear-gradient(90deg, #3b82f6, #6366f1); height: 100%; border-radius: 4px; min-width: 2px; }
    .value { font-size: 11px; text-align: right; color: #0f172a; }
  `],
})
export class SalesChartComponent {
  data = input<any>();
  rows = computed<Row[]>(() => this.data()?.rows ?? []);
  private max = computed(() => Math.max(1, ...this.rows().map((r) => r.value)));

  pct(r: Row): number {
    return Math.round((r.value / this.max()) * 100);
  }
}
