import 'dotenv/config';

/**
 * Read an environment variable or throw an error if it is missing.
 * @param {string} key
 * @param {string|undefined} fallback
 * @returns {string}
 */
export function requireEnv(key, fallback) {
  const raw = process.env[key];
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw;
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(`Environment variable "${key}" is not set.`);
}

/**
 * Read an environment variable and return a fallback when empty.
 * @param {string} key
 * @param {string|undefined} fallback
 * @returns {string|undefined}
 */
export function optionalEnv(key, fallback) {
  const raw = process.env[key];
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw;
  }
  return fallback;
}

/**
 * Determine whether we are running in production.
 * @returns {boolean}
 */
export function isProduction() {
  const env = optionalEnv('APP_ENV') || optionalEnv('ENVIRONMENT') || optionalEnv('NODE_ENV');
  if (!env) {
    return false;
  }
  const normalised = env.toLowerCase();
  return normalised === 'prod' || normalised === 'production';
}
