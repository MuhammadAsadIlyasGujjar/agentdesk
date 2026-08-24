import { AgentMessage, ContentBlock, ToolDefinition } from '../agent.types';

/**
 * Provider-agnostic stream events.
 * Anthropic ho, mock ho, ya kal koi aur model — agent.service ko sirf ye
 * chhote se events dikhte hain. Yehi "adapter" pattern hai.
 */
export type LlmStreamEvent =
  | { type: 'text_start' }
  | { type: 'text_delta'; text: string }
  | { type: 'text_end' }
  | { type: 'tool_start'; id: string; name: string }
  | { type: 'tool_args_delta'; id: string; delta: string }
  | { type: 'tool_end'; id: string }
  /** hamesha aakhri event — poora message + stop reason */
  | { type: 'result'; content: ContentBlock[]; stopReason: string };

export interface LlmParams {
  system: string;
  messages: AgentMessage[];
  tools: ToolDefinition[];
}

export interface LlmProvider {
  readonly name: string;
  stream(params: LlmParams): AsyncGenerator<LlmStreamEvent>;
}

/** Nest DI token — is token se hum runtime par provider swap karte hain */
export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
