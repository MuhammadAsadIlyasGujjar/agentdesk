import { Injectable, computed, signal } from '@angular/core';
import {
  AGUI_CUSTOM_APPROVAL_REQUIRED,
  AgUiEvent,
  ApprovalRequiredPayload,
} from '../models/ag-ui.events';
import { TimelineItem, ToolItem } from '../models/timeline';

/**
 * EVENT ROUTER — AG-UI events ko UI state mein tarjuma karta hai.
 *
 * Ek hi `switch`. Components kabhi events nahi dekhte — sirf signals parhte
 * hain. Clean unidirectional flow, bina NgRx ke boilerplate ke.
 */
@Injectable({ providedIn: 'root' })
export class ConversationStore {
  private readonly _timeline = signal<TimelineItem[]>([]);
  private readonly _running = signal(false);
  private readonly _threadId = signal<string | null>(null);
  private readonly _error = signal<string | null>(null);
  private readonly _state = signal<Record<string, unknown>>({});

  readonly timeline = this._timeline.asReadonly();
  readonly running = this._running.asReadonly();
  readonly threadId = this._threadId.asReadonly();
  readonly error = this._error.asReadonly();
  /** Backend ka shared state (STATE_SNAPSHOT se) */
  readonly state = this._state.asReadonly();

  readonly isEmpty = computed(() => this._timeline().length === 0);
  readonly pendingApprovals = computed(
    () => this._timeline().filter((i) => i.kind === 'approval' && i.decision === 'pending').length,
  );

  /* ------------------------- user actions ------------------------- */

  addUserMessage(text: string): void {
    this.push({ kind: 'user', id: crypto.randomUUID(), text });
    this._error.set(null);
  }

  setRunning(value: boolean): void {
    this._running.set(value);
    if (!value) this.settleStreamingText();
  }

  setError(message: string): void {
    this._error.set(message);
    this._running.set(false);
    this.settleStreamingText();
  }

  markApproval(toolCallId: string, decision: 'approved' | 'rejected'): void {
    this.patch(toolCallId, (item) => (item.kind === 'approval' ? { ...item, decision } : item));
  }

  reset(): void {
    this._timeline.set([]);
    this._threadId.set(null);
    this._error.set(null);
    this._state.set({});
  }

  /** Debug helper — is turn mein kaunse tools chale */
  toolItems(): ToolItem[] {
    return this._timeline().filter((i): i is ToolItem => i.kind === 'tool');
  }

  /* ======================= THE EVENT ROUTER ======================= */

  apply(event: AgUiEvent): void {
    switch (event.type) {
      // ---------------- lifecycle ----------------
      case 'RUN_STARTED':
        this._threadId.set(event.threadId);
        this._running.set(true);
        break;

      case 'RUN_FINISHED':
        this._running.set(false);
        this.settleStreamingText();
        break;

      case 'RUN_ERROR':
        this.setError(event.message);
        break;

      // ---------------- text: start -> content* -> end ----------------
      case 'TEXT_MESSAGE_START':
        this.push({ kind: 'text', id: event.messageId, text: '', streaming: true });
        break;

      case 'TEXT_MESSAGE_CONTENT':
        this.patch(event.messageId, (i) =>
          i.kind === 'text' ? { ...i, text: i.text + event.delta } : i,
        );
        break;

      case 'TEXT_MESSAGE_END':
        this.patch(event.messageId, (i) => (i.kind === 'text' ? { ...i, streaming: false } : i));
        break;

      // ---------------- tool calls ----------------
      case 'TOOL_CALL_START':
        this.push({
          kind: 'tool',
          id: event.toolCallId,
          name: event.toolCallName,
          status: 'running',
          argsText: '',
        });
        break;

      case 'TOOL_CALL_ARGS':
        // Arguments live bharte hue dikhte hain — "progressive rendering"
        this.patch(event.toolCallId, (i) =>
          i.kind === 'tool' ? { ...i, argsText: i.argsText + event.delta } : i,
        );
        break;

      case 'TOOL_CALL_END':
        // ⚠️ Spec mein TOOL_CALL_END args nahi bhejta — hum khud deltas jod kar
        // banate hain. Bina-argument wale tools par buffer khaali hota hai,
        // isliye parse hamesha safe hona chahiye.
        this.patch(event.toolCallId, (i) =>
          i.kind === 'tool' ? { ...i, args: safeParse(i.argsText) } : i,
        );
        break;

      case 'TOOL_CALL_RESULT': {
        // Spec ke mutabiq `content` ek STRING hoti hai — UI ke liye parse karo
        const isError = event.metadata?.['isError'] === true;
        this.patch(event.toolCallId, (i) =>
          i.kind === 'tool'
            ? { ...i, status: isError ? 'error' : 'done', result: safeParse(event.content, event.content) }
            : i,
        );
        break;
      }

      // ---------------- state ----------------
      case 'STATE_SNAPSHOT':
        this._state.set((event.snapshot ?? {}) as Record<string, unknown>);
        break;

      // ---------------- escape hatch: human-in-the-loop ----------------
      case 'CUSTOM':
        if (event.name === AGUI_CUSTOM_APPROVAL_REQUIRED) {
          const p = event.value as ApprovalRequiredPayload;
          this.push({
            kind: 'approval',
            id: p.toolCallId,
            runId: p.runId,
            name: p.toolCallName,
            args: p.args ?? {},
            reason: p.reason,
            decision: 'pending',
          });
        }
        // 'run_paused' AgentSession handle karta hai (store ka kaam nahi)
        break;

      default:
        // STEP_*, STATE_DELTA, MESSAGES_SNAPSHOT, RAW — aage extend karne ki jagah
        break;
    }
  }

  /* ------------------------- internals ------------------------- */

  private push(item: TimelineItem): void {
    this._timeline.update((list) => [...list, item]);
  }

  private patch(id: string, fn: (item: TimelineItem) => TimelineItem): void {
    this._timeline.update((list) => list.map((item) => (item.id === id ? fn(item) : item)));
  }

  private settleStreamingText(): void {
    this._timeline.update((list) =>
      list.map((i) => (i.kind === 'text' && i.streaming ? { ...i, streaming: false } : i)),
    );
  }
}

/** Adhoora/khaali JSON crash na kare */
function safeParse(raw: string, fallback: unknown = {}): any {
  if (!raw || !raw.trim()) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
