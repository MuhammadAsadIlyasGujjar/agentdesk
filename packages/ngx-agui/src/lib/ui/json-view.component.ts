import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Default fallback — jis tool ka apna component nahi, uska data yahan */
@Component({
  selector: 'agui-json-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<pre class="agui-json">{{ pretty() }}</pre>`,
  styles: [`
    .agui-json {
      margin: 0; padding: 10px; border-radius: 8px;
      background: #0f172a; color: #94a3b8;
      font-size: 12px; max-height: 240px; overflow: auto;
    }
  `],
})
export class JsonViewComponent {
  data = input<unknown>();
  pretty = computed(() => {
    try { return JSON.stringify(this.data(), null, 2); }
    catch { return String(this.data()); }
  });
}
