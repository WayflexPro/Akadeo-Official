import { randomUUID } from 'node:crypto';

const VALID_ERROR_TYPES = new Set([
  'VALIDATION',
  'AUTH',
  'CONFLICT',
  'NOT_FOUND',
  'RATE_LIMIT',
  'INTERNAL',
  'METHOD_NOT_ALLOWED',
]);

function normaliseErrorType(type, status) {
  if (typeof type === 'string' && VALID_ERROR_TYPES.has(type.toUpperCase())) {
    return type.toUpperCase();
  }
  return status >= 500 ? 'INTERNAL' : 'VALIDATION';
}

export class HttpError extends Error {
  /**
   * @param {number} status
   * @param {string} type
   * @param {string} message
   * @param {{ code?: string|null, details?: any }} [options]
   */
  constructor(status, type, message, options = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.type = normaliseErrorType(type, status);
    this.code = options.code ?? null;
    this.details = options.details ?? null;
  }
}

function responseMeta(res) {
  const requestId = res.locals.requestId || randomUUID();
  res.locals.requestId = requestId;
  return {
    requestId,
    ts: new Date().toISOString(),
  };
}

export function withRequestId(req, res, next) {
  if (!res.locals) {
    res.locals = {};
  }
  const id = randomUUID();
  res.locals.requestId = id;
  req.requestId = id;
  next();
}

export function jsonOk(res, data = null, status = 200) {
  res.status(status).json({
    ok: true,
    data,
    meta: responseMeta(res),
  });
}

export function jsonError(res, type, message, status = 400, options = {}) {
  const errorType = normaliseErrorType(type, status);
  res.status(status).json({
    ok: false,
    error: {
      type: errorType,
      message,
      code: options.code ?? null,
      details: options.details ?? null,
    },
    meta: responseMeta(res),
  });
}

export function methodNotAllowed(res, allow, message = 'Use POST for this endpoint.') {
  if (allow) {
    res.set('Allow', allow.join(', '));
  }
  jsonError(res, 'METHOD_NOT_ALLOWED', message, 405, {
    code: 'E_METHOD_NOT_ALLOWED',
  });
}

export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
