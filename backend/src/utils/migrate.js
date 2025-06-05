#!/usr/bin/env node
/**
 * Simple migration script for FitZone Pro
 * Reads SQL files from the migrations directory and executes them using a
 * PostgreSQL connection string supplied via the DATABASE_URL environment variable.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DB_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DB_URL) {
  console.error('Error: DATABASE_URL environment variable not set.');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, '..', '..', 'migrations');

async function runMigrations() {
  const client = new Client({ connectionString: DB_URL });
  try {
    await client.connect();
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`\nRunning migration: ${file}`);
      await client.query(sql);
    }
    console.log('\n✅ All migrations executed successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
