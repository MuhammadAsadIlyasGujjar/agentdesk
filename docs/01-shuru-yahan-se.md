# 01 · Shuru yahan se — mental model

Code kholne se pehle **teen sawal** ka jawab pakka kar lein. Ye teen jawab
aapko kisi bhi agentic app mein kaam aayenge, sirf is project mein nahi.

---

## Sawal 1 — Chatbot aur Agent mein farq kya hai?

**Chatbot:** user message → model reply → khatam. Ek round.

**Agent:** model soch sakta hai → tool chala sakta hai → result dekh sakta hai
→ phir soch sakta hai — **jab tak kaam poora na ho.**

Farq sirf ek cheez hai: **loop.**

`backend/src/agent/agent.service.ts` mein dekhein:

```ts
while (step < this.maxSteps) {
  //  ↑ YEHI wo cheez hai jo chatbot ko agent banati hai

  const stream = this.llm.stream({ system, messages, tools });
  // ... model ka jawab lo ...

  if (toolUses.length === 0) {
    yield { type: 'RUN_FINISHED', runId };   // ← final jawab, loop khatam
    return;
  }

  // tools chalao, results messages mein daalo, aur DOBARA loop chalao
  ctx.messages.push({ role: 'user', content: results });
  step++;
}
```

> 💡 "Agentic" ka matlab hai **agency** — kya karna hai ye faisla *model* leta
> hai, aapka hardcoded `if-else` nahi.

`maxSteps` kyun? Kyunki model kabhi kabhi loop mein phans sakta hai. Ye aapka
seat-belt hai.

---

## Sawal 2 — Kya LLM khud tool chalata hai?

**Nahi.** Ye sabse badi galatfehmi hai.

LLM sirf **text/JSON generate** karta hai. Wo keh sakta hai
*"search_products chalao query=laptop ke saath"* — magar chalata **aapka code** hai.

Is project mein ye baat do alag jagahon se saaf dikhti hai:

| File | Kya hai |
|---|---|
| `tools/server-tools.service.ts` → `definitions` | Model ko **sirf ye shape** dikhti hai |
| `tools/server-tools.service.ts` → `execute()` | Asli SQL query — model isay kabhi nahi dekhta |

```ts
// Model ko ye dikhta hai:
{
  name: 'search_products',
  description: 'Catalog mein products dhoondo...',   // ⭐ sabse ahem field
  input_schema: { type: 'object', properties: { query: { type: 'string' } } }
}

// Aur asli kaam ye karta hai (model se poori tarah chhupa hua):
private async searchProducts(args) {
  const rows = await this.products.find({ where: { name: ILike('%' + args.query + '%') } });
  ...
}
```

> ⭐ **`description` documentation nahi, prompt engineering hai.** Model isi ko
> padh kar decide karta hai ki tool kab use karna hai. Buri description = galat
> waqt par tool call.

**Angular analogy:** model ek child component hai jo `@Output() toolCall` emit
karta hai. Parent event sunta hai, service chalata hai, result `@Input()` se
wapas bhejta hai. Child ne kabhi `HttpClient` touch nahi kiya.

---

## Sawal 3 — Model ko kya yaad rehta hai?

**Kuch nahi.** LLM stateless hai. Har API call fresh hai.

To "memory" kahan hai? **Aapke paas.** Is project mein:

```
PostgreSQL  messages table
      ↓  loadContext()
  AgentMessage[]  ──────► har API call mein poora array bhejte hain
```

`agent.service.ts` → `loadContext()` mein ek zaroori nuance hai:

```ts
list = list.slice(-maxMessages);          // purane messages hata do

// ⚠️ LEKIN: agar beech se kaata, to koi `tool_result` bina apne
// `tool_use` ke reh jayega — API 400 degi.
while (list.length && !(list[0].role === 'user' &&
       !list[0].content.some((b) => b.type === 'tool_result'))) {
  list.shift();
}
```

Ye wo bug hai jo production mein hafton baad pakda jata hai. Ab aap jaante hain.

---

## Kaunsi file kya karti hai

### Backend (`backend/src/`)

| File | Zimmedari |
|---|---|
| `agent/agent.types.ts` | **Protocol** — content blocks, tool definitions, AG-UI events |
| `agent/agent.service.ts` | Loop, pause/resume, memory, persistence |
| `agent/agent.controller.ts` | SSE endpoints (`/stream`, `/resume`) |
| `agent/run-store.service.ts` | Ruke hue runs ki state |
| `agent/llm/llm.provider.ts` | Provider interface (adapter pattern) |
| `agent/llm/anthropic.provider.ts` | Asli Claude — streaming + tools |
| `agent/llm/mock.provider.ts` | Bina API key ke wahi shape ke events |
| `agent/tools/server-tools.service.ts` | 5 server tools (definitions + execution) |
| `agent/guardrails/guardrails.service.ts` | 4 layers of defence |
| `entities/*.ts` | 6 PostgreSQL tables |
| `catalog/*` | Normal REST (AI se koi taluq nahi) |
| `seed/seed.service.ts` | Demo data |

### Frontend (`frontend/src/app/`)

| File | Zimmedari |
|---|---|
| `core/models/ag-ui.models.ts` | Backend ke types ka mirror + UI timeline types |
| `core/services/agent.service.ts` | SSE ko Observable banata hai |
| `core/services/conversation.store.ts` | **Event router** — events → signals |
| `core/services/client-tool.registry.ts` | Browser mein chalne wale 3 tools |
| `core/services/cart.store.ts` | Cart signals (sirf browser mein) |
| `features/chat/chat.component.ts` | Conductor — client tools + resume |
| `features/chat/components/tool-card.component.ts` | Live tool card |
| `features/chat/components/tool-result-host.component.ts` | Tool name → component |
| `features/chat/components/approval-card.component.ts` | Human-in-the-loop UI |
| `features/chat/tool-views/*` | Har tool ka apna visual |

---

## Aage kya

Ab `02-backend-walkthrough.md` kholein — wahan hum loop ko line-by-line follow
karenge, ek asli request ke saath.
