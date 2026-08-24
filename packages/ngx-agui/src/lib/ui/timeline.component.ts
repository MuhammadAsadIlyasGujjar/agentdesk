import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AgentSession } from '../core/agent-session.service';
import { ApprovalCardComponent } from './approval-card.component';
import { ToolCardComponent } from './tool-card.component';

/**
 * Poori conversation ek component mein — user bubbles, streaming assistant
 * text, tool cards aur approval cards.
 *
 * Apna design chahiye? Isay use na karein — `session.timeline()` par khud
 * `@switch` likh lein. Ye sirf shortcut hai, majboori nahi.
 */
@Component({
  selector: 'agui-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToolCardComponent, ApprovalCardComponent],
  template: `
    @for (item of session.timeline(); track item.id) {
      @switch (item.kind) {
        @case ('user') {
          <div class="row user"><div class="bubble">{{ item.text }}</div></div>
        }
        @case ('text') {
          <div class="row bot">
            <div class="bubble">
              {{ item.text }}@if (item.streaming) {<span class="caret">▊</span>}
            </div>
          </div>
        }
        @case ('tool')     { <agui-tool-card [item]="item" /> }
        @case ('approval') { <agui-approval-card [item]="item" /> }
      }
    }

    @if (session.error(); as err) {
      <div class="agui-error">⚠️ {{ err }}</div>
    }
  `,
  styles: [`
    .row { display: flex; margin: 4px 0; }
    .row.user { justify-content: flex-end; }
    .row.bot { justify-content: flex-start; }
    .bubble { max-width: 78%; padding: 9px 13px; border-radius: 14px; font-size: 14px;
              line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
    .row.user .bubble { background: #2563eb; color: #fff; border-bottom-right-radius: 4px; }
    .row.bot .bubble { background: #fff; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px; }
    .caret { animation: agui-blink 1s steps(2) infinite; }
    @keyframes agui-blink { 50% { opacity: 0; } }
    .agui-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
                  font-size: 13px; padding: 10px; border-radius: 10px; margin-top: 8px; }
  `],
})
export class TimelineComponent {
  session = inject(AgentSession);
}
