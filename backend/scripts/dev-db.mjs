/**
 * LOCAL DEV ONLY — Docker ke bagair asli PostgreSQL chalane ke liye.
 *
 * `embedded-postgres` package apne saath asli Postgres binaries laata hai,
 * isliye machine par kuch install karne ki zaroorat nahi.
 * Production/normal setup mein docker-compose wala Postgres use karein.
 *
 *   npm run db:dev        -> chalu (Ctrl+C se band)
 */
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ensureUtf8Database } from './ensure-utf8-db.mjs';

const DATA_DIR = fileURLToPath(new URL('../.pgdata', import.meta.url));
const PORT = Number(process.env.DB_PORT ?? 55432);
const USER = process.env.DB_USER ?? 'agent';
const PASSWORD = process.env.DB_PASSWORD ?? 'agent123';
const DB_NAME = process.env.DB_NAME ?? 'agentdesk';

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: USER,
  password: PASSWORD,
  port: PORT,
  persistent: true,          // data .pgdata folder mein bacha rehta hai
});

if (!existsSync(DATA_DIR)) {
  console.log('[dev-db] pehli baar — data directory bana raha hoon...');
  await pg.initialise();
}

await pg.start();

// Emoji ke liye UTF8 lazmi hai (Windows par cluster default WIN1252 hota hai)
await ensureUtf8Database(PORT, USER, PASSWORD, DB_NAME);

console.log('[dev-db] ✅ PostgreSQL ready  ->  localhost:' + PORT + '  db=' + DB_NAME + '  user=' + USER);
console.log('[dev-db] band karne ke liye Ctrl+C');

const shutdown = async () => {
  console.log('\n[dev-db] band kar raha hoon...');
  try { await pg.stop(); } catch { /* ignore */ }
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
