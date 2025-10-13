import { Router } from 'express';
import { getPostgresPool, safeQuery } from '../postgres/pool.mjs';
import { HttpError, asyncHandler, jsonError, jsonOk, methodNotAllowed } from '../utils.mjs';
import { getAuthenticatedSessionUser } from './auth.mjs';

const classesRouter = Router();

function normaliseCodeParam(value) {
  if (Array.isArray(value)) {
    return normaliseCodeParam(value[0]);
  }
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toUpperCase();
}

classesRouter.options('/exists', (req, res) => {
  res.set('Allow', 'GET, OPTIONS');
  jsonOk(res, { message: 'Ready' });
});

classesRouter.get(
  '/exists',
  asyncHandler(async (req, res) => {
    let sessionUser;
    try {
      sessionUser = getAuthenticatedSessionUser(req);
    } catch (error) {
      if (error instanceof HttpError && error.code === 'E_NOT_AUTHENTICATED') {
        jsonError(res, error.type, error.message, error.status, { code: error.code });
        return;
      }
      throw error;
    }

    if (!sessionUser) {
      jsonError(res, 'AUTH', 'You must be signed in to continue.', 401, {
        code: 'E_NOT_AUTHENTICATED',
      });
      return;
    }

    const code = normaliseCodeParam(req.query.code);

    if (!code) {
      throw new HttpError(422, 'VALIDATION', 'Provide a class code to check.', {
        code: 'E_INVALID_CLASS_CODE',
        details: { field: 'code' },
      });
    }

    if (code.length < 6 || code.length > 10) {
      throw new HttpError(422, 'VALIDATION', 'Class codes must be between 6 and 10 characters.', {
        code: 'E_INVALID_CLASS_CODE',
        details: { field: 'code' },
      });
    }

    const client = await getPostgresPool().connect();

    try {
      const result = await safeQuery(
        client,
        'SELECT 1 FROM classes WHERE code = $1 LIMIT 1',
        [code]
      );

      jsonOk(res, { exists: result.rowCount > 0 });
    } finally {
      client.release();
    }
  })
);

classesRouter.all('/exists', (req, res) => {
  methodNotAllowed(res, ['GET', 'OPTIONS'], 'Use GET to check if a class code exists.');
});

export default classesRouter;
