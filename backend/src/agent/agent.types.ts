// ============================================================================
//  AG-UI PROTOCOL — official spec ke mutabiq
//  Reference: https://docs.ag-ui.com/sdk/js/core/events
//
//  ⚠️ Ye file frontend ke ag-ui.models.ts se mirror hai. Shape wahi rakhein.
//  Spec follow karne ka faida: ye events koi bhi AG-UI client samajh sakta hai,
//  aur hamara Angular client kisi bhi AG-UI backend ke saath chal sakta hai.
// ============================================================================

/* ------------------------------------------------------------------ */
/*  1. CONTENT BLOCKS — ek message ke andar kya kya ho sakta hai        */
/* ------------------------------------------------------------------ */

export interface TextBlock {
  type: 'text';
  text: string;
}

/** Model ki taraf se "ye tool chalao" ki REQUEST. Ye khud kuch chalata nahi. */
export interface ToolUseBlock {
  type: 'tool_use';
  id: string;          // tool_use_id — result isi id se wapas match hota hai
  name: string;
  input: Record<string, any>;
}

/** Humari taraf se model ko: "lo, tumhare tool ka natija" */
export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;     // hamesha string — JSON.stringify karke bhejte hain
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: ContentBlock[];
}

/* ------------------------------------------------------------------ */
/*  2. TOOL DEFINITION — model ko sirf ye "shape" dikhti hai            */
/* ------------------------------------------------------------------ */

export type ToolSide = 'server' | 'client';
export type ToolRisk = 'low' | 'medium' | 'high';

export interface ToolDefinition {
  name: string;
  /** ⭐ Sabse important field. Model ISI ko padh kar decide karta hai. */
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  /** server = backend chalayega | client = browser chalayega */
  side: ToolSide;
  /** high = pehle user se approval maango */
  risk: ToolRisk;
}

/** Frontend jo tools bhejta hai unme `execute` nahi hota — sirf schema */
export interface ClientToolSchema {
  name: string;
  description: string;
  input_schema: ToolDefinition['input_schema'];
}

/* ------------------------------------------------------------------ */
/*  3. AG-UI EVENTS — SSE par frontend tak yehi jate hain               */
/*                                                                      */
/*  Har event BaseEvent extend karta hai. `metadata` spec ka official   */
/*  escape hatch hai — extra info wahan daalte hain.                    */
/* ------------------------------------------------------------------ */

export interface BaseEvent {
  timestamp?: number;
  metadata?: Record<string, any>;
}

export type AgUiEvent = BaseEvent &
  (
    // ---- Lifecycle ----
    | { type: 'RUN_STARTED'; threadId: string; runId: string }
    | { type: 'RUN_FINISHED'; threadId: string; runId: string; result?: any }
    | { type: 'RUN_ERROR'; message: string; code?: string }
    | { type: 'STEP_STARTED'; stepName: string }
    | { type: 'STEP_FINISHED'; stepName: string }

    // ---- Text (start -> content* -> end) ----
    | { type: 'TEXT_MESSAGE_START'; messageId: string; role: 'assistant' }
    | { type: 'TEXT_MESSAGE_CONTENT'; messageId: string; delta: string }
    | { type: 'TEXT_MESSAGE_END'; messageId: string }

    // ---- Tool calls ----
    //  ⚠️ NOTE: spec mein TOOL_CALL_END sirf id bhejta hai — args nahi.
    //  Client ko args khud TOOL_CALL_ARGS ke deltas jod kar banane hote hain.
    //  Isi liye har AG-UI client ke paas ek chhota "args buffer" hota hai.
    | { type: 'TOOL_CALL_START'; toolCallId: string; toolCallName: string; parentMessageId?: string }
    | { type: 'TOOL_CALL_ARGS'; toolCallId: string; delta: string }
    | { type: 'TOOL_CALL_END'; toolCallId: string }
    | { type: 'TOOL_CALL_RESULT'; messageId: string; toolCallId: string; content: string; role?: 'tool' }

    // ---- State ----
    | { type: 'STATE_SNAPSHOT'; snapshot: any }
    | { type: 'STATE_DELTA'; delta: any[] }

    // ---- Escape hatch ----
    //  Human-in-the-loop spec ke core mein nahi hai. Spec ne CUSTOM isi
    //  maqsad ke liye rakha hai — isliye approval/pause yahan se jate hain:
    //    { type: 'CUSTOM', name: 'approval_required', value: {...} }
    //    { type: 'CUSTOM', name: 'run_paused',        value: {...} }
    | { type: 'CUSTOM'; name: string; value: any }
    | { type: 'RAW'; event: any; source?: string }
  );

/** CUSTOM events ke payloads — taake dono taraf typed rahen */
export interface ApprovalRequiredPayload {
  runId: string;
  toolCallId: string;
  toolCallName: string;
  args: Record<string, any>;
  reason: string;
}

export interface RunPausedPayload {
  runId: string;
  reason: 'client_tool' | 'approval';
}

/* ------------------------------------------------------------------ */
/*  4. RESUME — client apna kaam khatam karke ye wapas bhejta hai       */
/* ------------------------------------------------------------------ */

export interface ToolOutcome {
  toolCallId: string;
  /** approval reject hua to false */
  approved?: boolean;
  /** "Edit & approve" — user ne args badal diye to wo yahan aate hain */
  args?: Record<string, any>;
  result?: any;
  error?: string;
}
