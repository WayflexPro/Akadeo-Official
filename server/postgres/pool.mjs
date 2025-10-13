import pg from 'pg';
import { optionalEnv, requireEnv } from '../env.mjs';

const { Pool } = pg;

let pool;
let createPool = defaultCreatePool;

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

function defaultCreatePool() {
  const connectionString = requireEnv('DATABASE_URL');
  const config = { connectionString };
  const max = optionalEnv('PG_POOL_SIZE');
  if (max !== undefined) {
    const parsed = parsePositiveInteger(max, null);
    if (parsed) {
      config.max = parsed;
    }
  }
  return new Pool(config);
}

export function getPostgresPool() {
  if (!pool) {
    pool = createPool();
    pool.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('Unexpected PostgreSQL client error', err);
    });
  }
  return pool;
}

export function ensureSqlText(sql) {
  if (typeof sql !== 'string' || sql.trim() === '') {
    throw new Error('Attempted to execute an empty SQL query.');
  }
  return sql;
}

export async function safeQuery(clientOrPool, sql, params = []) {
  const text = ensureSqlText(sql);
  return clientOrPool.query(text, params);
}

export function setPostgresPoolFactoryForTests(factory) {
  pool = undefined;
  createPool = typeof factory === 'function' ? factory : defaultCreatePool;
}

export async function closePostgresPool() {
  if (pool && typeof pool.end === 'function') {
    try {
      await pool.end();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to close PostgreSQL pool', error);
    }
  }
  pool = undefined;
  createPool = defaultCreatePool;
}
