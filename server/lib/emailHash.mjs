import { createHash } from 'node:crypto';

export function normalizeEmail(raw) {
  if (typeof raw !== 'string') return '';
  return raw.trim().toLowerCase();
}

export function computeEmailHash(normalized) {
  return createHash('sha256').update(normalized).digest('hex');
}

export function emailHash(raw) {
  return computeEmailHash(normalizeEmail(raw));
}
