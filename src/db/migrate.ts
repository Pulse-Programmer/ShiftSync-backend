import fs from 'fs';
import path from 'path';
import { pool, query } from './pool';

const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');

async function ensureMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(): Promise<string[]> {
  const result = await query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map((row: { name: string }) => row.name);
}

async function getMigrationFiles(): Promise<string[]> {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
  return files;
}

async function runMigrations() {
  console.log('Starting migrations...');

  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const files = await getMigrationFiles();

  const pending = files.filter(f => !applied.includes(f));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    await pool.end();
    return;
  }

  for (const file of pending) {
    console.log(`Applying migration: ${file}`);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`  Applied: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  Failed: ${file}`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log(`Applied ${pending.length} migration(s).`);
  await pool.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
