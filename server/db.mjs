import mysql from 'mysql2/promise';
import { requireEnv } from './env.mjs';

let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: requireEnv('DB_HOST'),
      port: Number.parseInt(requireEnv('DB_PORT', '3306'), 10),
      user: requireEnv('DB_USER'),
      password: requireEnv('DB_PASSWORD'),
      database: requireEnv('DB_NAME'),
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: Number.parseInt(process.env.DB_POOL_SIZE ?? '10', 10),
      queueLimit: 0,
    });
  }
  return pool;
}

export async function withConnection(fn) {
  const connection = await getPool().getConnection();
  try {
    return await fn(connection);
  } finally {
    connection.release();
  }
}

export async function cleanupExpiredVerifications(connection) {
  await connection.execute('DELETE FROM account_verifications WHERE expires_at < UTC_TIMESTAMP()');
}
