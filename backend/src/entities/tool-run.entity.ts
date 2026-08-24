import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * MODULE 6 — Observability / audit trail.
 * Har tool execution ka record. Production mein ye aapki lifeline hai:
 * "agent ne kis waqt kya kiya, kis argument ke saath, aur natija kya nikla".
 */
@Entity('tool_runs')
export class ToolRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  conversationId: string | null;

  @Column()
  toolName: string;

  @Column({ type: 'varchar', length: 16, default: 'server' })
  side: 'server' | 'client';

  @Column({ type: 'jsonb', default: {} })
  args: any;

  @Column({ type: 'jsonb', nullable: true })
  result: any;

  @Column({ type: 'varchar', length: 16, default: 'ok' })
  status: 'ok' | 'error' | 'rejected';

  @Column({ type: 'int', default: 0 })
  durationMs: number;

  @CreateDateColumn()
  createdAt: Date;
}
