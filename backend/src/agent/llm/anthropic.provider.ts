import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '@nestjs/common';
import { ContentBlock } from '../agent.types';
import { LlmParams, LlmProvider, LlmStreamEvent } from './llm.provider';

/**
 * MODULE 1 / DAY 4 — asli streaming.
 *
 * 🔒 API key sirf yahan (server) hai. Frontend isay kabhi nahi dekhta.
 */
export class AnthropicProvider implements LlmProvider {
  readonly name = 'anthropic';
  private readonly log = new Logger(AnthropicProvider.name);
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
    private readonly maxTokens: number,
  ) {
    this.client = new Anthropic({ apiKey });
  }

  async *stream(params: LlmParams): AsyncGenerator<LlmStreamEvent> {
    // Humare tools mein `side` aur `risk` extra fields hain — model ko wo nahi
    // chahiye. Sirf name/description/input_schema bhejte hain.
    const tools = params.tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema as Anthropic.Tool.InputSchema,
    }));

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: this.maxTokens,
      system: params.system,
      messages: params.messages as Anthropic.MessageParam[],
      ...(tools.length ? { tools } : {}),
    });

    // Kaunsa content block abhi chal raha hai — index se track karte hain
    const openBlocks = new Map<number, { kind: 'text' | 'tool'; id: string }>();

    try {
      for await (const event of stream) {
        switch (event.type) {
          case 'content_block_start': {
            const block = event.content_block;
            if (block.type === 'text') {
              openBlocks.set(event.index, { kind: 'text', id: '' });
              yield { type: 'text_start' };
            } else if (block.type === 'tool_use') {
              openBlocks.set(event.index, { kind: 'tool', id: block.id });
              yield { type: 'tool_start', id: block.id, name: block.name };
            }
            break;
          }

          case 'content_block_delta': {
            const open = openBlocks.get(event.index);
            if (event.delta.type === 'text_delta') {
              yield { type: 'text_delta', text: event.delta.text };
            } else if (event.delta.type === 'input_json_delta' && open?.kind === 'tool') {
              // Tool ke arguments bhi *stream* hote hain — partial JSON ke tukdon mein.
              // Isi liye UI mein "typing arguments…" dikha sakte hain.
              yield { type: 'tool_args_delta', id: open.id, delta: event.delta.partial_json };
            }
            break;
          }

          case 'content_block_stop': {
            const open = openBlocks.get(event.index);
            if (open?.kind === 'text') yield { type: 'text_end' };
            else if (open?.kind === 'tool') yield { type: 'tool_end', id: open.id };
            openBlocks.delete(event.index);
            break;
          }
        }
      }

      // finalMessage() poora message assemble karke deta hai — hum khud
      // partial JSON jodne ki mehnat nahi karte.
      const message = await stream.finalMessage();

      // Claude Opus 5 safety classifier request decline bhi kar sakta hai.
      // Ye HTTP 200 hota hai — isliye stop_reason check karna zaroori hai.
      if (message.stop_reason === 'refusal') {
        yield {
          type: 'result',
          content: [{ type: 'text', text: 'Ye request main pura nahi kar sakta.' }],
          stopReason: 'refusal',
        };
        return;
      }

      const content: ContentBlock[] = message.content
        .map((b): ContentBlock | null => {
          if (b.type === 'text') return { type: 'text', text: b.text };
          if (b.type === 'tool_use') {
            return { type: 'tool_use', id: b.id, name: b.name, input: b.input as Record<string, any> };
          }
          return null; // thinking waghera blocks hum store nahi kar rahe
        })
        .filter((b): b is ContentBlock => b !== null);

      yield { type: 'result', content, stopReason: message.stop_reason ?? 'end_turn' };
    } catch (error) {
      // SDK ke typed errors — string matching kabhi mat karein
      if (error instanceof Anthropic.AuthenticationError) {
        throw new Error('ANTHROPIC_API_KEY galat ya missing hai.');
      }
      if (error instanceof Anthropic.RateLimitError) {
        throw new Error('Rate limit — thodi der baad try karein.');
      }
      if (error instanceof Anthropic.APIError) {
        this.log.error(`Anthropic API error ${error.status}: ${error.message}`);
        throw new Error(`LLM error (${error.status}): ${error.message}`);
      }
      throw error;
    }
  }
}
