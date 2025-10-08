import { createHash } from 'crypto';

export function normalizeEmail(raw) {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

export function emailHash(raw) {
  const normalized = normalizeEmail(raw);
  return createHash('sha256').update(normalized).digest('hex');
}
