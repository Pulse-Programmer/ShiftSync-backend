import fs from 'fs';
import path from 'path';
import { pool } from './pool';

const SEEDS_DIR = path.resolve(__dirname, 'seeds');

async function runSeeds() {
  console.log('Running seed data...');

  const files = fs.readdirSync(SEEDS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`Applying seed: ${file}`);
    const sql = fs.readFileSync(path.join(SEEDS_DIR, file), 'utf-8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
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

  console.log('Seed data applied successfully.');
  await pool.end();
}

runSeeds().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
