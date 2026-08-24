# 05 · Apna feature banayein

Teen recipes. Har ek mein exactly kaunsi file chhooni hai.

---

## Recipe 1 — Naya SERVER tool (5 minute)

Maan lein aapko `check_stock` chahiye.

### Step 1 — Definition add karein

`backend/src/agent/tools/server-tools.service.ts` → `definitions` array:

```ts
{
  name: 'check_stock',
  description:
    'Kisi product ka stock check karo. Jab user poochhe "kitne bache hain" ' +
    'ya "available hai kya" tab use karo.',
  input_schema: {
    type: 'object',
    properties: {
      sku: { type: 'string', description: 'Product SKU, e.g. "LAP-001"' },
    },
    required: ['sku'],
  },
  side: 'server',
  risk: 'low',
},
```

> ⭐ `description` par 2 minute lagayein. Model isi ko padh kar decide karta
> hai. "Product ka stock" se behtar hai "jab user poochhe kitne bache hain".
> **Examples likhein, definitions nahi.**

### Step 2 — Execution add karein

Usi file mein `execute()` ke switch mein:

```ts
case 'check_stock':
  return this.checkStock(args);
```

Aur method:

```ts
private async checkStock(args: any) {
  const product = await this.products.findOne({ where: { sku: args.sku } });
  if (!product) return { found: false, message: 'SKU nahi mila: ' + args.sku };

  return {
    found: true,
    sku: product.sku,
    name: product.name,
    stock: product.stock,
    status: product.stock === 0 ? 'out_of_stock'
          : product.stock < 5   ? 'low'
          : 'available',
  };
}
```

**Bas.** Model ko naya tool khud mil jayega — kahin register karne ki zaroorat
nahi, kyunki `definitions` hi source of truth hai.

### Step 3 (optional) — Mock provider ko sikhayein

`llm/mock.provider.ts` → `decide()`:

```ts
if (/stock|bache|available/.test(text) && available.has('check_stock')) {
  const sku = text.match(/([A-Z]{3}-\d{3})/i)?.[1] ?? 'LAP-001';
  return { tool: 'check_stock', args: { sku }, preamble: 'Stock check kar raha hoon...\n' };
}
```

(Asli Claude ke saath is step ki zaroorat nahi — wo `description` padh kar
khud samajh jata hai.)

---

## Recipe 2 — Naya CLIENT tool

Kab client tool banayein? **Jab data ya capability sirf browser mein ho:**

| Client tool | Server tool |
|---|---|
| Scroll position, form ki current state | DB queries |
| Geolocation, camera, clipboard | Email, payments |
| User se poochhna | Kisi bhi cheez ka secret |
| Angular router navigation | Baaki sab |

`frontend/src/app/core/services/client-tool.registry.ts` → `tools` array:

```ts
{
  name: 'apply_filter',
  description: 'Shop page par category filter lagao. Available: ' +
               'Laptops, Monitors, Accessories, Audio, Storage, Furniture.',
  input_schema: {
    type: 'object',
    properties: { category: { type: 'string' } },
    required: ['category'],
  },
  execute: async ({ category }) => {
    this.filterStore.setCategory(String(category));   // apna signal store
    return { applied: true, category };
  },
},
```

Backend mein kuch **nahi** badalna. Schema khud pahunch jata hai, aur
`allTools()` usay `side: 'client'` mark kar deta hai.

> 🛡️ Allowlist yaad rakhein. `navigate_to` dekhein — wo sirf 3 routes allow
> karta hai. Model ko khuli chhoot mat dein.

---

## Recipe 3 — Tool result ka apna component

Abhi `check_stock` ka result JSON fallback mein dikhega. Achha card banayein:

### Step 1 — Component

`frontend/src/app/features/chat/tool-views/stock-card.component.ts`:

```ts
@Component({
  selector: 'app-stock-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stock" [class.low]="d()?.status === 'low'">
      <strong>{{ d()?.name }}</strong>
      <div>{{ d()?.stock }} units — {{ d()?.status }}</div>
    </div>
  `,
  styles: [`
    .stock { padding: 10px; border-radius: 8px; background: #f0fdf4; }
    .stock.low { background: #fffbeb; }
  `],
})
export class StockCardComponent {
  data = input<any>();
  d = computed(() => this.data());
}
```

### Step 2 — Map mein daalein

`features/chat/components/tool-result-host.component.ts`:

```ts
const COMPONENT_MAP: Record<string, Type<unknown>> = {
  search_products: ProductGridComponent,
  check_stock:     StockCardComponent,     // ← nayi line
  ...
};
```

Import bhi add karein. **Bas.**

---

## Recipe 4 — Kisi tool ko high-risk banana

```ts
{
  name: 'send_email',
  description: '...',
  input_schema: { ... },
  side: 'server',
  risk: 'high',          // ← sirf ye
}
```

Ab automatically:
1. `guardrails.checkToolCall()` `needsApproval: true` dega
2. Loop `APPROVAL_REQUIRED` yield karke ruk jayega
3. Frontend approval card dikhayega (Approve / Reject / Edit & approve)
4. Approve par `resumeRun()` server par tool chalayega

**Risk table** — apne project ke liye khud banayein:

| Risk | Misalein | Behaviour |
|---|---|---|
| 🟢 low | search, read, calculate | Auto-run, bas dikha do |
| 🟡 medium | draft banao, filter badlo | Dikhao, undo do |
| 🔴 high | email bhejo, delete, payment | **Ruko — approval maango** |

---

## Recipe 5 — Naya page

1. `frontend/src/app/features/<naam>/<naam>.component.ts` banayein
2. `app.routes.ts` mein `loadComponent` se lazy route add karein
3. `app.ts` ke nav mein link daalein
4. `client-tool.registry.ts` → `navigate_to` ki allowlist mein route add karein
   (warna agent wahan le nahi ja payega)

---

## Debug kaise karein

| Sawal | Kahan dekhein |
|---|---|
| Model ne tool kyun nahi chalaya? | `description` — 90% baar wajah yahi hoti hai |
| Model ne exactly kya dekha? | `SELECT jsonb_pretty(content) FROM messages ORDER BY seq;` |
| Kaunse tools chale, kitni der lagi? | `GET /api/agent/conversations/:id/tool-runs` |
| Streaming kyun nahi ho rahi? | nginx `proxy_buffering off`, ya DevTools → Network → EventStream tab |
| Resume kyun nahi hua? | Browser console — `awaitingApproval` ya `clientWork` pending hoga |
| API 400 "tool_use ids" | Koi `tool_use` bina `tool_result` ke reh gaya. `loadContext()` ki trimming dekhein |

---

## Agla qadam — course ke baaki modules

Ye project M1, M2, M5, M6 cover karta hai. Aage:

**MODULE 3 (A2UI):** model khud component tree bheje.
Jagah pehle se tayyar hai — `conversation.store.ts` mein `case 'CUSTOM':`.
Backend se `{ type: 'CUSTOM', name: 'a2ui_tree', value: tree }` bhejein, aur
ek recursive `A2uiNodeComponent` banayein jo catalog se components banaye.

**MODULE 4 (MCP):** `@modelcontextprotocol/sdk` se MCP client banayein,
`mcpClient.listTools()` ko `allTools()` mein mila dein, aur `execute()` mein
MCP tools ko `mcpClient.callTool()` par bhej dein. Guardrails already tayyar
hain — MCP ka data automatically `wrapUntrustedData()` se guzrega.

**MODULE 7-8:** RunStore ko Redis par le jayein, `@nestjs/throttler` lagayein,
aur `tool_runs` table par ek dashboard bana lein.
