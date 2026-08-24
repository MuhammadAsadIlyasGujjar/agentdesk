import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ChatMessage } from './message.entity';

/**
 * MODULE 1 / DAY 3 — Memory.
 * LLM stateless hai. "Memory" yehi table hai: har turn DB mein likha jata hai
 * aur agli request par wapas model ko bheja jata hai.
 */
@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'New chat' })
  title: string;

  @OneToMany(() => ChatMessage, (m) => m.conversation)
  messages: ChatMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
