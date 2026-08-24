import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ClientToolRegistry } from '../core/client-tool.registry';
import { ToolItem } from '../models/timeline';
import { ToolResultHostComponent } from './tool-result-host.component';

/**
 * TRANSPARENCY — user ko live dikhna chahiye ke agent kya kar raha hai.
 *
 * "server" ya "browser" ka badge registry se aata hai, event se nahi —
 * kyunki AG-UI spec mein `side` field hai hi nahi, aur zaroorat bhi nahi:
 * client ne khud apne tools register kiye the.
 */
@Component({
  selector: 'agui-tool-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToolResultHostComponent],
  template: `
    <div class="agui-tool" [class.error]="item().status === 'error'">
      <div class="bar">
        <span>{{ icon() }}</span>
        <span class="name">{{ label() }}</span>
        <span class="side" [class.client]="isClientTool()">
          {{ isClientTool() ? 'browser' : 'server' }}
        </span>
        @if (item().status === 'running') { <span class="spin">⏳</span> }
      </div>

      @if (item().status === 'running' && item().argsText) {
        <code class="args">{{ item().argsText }}</code>
      }

      @if (item().status !== 'running') {
        <div class="body">
          <agui-tool-result [toolName]="item().name" [result]="item().result" />
        </div>
      }
    </div>
  `,
  styles: [`
    .agui-tool { border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; padding: 10px 12px; margin: 8px 0; }
    .agui-tool.error { border-color: #fecaca; background: #fef2f2; }
    .bar { display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .name { font-weight: 600; color: #334155; }
    .side { font-size: 10px; background: #e2e8f0; color: #475569; border-radius: 999px; padding: 1px 7px; }
    .side.client { background: #fef3c7; color: #92400e; }
    .spin { margin-left: auto; }
    .args { display: block; margin-top: 6px; font-size: 11px; color: #64748b; word-break: break-all; }
    .body { margin-top: 10px; }
  `],
})
export class ToolCardComponent {
  private registry = inject(ClientToolRegistry);

  item = input.required<ToolItem>();

  isClientTool = computed(() => this.registry.has(this.item().name));
  label = computed(() => this.item().name.replace(/_/g, ' '));
  icon = computed(() => {
    switch (this.item().status) {
      case 'error': return '⚠️';
      case 'done': return '✅';
      default: return '🔧';
    }
  });
}
