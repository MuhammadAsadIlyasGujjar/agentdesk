import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Conversation } from './conversation.entity';
import type { ContentBlock } from '../agent/agent.types';

/**
 * Hum plain text store NAHI karte — content blocks ka array store karte hain
 * (text | tool_use | tool_result). Yehi shape LLM API bhi expect karta hai,
 * isliye DB -> API conversion bilkul seedha rehta hai.
 */
@Entity('messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Conversation, (c) => c.messages, { onDelete: 'CASCADE' })
  conversation: Conversation;

  @Column({ type: 'varchar', length: 16 })
  role: 'user' | 'assistant';

  @Column({ type: 'jsonb' })
  content: ContentBlock[];

  /** Message ka order — createdAt par bharosa mat karo, same-ms collisions hote hain */
  @Column({ type: 'int', default: 0 })
  seq: number;

  @CreateDateColumn()
  createdAt: Date;
}
