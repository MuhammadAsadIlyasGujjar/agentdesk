import { ApprovalRequiredPayload } from './ag-ui.events';

/**
 * UI ka model — protocol se alag.
 *
 * Chat sirf messages ki list nahi hoti: usme user bubbles, assistant text,
 * tool cards aur approval cards sab ek hi tarteeb mein aate hain.
 */

export interface UserItem {
  kind: 'user';
  id: string;
  text: string;
}

export interface TextItem {
  kind: 'text';
  id: string;              // messageId
  text: string;
  streaming: boolean;
}

export interface ToolItem {
  kind: 'tool';
  id: string;              // toolCallId
  name: string;
  status: 'running' | 'done' | 'error';
  /** stream hote hue partial JSON — "typing arguments..." dikhane ke liye */
  argsText: string;
  args?: Record<string, unknown>;
  result?: unknown;
}

export interface ApprovalItem {
  kind: 'approval';
  id: string;              // toolCallId
  runId: string;
  name: string;
  args: Record<string, unknown>;
  reason: string;
  decision: 'pending' | 'approved' | 'rejected';
}

export type TimelineItem = UserItem | TextItem | ToolItem | ApprovalItem;

export interface ApprovalDecision {
  toolCallId: string;
  approved: boolean;
  args?: Record<string, unknown>;
  reason?: string;
}

export type { ApprovalRequiredPayload };
