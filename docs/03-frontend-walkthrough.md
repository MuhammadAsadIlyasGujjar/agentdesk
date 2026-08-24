# 03 · Frontend walkthrough — Angular side

Frontend ke char zimmedariyan hain:

1. SSE stream padhna
2. Events ko UI state banana
3. Client tools chalana
4. Run resume karna

---

## 1. SSE ko Observable banana

`core/services/agent.service.ts`

Browser ka built-in `EventSource` sirf **GET** karta hai. Humein POST chahiye
(message body mein bhejni hai), isliye `fetch` + `ReadableStream`:

```ts
const res = await fetch(url, { method: 'POST', body: JSON.stringify(payload),
                               signal: controller.signal });
const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });

  const parts = buffer.split('\n\n');
  buffer = parts.pop() ?? '';     // ⚠️ aakhri tukda adhoora ho sakta hai
  ...
}
```

**Wo `buffer = parts.pop()` line sabse ahem hai.** Network chunks event
boundaries par nahi tootte. Aap ko aadha JSON mil sakta hai:

```
data: {"type":"TEXT_MESSAGE_CONTENT","del
```

Us line ke bagair aapko random parse errors milenge jo reproduce nahi hote.
Adhoora tukda bacha lo, agla chunk aane par jod do.

Aur cancel:

```ts
return () => controller.abort();     // unsubscribe = request cancel
```

Yehi aapka **Stop button** hai. Koi alag API call nahi.

---

## 2. Event router — events se UI state

`core/services/conversation.store.ts`

Ek hi `switch`, jo events ko store mutations mein badalta hai:

```ts
apply(event: AgUiEvent): void {
  switch (event.type) {
    case 'TEXT_MESSAGE_START':
      this.push({ kind: 'text', id: event.messageId, text: '', streaming: true });
      break;

    case 'TEXT_MESSAGE_CONTENT':
      this.patch(event.messageId, (i) =>
        i.kind === 'text' ? { ...i, text: i.text + event.delta } : i);
      break;

    case 'TOOL_CALL_START':
      this.push({ kind: 'tool', id: event.toolCallId, name: event.toolName,
                  side: event.side, status: 'running', argsText: '' });
      break;
    ...
  }
}
```

> 💡 **Pattern yaad rakhein:** components kabhi events nahi dekhte. Wo sirf
> signals padhte hain. Ye clean unidirectional flow hai — NgRx jaisa, magar
> bina boilerplate.

### Timeline: chat sirf messages ki list nahi hai

```ts
export type TimelineItem = UserItem | TextItem | ToolItem | ApprovalItem;
```

Char alag cheezein ek hi tarteeb mein aati hain. Template mein:

```html
@for (item of store.timeline(); track item.id) {
  @switch (item.kind) {
    @case ('user')     { <div class="row user">...</div> }
    @case ('text')     { <div class="row bot">...</div> }
    @case ('tool')     { <app-tool-card [item]="item" /> }
    @case ('approval') { <app-approval-card [item]="item" (decided)="..." /> }
  }
}
```

Ye "start → delta → end" pattern ka faida hai: `TEXT_MESSAGE_START` par khaali
bubble ban jata hai, phir bharta rehta hai. **Progressive rendering.**

---

## 3. Client-side tools — poora 7-step flow

`core/services/client-tool.registry.ts`

```
1. Angular apne schemas backend ko bhejta hai
        ↓  chat.component.ts → send() → clientTools: registry.getSchemas()
2. Backend unhe LLM ko de deta hai
        ↓  agent.service.ts → allTools()
3. LLM kehta hai "navigate_to chalao"
        ↓
4. Backend CHALATA NAHI — CLIENT_TOOL_REQUEST event bhej deta hai
        ↓  agent.service.ts → if (def.side === 'client') { pending.push(call) }
5. Angular asli function chalata hai
        ↓  chat.component.ts → registry.execute(name, args)
6. Angular result /resume par wapas bhejta hai
        ↓  agent.service.ts (frontend) → resume({ runId, outcomes })
7. Backend result LLM ko deta hai → loop chalta rehta hai
```

