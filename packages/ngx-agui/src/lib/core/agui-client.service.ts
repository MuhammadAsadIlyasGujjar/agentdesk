import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AGUI_CONFIG } from './agui.config';
import { AgUiEvent, ToolOutcome } from '../models/ag-ui.events';
import { ClientToolSchema } from './client-tool.registry';

/**
 * SSE transport — AG-UI event stream ko Observable bana deta hai.
 *
 * Browser ka built-in `EventSource` sirf GET karta hai; humein POST chahiye
 * (message body mein jata hai). Isliye fetch + ReadableStream.
 *
 * Bonus: `unsubscribe()` karte hi AbortController request cancel kar deta hai —
 * yehi aapka "Stop" button hai, koi alag API call nahi.
 */
@Injectable({ providedIn: 'root' })
export class AgUiClient {
  private readonly config = inject(AGUI_CONFIG);

  runAgent(body: {
    threadId?: string | null;
    message: string;
    clientTools: ClientToolSchema[];
  }): Observable<AgUiEvent> {
    return this.sse(this.config.streamUrl, {
      // dono naam bhejte hain taake purane backends bhi chalein
      threadId: body.threadId ?? undefined,
      conversationId: body.threadId ?? undefined,
      message: body.message,
      clientTools: body.clientTools,
    });
  }

  resumeAgent(body: {
    runId: string;
    outcomes: ToolOutcome[];
    clientTools: ClientToolSchema[];
  }): Observable<AgUiEvent> {
    return this.sse(this.config.resumeUrl, body);
  }

  /* ------------------------------------------------------------------ */

  private sse(url: string, payload: unknown): Observable<AgUiEvent> {
    return new Observable<AgUiEvent>((subscriber) => {
      const controller = new AbortController();

      (async () => {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.headers?.() ?? {}),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error('Agent endpoint ne ' + res.status + ' diya');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE mein "\n\n" ek event ka end hai
          const parts = buffer.split('\n\n');

          // ⚠️ Aakhri tukda adhoora ho sakta hai — network chunks event
          // boundaries par nahi tootte. Ye ek line bhoolne par aapko random,
          // reproduce na hone wale JSON parse errors milenge.
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            for (const line of part.split('\n')) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;

              const raw = trimmed.slice(5).trim();
              if (raw === '[DONE]' || raw === '') {
                if (raw === '[DONE]') { subscriber.complete(); return; }
                continue;
              }
              try {
                subscriber.next(JSON.parse(raw) as AgUiEvent);
              } catch {
                console.warn('[ngx-agui] event parse fail:', raw.slice(0, 120));
              }
            }
          }
        }
        subscriber.complete();
      })().catch((err) => {
        // User ne khud rok diya — ye error nahi
        if (controller.signal.aborted) subscriber.complete();
        else subscriber.error(err);
      });

      return () => controller.abort();
    });
  }
}
