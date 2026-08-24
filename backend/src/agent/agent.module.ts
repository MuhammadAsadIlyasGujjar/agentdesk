import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Conversation } from '../entities/conversation.entity';
import { ChatMessage } from '../entities/message.entity';
import { ToolRun } from '../entities/tool-run.entity';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';

import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { RunStoreService } from './run-store.service';
import { ServerToolsService } from './tools/server-tools.service';
import { GuardrailsService } from './guardrails/guardrails.service';
import { LLM_PROVIDER, LlmProvider } from './llm/llm.provider';
import { AnthropicProvider } from './llm/anthropic.provider';
import { MockProvider } from './llm/mock.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, ChatMessage, ToolRun, Product, Order])],
  controllers: [AgentController],
  providers: [
    AgentService,
    ServerToolsService,
    GuardrailsService,
    RunStoreService,
    {
      // 🔌 Yahan decide hota hai ki asli Claude chalega ya mock.
      // Baaki poore code ko farq nahi padta — wo sirf LlmProvider interface
      // dekhta hai. Isay "dependency inversion" kehte hain.
      provide: LLM_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): LlmProvider => {
        const provider = (config.get<string>('LLM_PROVIDER') ?? 'mock').toLowerCase();
        const apiKey = config.get<string>('ANTHROPIC_API_KEY');

        if (provider === 'anthropic') {
          if (!apiKey) {
            throw new Error(
              'LLM_PROVIDER=anthropic hai lekin ANTHROPIC_API_KEY set nahi. ' +
              'Ya key daalein, ya LLM_PROVIDER=mock kar dein.',
            );
          }
          return new AnthropicProvider(
            apiKey,
            config.get<string>('ANTHROPIC_MODEL') ?? 'claude-opus-5',
            Number(config.get('ANTHROPIC_MAX_TOKENS') ?? 16000),
          );
        }
        return new MockProvider();
      },
    },
  ],
})
export class AgentModule {}
