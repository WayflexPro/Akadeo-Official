import { HttpError } from '../utils.mjs';

/**
 * Ensure the request has a session object available.
 * @param {import('express').Request} req
 */
export function ensureSession(req) {
  if (!req.session) {
    throw new HttpError(500, 'INTERNAL', 'Session store unavailable.', {
      code: 'E_SESSION_UNAVAILABLE',
    });
  }
  return req.session;
}

/**
 * Extract the authenticated user from the current session.
 * @param {import('express').Request} req
 */
export function requireAuthenticatedUser(req) {
  const session = ensureSession(req);
  const userId = session.userId;
  if (!userId) {
    throw new HttpError(401, 'AUTH', 'You must be signed in to continue.', {
      code: 'E_NOT_AUTHENTICATED',
    });
  }
  return {
    userId: Number.parseInt(userId, 10),
    setupCompletedAt: session.setupCompletedAt ?? null,
  };
}

/**
 * Mark the current session as having completed the onboarding/setup flow.
 * @param {import('express').Request} req
 */
export function markSessionSetupComplete(req) {
  const session = ensureSession(req);
  session.setupCompletedAt = new Date().toISOString();
  return new Promise((resolve, reject) => {
    session.save((err) => {
      if (err) {
        reject(
          new HttpError(500, 'INTERNAL', 'Failed to update session.', {
            code: 'E_SESSION_UPDATE_FAILED',
          })
        );
        return;
      }
      resolve();
    });
  });
}
