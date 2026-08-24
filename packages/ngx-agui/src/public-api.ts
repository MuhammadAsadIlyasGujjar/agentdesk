/*
 * ngx-agui — AG-UI protocol client for Angular
 * Public API surface.
 */

// ---- protocol ----
export * from './lib/models/ag-ui.events';
export * from './lib/models/timeline';

// ---- core ----
export * from './lib/core/agui.config';
export * from './lib/core/agui-client.service';
export * from './lib/core/client-tool.registry';
export * from './lib/core/conversation.store';
export * from './lib/core/agent-session.service';

// ---- ui ----
export * from './lib/ui/json-view.component';
export * from './lib/ui/tool-result-host.component';
export * from './lib/ui/tool-card.component';
export * from './lib/ui/approval-card.component';
export * from './lib/ui/confirm-dialog.component';
export * from './lib/ui/timeline.component';