Registry mein har tool ke do hisse hain — bilkul server tools ki tarah:

```ts
{
  name: 'get_cart_contents',
  description: 'User ki cart padho. Cart sirf browser mein hai.',  // model dekhta hai
  input_schema: { type: 'object', properties: {} },
  execute: async () => ({ items: this.cart.lines(), total: this.cart.total() }),
  //  ↑ asli implementation — backend isay kabhi nahi dekhta
}
```

`getSchemas()` `execute` ko hata deta hai — function JSON mein bhej nahi sakte.

### Sabse dilchasp: user se poochhna

```ts
execute: async ({ message }) => {
  const confirmed = await new Promise<boolean>((resolve) => {
    this.confirmRequest.set({ message, resolve });   // signal set
  });
  this.confirmRequest.set(null);
  return { confirmed };
}
```

Promise tab tak **latka** rehta hai jab tak user button na dabaye. Ye human-in-
the-loop ka sabse seedha implementation hai — bina kisi library ke.

Template signal ko dekh kar dialog dikha deta hai, aur button `resolve()` call
karta hai.

### ⚠️ Security

Ye code user ke browser mein hai — wo isay dekh aur badal sakta hai.

- ❌ Client tool mein kabhi secret ya trust-critical logic mat rakhein
- ✅ `navigate_to` mein allowlist dekhein — model ko jahan mann kare wahan mat jaane do
- ✅ Server ko client ke result par andha bharosa nahi karna chahiye

---

## 4. Resume ka timing — ye tricky hai

`features/chat/chat.component.ts`

Teen cheezein ek saath ho sakti hain:
- kuch client tools chal rahe hain (async)
- kuch approvals user ke click ka intezar kar rahe hain
- SSE stream band ho chuki hai

Isliye:

```ts
private async onStreamEnd(): Promise<void> {
  if (!this.pausedRunId) { this.store.setRunning(false); return; }

  await Promise.all(this.clientWork);          // client tools poore hone do
  this.clientWork = [];

  if (this.awaitingApproval.size > 0) return;  // user ke click ka intezar

  this.resume();
}
```

Aur jab user approval card par click kare:

```ts
onApprovalDecision(decision: ApprovalDecision): void {
  this.outcomes.set(decision.toolCallId, { ...decision });
  this.awaitingApproval.delete(decision.toolCallId);

  if (this.awaitingApproval.size === 0 && this.pausedRunId) this.resume();
}
```

Do raste, ek hi manzil. Dono taraf se `resume()` tabhi chalta hai jab **sab**
pending kaam nimat chuka ho.

---

## 5. Dynamic components

`features/chat/components/tool-result-host.component.ts`

```ts
const COMPONENT_MAP: Record<string, Type<unknown>> = {
  search_products:    ProductGridComponent,
  get_order_status:   OrderStatusComponent,
  list_recent_orders: OrdersListComponent,
  sales_report:       SalesChartComponent,
};

effect(() => {
  container.clear();
  const component = COMPONENT_MAP[this.toolName()] ?? JsonFallbackComponent;
  //                                                ↑ HAMESHA fallback rakhein
  const ref = container.createComponent(component);
  ref.setInput('data', this.result());
  ref.changeDetectorRef.detectChanges();
});
```

> 💡 Agar model koi aisa tool call kare jiska component nahi bana, app crash
> nahi honi chahiye — raw JSON dikha do. Ye ek line aapko production mein
> bachati hai.

Ye "generative UI" ka pehla qadam hai: model ka faisla (kaunsa tool) seedha
UI ki shakl badal deta hai.

Agla qadam (course ka MODULE 3 / A2UI) ye hoga ki model **component tree**
khud generate kare. Uske liye jagah `conversation.store.ts` mein pehle se
maujood hai — `case 'CUSTOM':`.
