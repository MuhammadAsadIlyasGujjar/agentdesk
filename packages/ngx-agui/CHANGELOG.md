# Changelog

Is package ki tamam qabil-e-zikr tabdeeliyan yahan likhi jati hain.
Format [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) par hai,
aur versioning [SemVer](https://semver.org/) ke mutabiq.

## [0.1.0] — 2026-08-24

Pehla release.

### Added
- **AG-UI transport** — `AgUiClient`: POST + SSE stream ko Observable banata hai,
  `AbortController` se cancellation.
- **Signals store** — `ConversationStore`: AG-UI events ko `timeline()` signal
  mein badalta hai (user / text / tool / approval items).
- **`AgentSession`** — main facade: `send()`, `stop()`, `reset()`,
  `decideApproval()`. Client tools, pause/resume aur approvals khud handle karta hai.
- **`ClientToolRegistry`** — browser mein chalne wale tools; `askConfirmation()`
  built-in.
- **Components** — `<agui-timeline>`, `<agui-tool-card>`, `<agui-approval-card>`,
  `<agui-confirm-dialog>`, `<agui-tool-result>`, `<agui-json-view>`.
- **`provideAgUi()`** — endpoints, `toolViews` map, custom headers.
- Human-in-the-loop `CUSTOM` events: `approval_required`, `run_paused`.

### Notes
- Wire format official [AG-UI spec](https://docs.ag-ui.com/sdk/js/core/events)
  ke mutabiq hai.
- `STATE_DELTA` (JSON Patch), `MESSAGES_SNAPSHOT` aur `STEP_*` events abhi
  handle nahi hote.
- Stream toot jane par auto-reconnect nahi hai.
