import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgentSession, ConfirmDialogComponent, TimelineComponent } from '@masad-ilyas-gujar/ngx-agui';

/**
 * ============================================================
 *  CHAT — poora agentic UI
 * ============================================================
 * Dhyan dein ismein kya NAHI hai:
 *   ❌ SSE parsing          ❌ event router / switch
 *   ❌ client tool dispatch  ❌ pause/resume ki logic
 *   ❌ approval handling     ❌ args buffering
 *
 * Sab kuch @masad-ilyas-gujar/ngx-agui ke `AgentSession` ke andar hai.
 * Yahan sirf aapka UI bacha hai.
 */
@Component({
  selector: 'app-chat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TimelineComponent, ConfirmDialogComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  readonly agent = inject(AgentSession);

  draft = signal('');

  readonly suggestions = [
    'laptop dikhao',
    '150000 se 220000 tak ka laptop',
    'order ORD-1003 ka status',
    'sales report banao',
    'meri cart dekho',
    'order ORD-1004 cancel kar do',
  ];

  send(): void {
    const text = this.draft().trim();
    if (!text) return;
    this.draft.set('');
    this.agent.send(text);
  }

  use(suggestion: string): void {
    this.draft.set(suggestion);
    this.send();
  }
}
