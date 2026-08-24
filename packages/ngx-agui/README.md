# @masad-ilyas-gujar/ngx-agui

**AG-UI protocol client for Angular.** Streaming agent UIs — signals-based, standalone,
zero UI dependencies.

Works with **any** [AG-UI](https://docs.ag-ui.com) compatible backend: LangGraph, CrewAI,
Mastra, Pydantic AI, or your own NestJS/Express server.

```bash
npm install @masad-ilyas-gujar/ngx-agui
```

Angular 18+ · standalone components · signals · no NgModules

---

## Kya milta hai

| | |
|---|---|
| 🔌 **AG-UI transport** | SSE stream → typed events. POST body support (EventSource se nahi hota). |
| ⚡ **Signals store** | Events → `timeline()` signal. Zero boilerplate, no NgRx. |
| 🖥️ **Client-side tools** | Model aapke browser mein functions chala sakta hai — cart parhna, navigate karna, user se poochhna. |
| ✋ **Human-in-the-loop** | High-risk actions par Approve / Reject / **Edit & approve**. |
| 🎨 **Generative UI** | Tool ka naam → aapka Angular component. |
| ⏹️ **Cancellation** | `stop()` — `AbortController` se asli request cancel. |

---

## Quick start

### 1. Configure

```ts
// app.config.ts
import { provideAgUi } from '@masad-ilyas-gujar/ngx-agui';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAgUi({
      streamUrl: '/api/agent/stream',
      resumeUrl: '/api/agent/resume',

      // tool ka naam -> aapka component
      toolViews: {
        search_products: ProductGridComponent,
        get_order_status: OrderTimelineComponent,
      },
    }),
  ],
};
```

### 2. Chat UI

```ts
@Component({
  selector: 'app-chat',
  imports: [TimelineComponent, ConfirmDialogComponent, FormsModule],
  template: `
    <agui-timeline />
    <agui-confirm-dialog />

    <input [(ngModel)]="text" (keyup.enter)="agent.send(text()); text.set('')" />
    @if (agent.running()) {
      <button (click)="agent.stop()">Stop</button>
    }
  `,
})
export class ChatComponent {
  agent = inject(AgentSession);
  text = signal('');
}
```

**Bas.** SSE parsing, event routing, tool dispatch, pause/resume, approvals —
sab `AgentSession` ke andar hai.

### 3. Client-side tools (asal jaadu)

Kuch cheezein sirf browser mein hoti hain. Unhe model ke liye tool bana dein:

```ts
const registry = inject(ClientToolRegistry);

registry.register({
  name: 'get_cart_contents',
  description: 'User ki cart parho. Cart sirf browser mein hai, server ke paas nahi.',
  input_schema: { type: 'object', properties: {} },
  execute: async () => ({ items: cart.lines(), total: cart.total() }),
});

registry.register({
  name: 'navigate_to',
  description: 'App ke kisi page par le jao. Routes: "/chat", "/shop", "/orders".',
  input_schema: {
    type: 'object',
    properties: { route: { type: 'string' } },
    required: ['route'],
  },
  execute: async ({ route }) => {
    const allowed = ['/chat', '/shop', '/orders'];   // 🛡️ hamesha allowlist
    if (!allowed.includes(route)) return { error: 'not allowed' };
    await router.navigateByUrl(route);
    return { navigated: true, route };
  },
});
```

Schemas khud backend ko jate hain. Jab model unhe call kare, `AgentSession`
function chala kar natija wapas bhej deta hai — aapko kuch nahi karna.

**User se poochhna** built-in hai:

```ts
execute: async ({ message }) => ({
  confirmed: await registry.askConfirmation(message),   // Promise latka rehta hai
}),
```

> ⚠️ **Security:** client tools user ke browser mein chalte hain — wo unhe parh
> aur badal sakta hai. Secrets yahan mat rakhein, aur server ko in ke natije par
> andha bharosa nahi karna chahiye.

---

## Backend se kya expect kiya jata hai

Do endpoints jo `text/event-stream` dete hain:

```
POST {streamUrl}   { threadId?, message, clientTools[] }
POST {resumeUrl}   { runId, outcomes[], clientTools[] }
```

Events [AG-UI spec](https://docs.ag-ui.com/sdk/js/core/events) ke mutabiq:

```
data: {"type":"RUN_STARTED","threadId":"t1","runId":"r1"}
data: {"type":"TEXT_MESSAGE_START","messageId":"m1","role":"assistant"}
data: {"type":"TEXT_MESSAGE_CONTENT","messageId":"m1","delta":"Dhoond raha hoon"}
data: {"type":"TOOL_CALL_START","toolCallId":"c1","toolCallName":"search_products"}
data: {"type":"TOOL_CALL_ARGS","toolCallId":"c1","delta":"{\"query\":\"laptop\"}"}
data: {"type":"TOOL_CALL_END","toolCallId":"c1"}
data: {"type":"TOOL_CALL_RESULT","messageId":"c1","toolCallId":"c1","content":"{...}"}
data: {"type":"RUN_FINISHED","threadId":"t1","runId":"r1"}
data: [DONE]
```

### Human-in-the-loop

Approvals AG-UI core spec mein nahi hain — spec `CUSTOM` ko isi maqsad ke liye
rakhta hai. Ye package do naam reserve karta hai:

```jsonc
// loop rok kar user se poochho
{"type":"CUSTOM","name":"approval_required","value":{
  "runId":"r1","toolCallId":"c1","toolCallName":"cancel_order",
  "args":{"orderNumber":"ORD-1004"},"reason":"Destructive action"}}

// batao ke stream band ho rahi hai magar turn khatam nahi hua
{"type":"CUSTOM","name":"run_paused","value":{"runId":"r1","reason":"approval"}}
```

Client tools ke liye **koi khaas event nahi chahiye** — client ne khud schemas
bheje the, isliye `TOOL_CALL_START` ka naam apni registry mein dekh kar wo
pehchan leta hai ke tool uska hai. Bas `run_paused` bhej dein.

Client `{resumeUrl}` par outcomes wapas bhejta hai:

```jsonc
{"runId":"r1","outcomes":[
  {"toolCallId":"c1","result":{...}},                       // client tool
  {"toolCallId":"c2","approved":true,"args":{...}},         // edit & approve
  {"toolCallId":"c3","approved":false,"error":"declined"}   // reject
]}
```

> 🔒 Approval **ijazat** hai, **hukum** nahi. Server ko apne business rules
> dobara check karne chahiyein — client ka `approved:true` kaafi nahi.

---

## API

### `provideAgUi(config)`

| Option | Type | |
|---|---|---|
| `streamUrl` | `string` | Naya turn — SSE wapas |
| `resumeUrl` | `string` | Ruka hua run aage barhao — SSE wapas |
| `toolViews` | `Record<string, Type<unknown>>` | Tool ka naam → component. Component ko ek input milta hai: `data` |
| `fallbackView` | `Type<unknown>` | Unknown tool ke liye (default: JSON viewer) |
| `headers` | `() => Record<string,string>` | Har request par — auth tokens waghera |

### `AgentSession`

```ts
// signals
timeline()      // TimelineItem[]  — user | text | tool | approval
running()       // boolean
error()         // string | null
threadId()      // string | null
state()         // backend ka STATE_SNAPSHOT
isEmpty()       // boolean

// actions
send(text)
stop()
reset()
decideApproval({ toolCallId, approved, args?, reason? })
answerConfirmation(ok)
```

### `ClientToolRegistry`

```ts
register(tool)          registerAll(tools)      unregister(name)
has(name)               getSchemas()            execute(name, args)
askConfirmation(msg)    answerConfirmation(ok)  confirmRequest()  // signal
```

### Components

| Selector | |
|---|---|
| `<agui-timeline />` | Poori conversation. Apna design chahiye to `session.timeline()` par khud `@switch` likhein. |
| `<agui-tool-card [item] />` | Ek tool call — live args, status, result |
| `<agui-approval-card [item] />` | Approve / Reject / Edit & approve |
| `<agui-confirm-dialog />` | `askConfirmation()` ka UI |
| `<agui-tool-result [toolName] [result] />` | Sirf result render karna ho to |
| `<agui-json-view [data] />` | Default fallback |

---

## Apna UI chahiye?

Components optional hain. Sirf `AgentSession` use karein:

```html
@for (item of agent.timeline(); track item.id) {
  @switch (item.kind) {
    @case ('user')     { <my-user-bubble [text]="item.text" /> }
    @case ('text')     { <my-bot-bubble [text]="item.text" [typing]="item.streaming" /> }
    @case ('tool')     { <my-tool-card [item]="item" /> }
    @case ('approval') { <my-approval [item]="item" /> }
  }
}
```

---

## Ye package kya NAHI karta

Saaf saaf — taake ghalat tawaqqu na ho:

- ❌ Agent loop nahi chalata (wo aapke backend ka kaam hai)
- ❌ LLM se seedha baat nahi karta (API key kabhi browser mein nahi)
- ❌ Conversation history store nahi karta (backend ka kaam)
- ❌ `STATE_DELTA` (JSON Patch), `MESSAGES_SNAPSHOT`, `STEP_*` abhi handle nahi hote
- ❌ Stream toot jane par auto-reconnect nahi

## Contributing / Issues

Ye package [AgentDesk](https://github.com/) reference app se nikala gaya hai.
Bug ya feature request ho to issue kholein.

## License

MIT © M. Asad Ilyas Gujar

Publish karne ka tareeqa: [PUBLISHING.md](./PUBLISHING.md)
