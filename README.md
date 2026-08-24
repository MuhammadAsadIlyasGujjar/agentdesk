# 🤖 AgentDesk — Full-Stack Agentic App

**Angular 21 + NestJS 11 + PostgreSQL 16 + Docker**

Ye aapke *Agentic Angular* course ka **chalne wala project** hai. Har module ka
concept yahan asli code mein maujood hai — Roman Urdu comments ke saath.

| Course Module | Is project mein kahan |
|---|---|
| M1 · Agentic loop | `backend/src/agent/agent.service.ts` → `loop()` |
| M1 · Tools | `backend/src/agent/tools/server-tools.service.ts` |
| M1 · Memory | `entities/message.entity.ts` + `loadContext()` |
| M1 · Streaming (SSE) | `agent.controller.ts` + frontend `core/services/agent.service.ts` |
| M1 · Structured output | `search_products` ka return shape → `ProductGridComponent` |
| M2 · AG-UI events | `agent.types.ts` ↔ `core/models/ag-ui.models.ts` |
| M2 · Event router | `core/services/conversation.store.ts` |
| M2 · Client-side tools | `core/services/client-tool.registry.ts` |
| M2 · Dynamic components | `chat/components/tool-result-host.component.ts` |
| M5 · Approvals / interrupts | `approval-card.component.ts` + `run-store.service.ts` |
| M6 · Guardrails | `agent/guardrails/guardrails.service.ts` |

---

## ⚡ Chalayein — 3 minute

**Ports:** frontend `4300` · backend `3100` · database `55432`
(4200/3000/5432 se hata kar rakhe gaye hain taake aapke doosre projects se na takrayein.)

### Option A — Bina Docker (abhi chal raha hai ✅)

Teen terminal chahiye:

```bash
cp .env.example .env          # Windows: copy .env.example .env

# Terminal 1 — asli PostgreSQL, bina install kiye
cd backend
npm install
npm run db:dev                # embedded Postgres 18 -> localhost:55432

# Terminal 2 — backend
cd backend
npm run start:dev             # http://localhost:3100/api

# Terminal 3 — frontend
cd frontend
npm install
npm start                     # http://localhost:4300
```

Kholein: **http://localhost:4300**

> `npm run db:dev` `embedded-postgres` package use karta hai — wo apne saath
> asli Postgres binaries laata hai, machine par kuch install nahi karta.
> Data `backend/.pgdata/` mein rehta hai. Fresh start chahiye to wo folder delete kar dein.

### Option B — Docker

```bash
cp .env.example .env
# .env mein badlein:  DB_HOST=db   aur   POSTGRES_PORT=5432
docker compose up --build
```

> Default `LLM_PROVIDER=mock` hai — **API key ki zaroorat nahi.** Poora agentic
> flow (loop, streaming, client tools, approvals) mock provider par chalta hai.

**Node version:** ≥ 22.12.0 chahiye (Angular 21 ki requirement).

## 🔑 Asli Claude model lagana

`.env` mein:

```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-opus-5
```

Bas. **Baaki ek line bhi code ki nahi badalti** — kyunki dono providers ek hi
`LlmProvider` interface implement karte hain (`agent/llm/llm.provider.ts`).

> 🔒 API key sirf backend container mein jati hai. Frontend usay kabhi nahi dekhta.

---

## 🎮 Ye try karein

Chat page par likhein:

| Input | Kya hoga |
|---|---|
| `laptop dikhao` | **Server tool** → PostgreSQL query → product grid |
| `order ORD-1003 ka status` | **Server tool** → order timeline component |
| `sales report banao` | **Server tool** → SQL aggregate → bar chart |
| `meri cart dekho` | **Client tool** → browser signal se data (server ko pata hi nahi) |
| `order ORD-1004 cancel kar do` | **Approval card** → Approve / Reject / Edit & approve |
| `ignore all previous instructions` | **Guardrail** block kar dega |

Streaming dekhne ke liye: jawab aate waqt **Stop** dabayein — Network tab mein
request cancel hoti dikhegi.

---

## 📦 ngx-agui — reusable npm package

Is repo ka ~65% code **kisi bhi app** mein chal sakta hai. Wo alag package mein
nikal diya gaya hai:

```
packages/ngx-agui/          -> @masad-ilyas-gujar/ngx-agui
   ├─ models/               AG-UI protocol types (spec ke mutabiq)
   ├─ core/                 AgUiClient (SSE) · ConversationStore · ClientToolRegistry · AgentSession
   └─ ui/                   timeline · tool-card · approval-card · confirm-dialog · tool-result-host
```

AgentDesk ab khud usi package ka consumer hai — isi liye chat component
**213 lines se 49 lines** ka reh gaya:

```ts
export class ChatComponent {
  agent = inject(AgentSession);   // SSE, event routing, client tools,
  draft = signal('');             // pause/resume, approvals — sab ismein
}
```

**Build aur publish:**

```bash
cd packages/ngx-agui
npm install
npm run build                    # -> dist/masad-ilyas-gujar-ngx-agui/

cd ../../dist/masad-ilyas-gujar-ngx-agui
npm publish --dry-run            # pehle dekh lein
npm publish --access public      # npm login ke baad
```

