import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AgentSession } from '../core/agent-session.service';

/**
 * `registry.askConfirmation()` ka UI.
 * Jab tak user button na dabaye, us tool ka Promise latka rehta hai.
 */
@Component({
  selector: 'agui-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (session.confirmRequest(); as req) {
      <div class="agui-overlay">
        <div class="agui-dialog">
          <h4>Agent poochh raha hai</h4>
          <p>{{ req.message }}</p>
          <div class="actions">
            <button class="ok" (click)="session.answerConfirmation(true)">Haan</button>
            <button class="no" (click)="session.answerConfirmation(false)">Nahi</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .agui-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.45);
                    display: flex; align-items: center; justify-content: center; z-index: 50; }
    .agui-dialog { background: #fff; border-radius: 14px; padding: 20px; width: min(380px, 90vw); }
    h4 { margin: 0 0 6px; font-size: 14px; }
    p { margin: 0 0 16px; font-size: 14px; color: #334155; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; }
    button { border: 0; border-radius: 8px; padding: 8px 18px; cursor: pointer; font-size: 13px; }
    .ok { background: #16a34a; color: #fff; }
    .no { background: #e2e8f0; }
  `],
})
export class ConfirmDialogComponent {
  session = inject(AgentSession);
}
