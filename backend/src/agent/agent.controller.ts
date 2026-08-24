import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AgentService } from './agent.service';
import { AgUiEvent } from './agent.types';
import { ResumeRunDto, StartRunDto } from './dto/run.dto';

/**
 * ============================================================
 *  MODULE 1 / DAY 4 — SSE (Server-Sent Events)
 * ============================================================
 * SSE ka format bilkul simple hai — plain HTTP par ye lines:
 *
 *     data: {"type":"TEXT_MESSAGE_CONTENT","delta":"Hello"}\n\n
 *
 * Do newline "\n\n" ek event ka end batata hai. Bas itna hi.
 *
 * Hum WebSocket ke bajaye SSE use kar rahe hain kyunki:
 *   - ye one-way hai (server -> client), aur agent ko yehi chahiye
 *   - plain HTTP hai, proxy/firewall friendly
 *   - client se wapas baat karni ho to normal POST kar dete hain (/resume)
 */
@Controller('agent')
export class AgentController {
  constructor(private readonly agent: AgentService) {}

  /** Naya turn — user ka message bhejo, events wapas paao */
  @Post('stream')
  async stream(@Body() dto: StartRunDto, @Res() res: Response): Promise<void> {
    this.openSse(res);
    await this.pump(this.agent.startRun(dto), res);
  }

  /** Ruke hue run ko resume karo (client tool result ya approval ke baad) */
  @Post('resume')
  async resume(@Body() dto: ResumeRunDto, @Res() res: Response): Promise<void> {
    this.openSse(res);
    await this.pump(this.agent.resumeRun(dto), res);
  }

  @Get('conversations')
  listConversations() {
    return this.agent.listConversations();
  }

  @Get('conversations/:id/messages')
  history(@Param('id') id: string) {
    return this.agent.getHistory(id);
  }

  /** Audit trail — agent ne kaunse tools chalaye (MODULE 6 observability) */
  @Get('conversations/:id/tool-runs')
  toolRuns(@Param('id') id: string) {
    return this.agent.getToolRuns(id);
  }

  /* ---------------- SSE plumbing ---------------- */

  private openSse(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    // nginx ke saamne ye zaroori hai warna wo buffer kar ke stream tod deta hai
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
  }

  private async pump(events: AsyncGenerator<AgUiEvent>, res: Response): Promise<void> {
    let clientGone = false;
    // User ne "Stop" dabaya ya tab band kiya -> hum bhi loop rok dete hain
    res.on('close', () => {
      clientGone = true;
    });

    try {
      for await (const event of events) {
        if (clientGone) break;
        res.write('data: ' + JSON.stringify(event) + '\n\n');
      }
    } catch (error: any) {
      res.write('data: ' + JSON.stringify({ type: 'RUN_ERROR', message: error.message }) + '\n\n');
    } finally {
      if (!clientGone) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }
  }
}