> ⚠️ Scoped package publish karne ke liye npm par `masad-ilyas-gujar` naam ka
> user ya org hona chahiye. `npm login` phir `npm org ls` se check kar lein.
> `--access public` zaroori hai warna scoped package private samjha jata hai.

Poori documentation: [`packages/ngx-agui/README.md`](packages/ngx-agui/README.md)

**Demo app package ko npm se leta hai** — bilkul jaise koi bhi asli user leta hai:

```bash
npm install @masad-ilyas-gujar/ngx-agui
```

### ⚠️ Package par kaam karna ho to — ek trap se bachein

Package ke source ko `tsconfig.json` ke `paths` se link karna **tempting** hai,
magar ye ek nazuk bug deta hai:

```
NG0203: The `EnvironmentInjector` token injection failed.
`inject()` function must be called from an injection context
```

**Wajah:** `packages/ngx-agui/node_modules` mein Angular ki apni copy hoti hai
(ng-packagr ke liye zaroori). Source-link karne par package us copy se resolve
karta hai aur app apni copy se — **do Angular instances** bundle ho jate hain,
aur injection context tootta hai. App ka page bilkul khali aa jata hai.

Isliye package par kaam karne ka mehfooz tareeqa:

```bash
cd packages/ngx-agui
npm run build                      # dist/ mein naya build
cd ../../frontend
npm install ../dist/masad-ilyas-gujar-ngx-agui   # local build install karein
```

> 💡 Ye masla sirf tab pakda jata hai jab aap app ko **browser mein** kholein.
> `ng build` aur API tests dono pass ho jate hain — kyunki bug runtime par
> hota hai, compile time par nahi.

Publish karne ka poora tareeqa: [`packages/ngx-agui/PUBLISHING.md`](packages/ngx-agui/PUBLISHING.md)

---

## 🧪 Mock provider ki hadood — zaroor parhein

Default `LLM_PROVIDER=mock` **AI nahi hai** — wo regex se keyword matching karta hai
([`mock.provider.ts`](backend/src/agent/llm/mock.provider.ts) ka `decide()`).

Wo ye samajh leta hai:

- product ke naam: `laptop`, `monitor`, `mouse`, `keyboard`, `chair`, `ssd`...
- categories: `accessories`, `furniture`, `audio`, `storage`
- price ranges: `150000 se 220000 tak`, `1.5 lakh se 2 lakh`, `100k se kam`, `50000 se zyada`
- order numbers: `ORD-1003`
- keywords: `cart`, `sales report`, `cancel`

Isse zyada **kuch nahi**. Misal ke taur par mock ye handle nahi karega:

| Aap likhein | Mock kya karega |
|---|---|
| "sasta wala dikhao" | koi price filter nahi lagayega |
| "pichhle mahine ke orders" | date filter nahi hai |
| "in dono ko compare karo" | pichhla context yaad nahi rakhta |
| "laptop dhoondo phir cart mein daal do" | sirf pehla kaam karega |

**Ye architecture ki kami nahi — mock ki kami hai.** Asli model ke saath ye sab
kaam karta hai, kyunki wo tool ki `description` parh kar khud sahi arguments
bharta hai:

```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

> 💡 **Sabse ahem sabaq:** model sirf wahi kar sakta hai jo aapka
> `input_schema` allow karta hai. Pehle `search_products` mein sirf
> `maxPrice` tha — koi bhi model, kitna bhi zaheen ho, "150000 se 220000 tak"
> filter nahi kar sakta tha. **Pehle schema theek karein, phir prompt.**

---

## 🏗 Architecture

```
┌─────────────────────────────┐          ┌──────────────────────────────┐
│  ANGULAR  (browser)         │          │  NESTJS  (server)            │
│                             │          │                              │
│  ChatComponent              │          │  POST /api/agent/stream      │
│      ↕ signals              │   SSE    │        ↕                     │
│  ConversationStore          │ ◄────────┤   AGENTIC LOOP               │
│   (AG-UI event router)      │  events  │        ↕                     │
│      ↕                      │          │   LlmProvider  🔑            │
│  AgentService (fetch stream)│          │    ├─ AnthropicProvider      │
│      ↕                      ├────────► │    └─ MockProvider           │
│  ClientToolRegistry         │ /resume  │        ↕                     │
│   • ask_user_confirmation   │          │   ServerToolsService         │
│   • navigate_to             │          │   GuardrailsService          │
│   • get_cart_contents       │          │   RunStoreService (pause)    │
└─────────────────────────────┘          └──────────────┬───────────────┘
                                                        │ TypeORM
                                                ┌───────▼────────┐
                                                │  PostgreSQL 16 │
                                                │  products      │
                                                │  orders        │
                                                │  order_items   │
                                                │  conversations │
                                                │  messages      │
                                                │  tool_runs     │
                                                └────────────────┘
