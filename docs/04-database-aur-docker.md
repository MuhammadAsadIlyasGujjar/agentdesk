# 04 · PostgreSQL, TypeORM aur Docker

---

## Schema — 6 tables

```
products                    orders                    order_items
─────────                   ──────                    ───────────
id (uuid) PK                id (uuid) PK              id (uuid) PK
sku (unique)                orderNumber (unique)      orderId FK ──┐
name                        customerName              productId    │
description                 customerEmail             productName  │
category                    status                    unitPrice    │
price (numeric)             total (numeric)           quantity     │
stock (int)                 createdAt                              │
emoji                       updatedAt  ◄──────────────────────────┘
rating (numeric)

conversations               messages                  tool_runs
─────────────               ────────                  ─────────
id (uuid) PK                id (uuid) PK              id (uuid) PK
title                       conversationId FK         conversationId
createdAt                   role                      toolName
updatedAt  ◄───────────     content (jsonb) ⭐        side (server|client)
                            seq (int)                 args (jsonb)
                            createdAt                 result (jsonb)
                                                      status
                                                      durationMs
```

---

## ⭐ `messages.content` jsonb kyun?

Hum plain text store **nahi** karte:

```jsonc
// role: 'assistant'
[
  { "type": "text", "text": "Products dhoond raha hoon..." },
  { "type": "tool_use", "id": "toolu_abc", "name": "search_products",
    "input": { "query": "laptop" } }
]

// role: 'user'  (agla message — tool ka result)
[
  { "type": "tool_result", "tool_use_id": "toolu_abc",
    "content": "<tool_result ...>{...}</tool_result>" }
]
```

**Faida:** yehi shape LLM API bhi expect karta hai. DB se uthaya, seedha bhej
diya — koi conversion layer nahi.

Agar aap text column use karte, to har baar tool calls ko encode/decode karna
padta, aur `tool_use_id` ki pairing kahin alag rakhni padti.

---

## Numeric transformer — ek classic bug

Postgres ka `numeric` JS mein **string** ban kar aata hai (precision bachane
ke liye). Yaani:

```ts
price * qty        // "145000" * 2  →  kabhi kabhi NaN, kabhi galat
price + tax        // "145000" + "500"  →  "145000500"  😱
```

`entities/numeric.transformer.ts`:

```ts
export const numericTransformer = {
  to:   (value: number | null) => value,
  from: (value: string | null) => value == null ? null : parseFloat(value),
};
```

Har `numeric` column par lagayein:

```ts
@Column({ type: 'numeric', precision: 12, scale: 2, transformer: numericTransformer })
price: number;
```

---

## `synchronize: true` — dost aur dushman

`app.module.ts`:

```ts
synchronize: (config.get('DB_SYNCHRONIZE') ?? 'true') === 'true',
```

**Dev mein:** entity badla → table khud badal gaya. Bohat aasaan.

**Production mein:** 🔴 **kabhi nahi.** Ek galat entity change poora column
drop kar sakta hai — data ke saath. Production mein:

```bash
DB_SYNCHRONIZE=false
npx typeorm migration:generate -d ./dist/data-source.js src/migrations/AddX
npx typeorm migration:run
```

---

## Docker Compose ka anatomy

### Healthcheck — kyun zaroori hai

```yaml
db:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
    interval: 5s
    retries: 12

backend:
  depends_on:
    db:
      condition: service_healthy      # ← ye line
```

`depends_on` akela sirf ye kehta hai "db **container start** ho jaye". Lekin
Postgres container start hone ke 3-4 second baad connections leta hai.
`condition: service_healthy` ke bagair backend `ECONNREFUSED` de kar mar jata hai.

Double safety ke liye TypeORM mein bhi:

```ts
retryAttempts: 10,
retryDelay: 3000,
```

### Service name = hostname

```yaml
environment:
  DB_HOST: db          # ← compose ka service name
```

Docker ka apna DNS hai. Container ke andar `db` naam se Postgres milta hai.
Isi liye local dev mein `DB_HOST=localhost` karna padta hai — wahan compose
ka DNS nahi hota.

### Named volume = data bacha rehta hai

```yaml
volumes:
  - pgdata:/var/lib/postgresql/data
```

