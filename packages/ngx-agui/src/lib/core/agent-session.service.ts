import { Injectable, inject } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { AgUiClient } from './agui-client.service';
import { ClientToolRegistry } from './client-tool.registry';
import { ConversationStore } from './conversation.store';
import {
  AGUI_CUSTOM_APPROVAL_REQUIRED,
  AGUI_CUSTOM_RUN_PAUSED,
  AgUiEvent,
  RunPausedPayload,
  ToolOutcome,
} from '../models/ag-ui.events';
import { ApprovalDecision } from '../models/timeline';

/**
 * ============================================================
 *  AgentSession — package ka main entry point
 * ============================================================
 * Ye teen cheezein ek jagah jodta hai:
 *   AgUiClient (transport) + ConversationStore (state) + ClientToolRegistry (tools)
 *
 * Aapke component ko sirf itna chahiye:
 *
 * ```ts
 * export class ChatComponent {
 *   agent = inject(AgentSession);
 * }
 * ```
 * ```html
 * @for (item of agent.timeline(); track item.id) { ... }
 * <button (click)="agent.send(text)">Bhejo</button>
 * ```
 *
 * Client tools, pause/resume, aur approvals — sab yahan handle hote hain.
 */
@Injectable({ providedIn: 'root' })
export class AgentSession {
  private readonly client = inject(AgUiClient);
  readonly store = inject(ConversationStore);
  readonly tools = inject(ClientToolRegistry);

  /* ---- public signals (component seedha inhe parhta hai) ---- */
  readonly timeline = this.store.timeline;
  readonly running = this.store.running;
  readonly error = this.store.error;
  readonly threadId = this.store.threadId;
  readonly state = this.store.state;
  readonly isEmpty = this.store.isEmpty;
  readonly confirmRequest = this.tools.confirmRequest;

  /* ---- ek turn ki internal state ---- */
  private sub: Subscription | null = null;
  private pausedRunId: string | null = null;
  private readonly outcomes = new Map<string, ToolOutcome>();
  private readonly calls = new Map<string, { name: string; argsText: string }>();
  private clientWork: Promise<void>[] = [];
  private readonly awaitingApproval = new Set<string>();

  /* ================================================================
   *  PUBLIC API
   * ================================================================ */

  send(text: string): void {
    const message = text.trim();
    if (!message || this.running()) return;

    this.resetTurn();
    this.store.addUserMessage(message);
    this.store.setRunning(true);

    this.listen(
      this.client.runAgent({
        threadId: this.threadId(),
        message,
        clientTools: this.tools.getSchemas(),
      }),
    );
  }

  /** Stop — unsubscribe hote hi fetch abort ho jata hai */
  stop(): void {
    this.sub?.unsubscribe();
    this.sub = null;
    this.pausedRunId = null;
    this.store.setRunning(false);
  }

  reset(): void {
    this.stop();
    this.store.reset();
  }

  /** Approval card ke button se */
  decideApproval(decision: ApprovalDecision): void {
    this.store.markApproval(decision.toolCallId, decision.approved ? 'approved' : 'rejected');

    this.outcomes.set(decision.toolCallId, {
      toolCallId: decision.toolCallId,
      approved: decision.approved,
      args: decision.args,          // "Edit & approve"
      error: decision.reason,
    });

    this.awaitingApproval.delete(decision.toolCallId);
    if (this.awaitingApproval.size === 0 && this.pausedRunId) this.resume();
  }

  /** Confirm dialog ka jawab (ask_user_confirmation type tools) */
  answerConfirmation(ok: boolean): void {
    this.tools.answerConfirmation(ok);
  }

  /* ================================================================
   *  INTERNALS
   * ================================================================ */

  private listen(stream: Observable<AgUiEvent>): void {
    this.sub = stream.subscribe({
      next: (event) => this.onEvent(event),
      error: (err: Error) => this.store.setError(err.message),
      complete: () => void this.onStreamEnd(),
    });
  }

  private onEvent(event: AgUiEvent): void {
    // 1. UI update — store ka switch sab sambhal leta hai
    this.store.apply(event);

    // 2. Sirf in events par session ko khud kuch karna hota hai
    switch (event.type) {
      case 'TOOL_CALL_START':
        this.calls.set(event.toolCallId, { name: event.toolCallName, argsText: '' });
        break;

      case 'TOOL_CALL_ARGS': {
        const call = this.calls.get(event.toolCallId);
        if (call) call.argsText += event.delta;
        break;
      }

      case 'TOOL_CALL_END': {
        const call = this.calls.get(event.toolCallId);
        if (!call) break;

        // 🔑 YEHI hai client-side tools ka dil.
        // Backend ne koi khaas event nahi bheja — humne KHUD ye schema bheja
        // tha, isliye hum pehchante hain ke ye tool hamara hai.
        if (this.tools.has(call.name)) {
          this.clientWork.push(this.executeClientTool(event.toolCallId, call.name, call.argsText));
        }
        break;
      }

      case 'CUSTOM':
        if (event.name === AGUI_CUSTOM_RUN_PAUSED) {
          this.pausedRunId = (event.value as RunPausedPayload).runId;
        } else if (event.name === AGUI_CUSTOM_APPROVAL_REQUIRED) {
          const p = event.value as { toolCallId: string };
          this.awaitingApproval.add(p.toolCallId);
        }
        break;
    }
  }

  private async executeClientTool(toolCallId: string, name: string, argsText: string): Promise<void> {
    let args: Record<string, any> = {};
    try {
      if (argsText.trim()) args = JSON.parse(argsText);
    } catch {
      /* adhoore args — khaali object se chala lo */
    }

    try {
      const result = await this.tools.execute(name, args);
      this.outcomes.set(toolCallId, { toolCallId, result });
      // Card ko bhi natija dikha do
      this.store.apply({
        type: 'TOOL_CALL_RESULT',
        messageId: toolCallId,
        toolCallId,
        content: JSON.stringify(result),
      });
    } catch (err) {
      const message = (err as Error).message;
      this.outcomes.set(toolCallId, { toolCallId, error: message });
      this.store.apply({
        type: 'TOOL_CALL_RESULT',
        messageId: toolCallId,
        toolCallId,
        content: JSON.stringify({ error: message }),
        metadata: { isError: true },
      });
    }
  }

  /**
   * Stream band hui — ab teen mein se ek soorat hai:
   *   (a) turn poora ho gaya                  -> ruk jao
   *   (b) client tools chal rahe hain          -> unka intezar, phir resume
   *   (c) approval user ke click ka muntazir  -> kuch mat karo
   */
  private async onStreamEnd(): Promise<void> {
    if (!this.pausedRunId) {
      this.store.setRunning(false);
      return;
    }

    await Promise.all(this.clientWork);
    this.clientWork = [];

    if (this.awaitingApproval.size > 0) return;   // user ka intezar

    this.resume();
  }

  private resume(): void {
    const runId = this.pausedRunId;
    if (!runId) return;

    const outcomes = [...this.outcomes.values()];
    this.outcomes.clear();
    this.pausedRunId = null;
    this.store.setRunning(true);

    this.listen(
      this.client.resumeAgent({ runId, outcomes, clientTools: this.tools.getSchemas() }),
    );
  }

  private resetTurn(): void {
    this.sub?.unsubscribe();
    this.sub = null;
    this.pausedRunId = null;
    this.outcomes.clear();
    this.calls.clear();
    this.clientWork = [];
    this.awaitingApproval.clear();
  }
}