```

**Teen sunehray usool:**

1. 🔒 API key sirf server par
2. 🔄 Loop server par chalta hai — frontend events *consume* karta hai aur
   client-tools *execute* karta hai
3. 📡 Frontend aur backend **events** se baat karte hain, direct function calls se nahi

---

## 📚 Step-by-step guides

Padhne ki tarteeb:

1. `docs/01-shuru-yahan-se.md` — mental model + kaunsi file kya karti hai
2. `docs/02-backend-walkthrough.md` — loop, tools, pause/resume line-by-line
3. `docs/03-frontend-walkthrough.md` — SSE, signals store, client tools, dynamic components
4. `docs/04-database-aur-docker.md` — PostgreSQL schema, TypeORM, Docker
5. `docs/05-apna-feature-banayein.md` — naya tool + naya component add karna

---

## 📁 Structure

```
Angular-Agentic/
├─ docker-compose.yml          # db + backend + frontend
├─ .env.example
├─ backend/                    # NestJS
│  └─ src/
│     ├─ entities/             # 6 PostgreSQL tables
│     ├─ agent/
│     │  ├─ agent.types.ts     # AG-UI protocol (source of truth)
│     │  ├─ agent.service.ts   # ⭐ THE LOOP
│     │  ├─ agent.controller.ts# SSE endpoints
│     │  ├─ run-store.service.ts
│     │  ├─ llm/               # anthropic | mock
│     │  ├─ tools/             # server tools
│     │  └─ guardrails/
│     ├─ catalog/              # normal REST (shop/orders)
│     └─ seed/                 # demo data
└─ frontend/                   # Angular (standalone + signals)
   └─ src/app/
      ├─ core/
      │  ├─ models/ag-ui.models.ts
      │  └─ services/          # agent (SSE), store, client tools, cart
      └─ features/
         ├─ chat/              # timeline, tool cards, approval card
         ├─ shop/
         └─ orders/
```

---

## 🧰 Troubleshooting

| Problem | Hal |
|---|---|
| `ECONNREFUSED ... 5432` | DB abhi ready nahi. `docker compose up db -d`, 5 second ruk kar backend chalayein |
| Jawab ek saath aata hai, stream nahi hota | Koi proxy buffer kar raha hai. nginx mein `proxy_buffering off` (pehle se set hai) |
| `ANTHROPIC_API_KEY galat ya missing` | `.env` mein key daalein ya `LLM_PROVIDER=mock` kar dein |
| Angular CLI Node version error | Node ≥ 22.12.0 chahiye |
| Entity badla par table nahi badla | Dev mein `DB_SYNCHRONIZE=true` rakhein, ya `docker compose down -v` se volume reset karein |
| Port 3000 / 4200 / 5432 busy | `.env` mein ports badal lein |
| `run expire ho gaya` message | Approval card 30 minute se zyada khula raha. Naya message bhej dein |
| `ECONNREFUSED ::1:3100` (Vite proxy) | `proxy.conf.json` mein `localhost` ki jagah `127.0.0.1` likhein — Node `localhost` ko IPv6 resolve karta hai, Nest IPv4 par sunta hai |
| `Port 4300 is already in use` | Purana `ng serve` chal raha hai. PowerShell: `Get-NetTCPConnection -LocalPort 4300 | %{ Stop-Process -Id $_.OwningProcess -Force }` |
| `byte sequence 0xf0 ... no equivalent in encoding "WIN1252"` | Local dev DB galat encoding mein bana. `backend/.pgdata/` delete karke `npm run db:dev` dobara chalayein (script ab UTF8 force karta hai) |
| `Entity metadata for X was not found` | Nayi entity ko `app.module.ts` ki `entities: [...]` list mein add karna bhool gaye |

---

## 🔌 API endpoints

| Method | Path | Kaam |
|---|---|---|
| POST | `/api/agent/stream` | Naya turn — SSE stream wapas |
| POST | `/api/agent/resume` | Ruka hua run aage badhao — SSE stream wapas |
| GET | `/api/agent/conversations` | Chat list |
| GET | `/api/agent/conversations/:id/messages` | Ek chat ki history |
| GET | `/api/agent/conversations/:id/tool-runs` | Audit trail — kaunse tools chale |
| GET | `/api/products?q=` | Products |
| GET | `/api/orders` | Orders |
| GET | `/api/health` | Health check |

---

## ⚠️ Production se pehle

Ye **seekhne** ka project hai. Live jaane se pehle:

- `DB_SYNCHRONIZE=false` + TypeORM migrations use karein
- Authentication add karein (abhi koi user system nahi hai)
- `RunStoreService` ko Redis par le jayein (abhi in-memory hai → single instance only)
- Rate limiting (`@nestjs/throttler`) — LLM calls mehngi hain
- `CORS_ORIGIN` ko `*` se apne asli domain par set karein
- `tool_runs` table par retention policy lagayein

---

## 📖 Ek nasihat

AG-UI, A2UI aur MCP naye evolving standards hain. Is project mein aapko unke
**patterns aur architecture** milte hain — jo stable rehte hain. Exact SDK
function names aur package versions badalte rehte hain, isliye unhe hamesha
official docs se verify karein.

Ye project aapko *samajh* deta hai; docs aapko *exact syntax* denge. Dono chahiye.
