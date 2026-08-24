import pkg from 'pg';
const { Client } = pkg;

/**
 * ⚠️ Windows par embedded Postgres cluster ka default encoding WIN1252 hota hai.
 * Us encoding mein emoji (📦, 💻) store nahi ho sakte — seed data fail ho jata hai.
 * Isliye database ko explicitly UTF8 + template0 se banate hain.
 * (Docker wale postgres:16-alpine mein ye masla nahi — wahan default UTF8 hai.)
 */
export async function ensureUtf8Database(port, user, password, dbName) {
  const admin = new Client({ host: 'localhost', port, user, password, database: 'postgres' });
  await admin.connect();

  const { rows } = await admin.query('SELECT datname, pg_encoding_to_char(encoding) AS enc FROM pg_database WHERE datname = $1', [dbName]);

  if (rows.length && rows[0].enc !== 'UTF8') {
    console.log('[dev-db] purana database ' + rows[0].enc + ' encoding mein hai — dobara bana raha hoon (UTF8)');
    await admin.query('DROP DATABASE ' + dbName);
    rows.length = 0;
  }

  if (!rows.length) {
    await admin.query(
      'CREATE DATABASE ' + dbName + " WITH ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'",
    );
    console.log('[dev-db] database bana (UTF8): ' + dbName);
  }

  await admin.end();
}
