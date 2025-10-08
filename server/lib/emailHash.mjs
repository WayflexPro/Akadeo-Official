export { emailHash, normalizeEmail } from './emailTools.mjs';

export function computeEmailHash(normalized) {
  return emailHash(normalized);
}
