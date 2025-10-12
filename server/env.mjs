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

function parseBoolean(value, fallback = false) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const normalised = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalised)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalised)) {
    return false;
  }
  return fallback;
}

function normaliseSameSite(value) {
  if (typeof value !== 'string') {
    return 'lax';
  }
  const normalised = value.trim().toLowerCase();
  if (normalised === 'none' || normalised === 'strict') {
    return normalised;
  }
  return 'lax';
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

export function getSessionCookieConfig() {
  const name = optionalEnv('SESSION_COOKIE_NAME', 'akadeo.sid');
  const sameSite = normaliseSameSite(optionalEnv('COOKIE_SAMESITE', 'lax'));
  const secureEnv = optionalEnv('COOKIE_SECURE');
  const secure = secureEnv === undefined ? isProduction() : parseBoolean(secureEnv, isProduction());
  const domain = optionalEnv('COOKIE_DOMAIN') || undefined;
  const maxAgeDays = parsePositiveInteger(optionalEnv('SESSION_COOKIE_DAYS'), 7);
  const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;

  return {
    name,
    cookie: {
      httpOnly: true,
      sameSite,
      secure,
      maxAge,
      domain,
      path: '/',
    },
  };
}
