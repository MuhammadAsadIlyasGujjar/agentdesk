import { Injectable, Logger } from '@nestjs/common';
import { AgentMessage, ContentBlock, ToolUseBlock } from './agent.types';

/**
 * MODULE 5 — Interrupt / Resume ka "memory".
 *
 * Jab loop client ke kaam ka intezar karne ke liye rukta hai, to hum uski
 * poori state yahan rakh dete hain. Client jawab bhej de to wahi state
 * uthakar loop wahin se chalu ho jata hai.
 *
 * ⚠️ Ye in-memory Map hai — server restart par khatam. Ek server ke liye theek.
 * Multi-instance production mein isay Redis mein rakhein (same interface).
 */
export interface PausedRun {
  runId: string;
  conversationId: string;
  messages: AgentMessage[];
  /** Jo tool calls abhi baaki hain (client tool ya approval ka intezar) */
  pending: ToolUseBlock[];
  /** Jo server tools is turn mein chal chuke — inke results save hain */
  completed: ContentBlock[];
  step: number;
  createdAt: number;
}

@Injectable()
export class RunStoreService {
  private readonly log = new Logger(RunStoreService.name);
  private readonly runs = new Map<string, PausedRun>();
  private readonly TTL_MS = 30 * 60 * 1000; // 30 min

  save(run: PausedRun): void {
    this.runs.set(run.runId, run);
    this.evictOld();
  }

  take(runId: string): PausedRun | undefined {
    const run = this.runs.get(runId);
    if (run) this.runs.delete(runId); // ek run sirf ek baar resume ho sakta hai
    return run;
  }

  private evictOld(): void {
    const now = Date.now();
    for (const [id, run] of this.runs) {
      if (now - run.createdAt > this.TTL_MS) {
        this.runs.delete(id);
        this.log.debug('Evicted stale run ' + id);
      }
    }
  }
}