`docker compose down` → data bacha rehta hai.
`docker compose down -v` → **data khatam** (fresh start ke liye).

---

## Multi-stage Dockerfile

`backend/Dockerfile`:

```dockerfile
FROM node:22-alpine AS build          # stage 1: compile
WORKDIR /app
COPY package*.json ./                 # ← pehle sirf package.json
RUN npm install                       #    taake ye layer cache ho jaye
COPY . .
RUN npm run build

FROM node:22-alpine                   # stage 2: sirf chalane ke liye
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist    # ← sirf compiled JS
CMD ["node", "dist/main.js"]
```

Do faide:
1. **Image chhoti** — TypeScript, source, dev deps final image mein nahi jate
2. **Build tez** — `package.json` na badle to `npm install` ki layer cache se aati hai

---

## nginx — SSE ke liye teen lines

`frontend/nginx.conf`:

```nginx
location /api/ {
  proxy_pass http://backend:3000/api/;
  proxy_buffering off;      # 🔴 warna nginx poora jawab jama karke bhejega
  proxy_cache off;
  proxy_read_timeout 3600s; # lambi conversations timeout na hon
}
```

Agar aapki streaming "kaam nahi kar rahi" aur poora jawab ek saath aa raha hai —
99% baar wajah `proxy_buffering` hoti hai.

---

## Useful commands

```bash
docker compose up --build          # sab kuch banao aur chalao
docker compose up db -d            # sirf database
docker compose logs -f backend     # backend logs live
docker compose down                # rok do (data bacha rahega)
docker compose down -v             # rok do + data uda do

# DB ke andar jhaank kar dekhna
docker compose exec db psql -U agent -d agentdesk

# psql ke andar:
\dt                                        -- tables
SELECT * FROM tool_runs ORDER BY "createdAt" DESC LIMIT 10;
SELECT role, jsonb_pretty(content) FROM messages ORDER BY seq;
```

Wo aakhri query bohat kaam ki hai — usse aap **bilkul wahi dekh sakte hain jo
model ne dekha tha.** Jab agent ajeeb behave kare, sabse pehle wahi dekhein.

---

## Bonus — Docker ke bagair asli PostgreSQL

Agar machine par Docker ya Postgres install nahi hai, phir bhi asli Postgres
chal sakta hai:

```bash
cd backend
npm run db:dev        # embedded Postgres 18 -> localhost:55432
```

`backend/scripts/dev-db.mjs` `embedded-postgres` package use karta hai — wo
apne saath asli Postgres binaries (~108 MB) laata hai. Machine par kuch install
nahi hota. Data `backend/.pgdata/` mein rehta hai; fresh start chahiye to wo
folder delete kar dein.

### Windows par ek gotcha — encoding

Windows par embedded Postgres cluster **WIN1252** encoding mein banta hai.
Us encoding mein emoji (📦, 💻) store nahi ho sakte:

```
QueryFailedError: character with byte sequence 0xf0 0x9f 0x93 0xa6 in
encoding "UTF8" has no equivalent in encoding "WIN1252"
```

Isliye `scripts/ensure-utf8-db.mjs` database ko explicitly UTF8 mein banata hai:

```sql
CREATE DATABASE agentdesk
  WITH ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C';
```

Docker wale `postgres:16-alpine` mein ye masla nahi — wahan default UTF8 hai.

### `autoLoadEntities` ka trap

Pehle `app.module.ts` mein `autoLoadEntities: true` tha. Wo **sirf un entities
ko uthata hai jo kisi `TypeOrmModule.forFeature([...])` mein likhi hon.**

`OrderItem` kahin `forFeature` mein nahi thi (uska apna repository kisi ko
chahiye hi nahi tha — wo `Order` ke cascade se save hoti hai). Nateeja app
start hote hi:

```
TypeORMError: Entity metadata for Order#items was not found
```

Isliye ab entities ki list saaf likhi hui hai:

```ts
entities: [Product, Order, OrderItem, Conversation, ChatMessage, ToolRun],
```

> 💡 **Sabaq:** nayi entity banayein to usay is list mein add karna na bhoolein.
> Jo entity kisi relation ka hissa hai magar uska apna repository nahi —
> wo `autoLoadEntities` se chhoot jati hai.
