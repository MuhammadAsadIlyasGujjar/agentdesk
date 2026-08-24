import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Un tools ke liye jo "kuch karte" hain (data lane ke bajaye) —
 * jaise cancel_order. Do soortein dikhani hoti hain: kaamyab ya nakaam.
 *
 * 💡 Nakaami ko chhupana nahi chahiye. Agar server ne mana kiya
 * ("delivered order cancel nahi ho sakta") to user ko wajah dikhni chahiye —
 * warna wo samjhega kaam ho gaya.
 */
@Component({
  selector: 'app-action-result',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="action" [class.fail]="!ok()">
      <div class="head">
        <span class="icon">{{ ok() ? '✅' : '🚫' }}</span>
        <strong>{{ ok() ? 'Ho gaya' : 'Nahi ho saka' }}</strong>
        @if (d()?.orderNumber) {
          <code>{{ d().orderNumber }}</code>
        }
      </div>
      @if (message()) {
        <p class="msg">{{ message() }}</p>
      }
    </div>
  `,
  styles: [`
    .action { border-radius: 8px; padding: 10px 12px; background: #f0fdf4; border: 1px solid #bbf7d0; }
    .action.fail { background: #fef2f2; border-color: #fecaca; }
    .head { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    code { font-size: 11px; background: rgba(0,0,0,.06); padding: 1px 6px; border-radius: 4px; }
    .msg { margin: 6px 0 0; font-size: 12px; color: #475569; }
  `],
})
export class ActionResultComponent {
  data = input<any>();

  d = computed(() => this.data() ?? {});
  ok = computed(() => this.d().cancelled === true || this.d().success === true);
  message = computed(() => this.d().message ?? this.d().reason ?? null);
}
