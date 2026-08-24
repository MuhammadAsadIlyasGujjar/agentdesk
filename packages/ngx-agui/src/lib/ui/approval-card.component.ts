import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgentSession } from '../core/agent-session.service';
import { ApprovalItem } from '../models/timeline';

/**
 * HUMAN-IN-THE-LOOP — high-risk tool par backend loop rok deta hai.
 *
 * 💡 "Edit & approve" sabse qeemti option hai: agent aksar 90% sahi hota hai.
 * User ko chhota fix kar ke aage barhne dena, poora reject karne se behtar hai.
 */
@Component({
  selector: 'agui-approval-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="agui-approval" [class.decided]="item().decision !== 'pending'">
      <div class="head">⚠️ Agent ko aapki ijazat chahiye</div>
      <p class="reason">{{ item().reason }}</p>

      <code class="tool">{{ item().name }}</code>

      @if (!editing()) {
        <pre>{{ argsJson() }}</pre>
      } @else {
        <textarea rows="4" [(ngModel)]="draft"></textarea>
        @if (parseError()) { <div class="err">JSON theek nahi: {{ parseError() }}</div> }
      }

      @if (item().decision === 'pending') {
        <div class="actions">
          <button class="ok" (click)="approve()">✅ Approve</button>
          <button class="no" (click)="reject()">❌ Reject</button>
          @if (!editing()) {
            <button class="edit" (click)="startEdit()">✏️ Edit &amp; approve</button>
          } @else {
            <button class="edit" (click)="saveEdit()">💾 Save &amp; approve</button>
          }
        </div>
      } @else {
        <div class="result">
          {{ item().decision === 'approved' ? '✅ Aapne approve kiya' : '❌ Aapne reject kiya' }}
        </div>
      }
    </div>
  `,
  styles: [`
    .agui-approval { border: 1px solid #fcd34d; background: #fffbeb; border-radius: 12px; padding: 12px; margin: 8px 0; }
    .agui-approval.decided { opacity: .7; }
    .head { font-weight: 600; font-size: 13px; color: #92400e; }
    .reason { font-size: 12px; color: #78350f; margin: 4px 0 8px; }
    .tool { font-size: 12px; background: #fef3c7; padding: 2px 6px; border-radius: 4px; }
    pre, textarea { width: 100%; box-sizing: border-box; font-size: 11px; background: #fff;
                    border: 1px solid #fde68a; border-radius: 6px; padding: 8px; margin-top: 6px; overflow: auto; }
    .actions { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
    button { border: 0; border-radius: 6px; padding: 6px 12px; font-size: 12px; cursor: pointer; }
    .ok { background: #16a34a; color: #fff; }
    .no { background: #dc2626; color: #fff; }
    .edit { background: #e2e8f0; color: #0f172a; }
    .result { font-size: 12px; margin-top: 8px; color: #78350f; }
    .err { color: #b91c1c; font-size: 11px; margin-top: 4px; }
  `],
})
export class ApprovalCardComponent {
  private session = inject(AgentSession);

  item = input.required<ApprovalItem>();

  editing = signal(false);
  draft = signal('');
  parseError = signal<string | null>(null);

  argsJson = computed(() => JSON.stringify(this.item().args, null, 2));

  startEdit(): void {
    this.draft.set(this.argsJson());
    this.parseError.set(null);
    this.editing.set(true);
  }

  saveEdit(): void {
    try {
      const args = JSON.parse(this.draft()) as Record<string, unknown>;
      this.parseError.set(null);
      this.editing.set(false);
      this.session.decideApproval({ toolCallId: this.item().id, approved: true, args });
    } catch (e) {
      this.parseError.set((e as Error).message);
    }
  }

  approve(): void {
    this.session.decideApproval({ toolCallId: this.item().id, approved: true, args: this.item().args });
  }

  reject(): void {
    this.session.decideApproval({
      toolCallId: this.item().id,
      approved: false,
      reason: 'User ne ijazat nahi di.',
    });
  }
}
