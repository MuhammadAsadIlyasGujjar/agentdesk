/**
 * AG-UI protocol events — official spec ke mutabiq.
 * Reference: https://docs.ag-ui.com/sdk/js/core/events
 *
 * Ye types kisi bhi AG-UI backend par lagoo hoti hain — LangGraph, CrewAI,
 * Mastra, ya aapka apna server. Isi liye ye package backend-agnostic hai.
 */

export interface BaseEvent {
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

export type AgUiEvent = BaseEvent &
  (
    | { type: 'RUN_STARTED'; threadId: string; runId: string; parentRunId?: string }
    | { type: 'RUN_FINISHED'; threadId: string; runId: string; result?: unknown }
    | { type: 'RUN_ERROR'; message: string; code?: string }
    | { type: 'STEP_STARTED'; stepName: string }
    | { type: 'STEP_FINISHED'; stepName: string }

    | { type: 'TEXT_MESSAGE_START'; messageId: string; role: 'assistant' }
    | { type: 'TEXT_MESSAGE_CONTENT'; messageId: string; delta: string }
    | { type: 'TEXT_MESSAGE_END'; messageId: string }

    | { type: 'TOOL_CALL_START'; toolCallId: string; toolCallName: string; parentMessageId?: string }
    | { type: 'TOOL_CALL_ARGS'; toolCallId: string; delta: string }
    | { type: 'TOOL_CALL_END'; toolCallId: string }
    | { type: 'TOOL_CALL_RESULT'; messageId: string; toolCallId: string; content: string; role?: 'tool' }

    | { type: 'STATE_SNAPSHOT'; snapshot: unknown }
    | { type: 'STATE_DELTA'; delta: unknown[] }
    | { type: 'MESSAGES_SNAPSHOT'; messages: unknown[] }

    | { type: 'CUSTOM'; name: string; value: unknown }
    | { type: 'RAW'; event: unknown; source?: string }
  );

/* -------------------------------------------------------------------------
 *  CUSTOM event payloads — human-in-the-loop
 *
 *  Approvals spec ke core mein nahi hain. Spec ne CUSTOM isi maqsad ke liye
 *  rakha hai, isliye ye package do naam reserve karta hai:
 *
 *    { type:'CUSTOM', name:'approval_required', value: ApprovalRequiredPayload }
 *    { type:'CUSTOM', name:'run_paused',        value: RunPausedPayload }
 *
 *  Aapka backend inhi naamon se bheje to approvals khud ba khud kaam karenge.
 * ------------------------------------------------------------------------- */

export const AGUI_CUSTOM_APPROVAL_REQUIRED = 'approval_required';
export const AGUI_CUSTOM_RUN_PAUSED = 'run_paused';

export interface ApprovalRequiredPayload {
  runId: string;
  toolCallId: string;
  toolCallName: string;
  args: Record<string, unknown>;
  reason: string;
}

export interface RunPausedPayload {
  runId: string;
  reason: 'client_tool' | 'approval' | string;
}

/** Client se backend ko wapas bheja jane wala natija */
export interface ToolOutcome {
  toolCallId: string;
  approved?: boolean;
  /** "Edit & approve" — user ke badle hue arguments */
  args?: Record<string, unknown>;
  result?: unknown;
  error?: string;
}
