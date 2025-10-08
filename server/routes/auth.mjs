import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { cleanupExpiredVerifications, getPool } from '../db.mjs';
import { sendVerificationEmail } from '../email.mjs';
import { HttpError, asyncHandler, jsonOk, methodNotAllowed } from '../utils.mjs';

function normaliseEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

function validateEmail(email) {
  return /[^@\s]+@[^@\s]+\.[^@\s]+/.test(email);
}

function isStrongPassword(password) {
  if (typeof password !== 'string' || password.length < 12) {
    return false;
  }
  return (
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function generateVerificationCode() {
  const num = Math.floor(Math.random() * 1_000_000);
  return String(num).padStart(6, '0');
}

function expiresAtUtc(hours = 24) {
  const date = new Date(Date.now() + hours * 60 * 60 * 1000);
  const iso = date.toISOString();
  return iso.slice(0, 19).replace('T', ' ');
}

const authRouter = Router();

authRouter.options('/register', (req, res) => {
  res.set('Allow', 'POST, OPTIONS');
  jsonOk(res, { message: 'Ready' });
});

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    const fullName = String(body.fullName ?? '').trim();
    const institution = String(body.institution ?? '').trim();
    const email = normaliseEmail(body.email);
    const password = body.password ?? '';

    if (fullName.length < 2) {
      throw new HttpError(422, 'VALIDATION', 'Enter your full name.', {
        code: 'E_INVALID_FULL_NAME',
        details: { field: 'fullName' },
      });
    }

    if (!validateEmail(email)) {
      throw new HttpError(422, 'VALIDATION', 'Enter a valid email address.', {
        code: 'E_INVALID_EMAIL',
        details: { field: 'email' },
      });
    }

    if (!isStrongPassword(password)) {
      throw new HttpError(422, 'VALIDATION', 'Use a stronger password.', {
        code: 'E_WEAK_PASSWORD',
        details: { field: 'password' },
      });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    const releaseConnection = () => {
      try {
        connection.release();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to release MySQL connection', error);
      }
    };

    let verificationCode = null;
    let inTransaction = false;

    try {
      await cleanupExpiredVerifications(connection);

      const [existingUsers] = await connection.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
      if (Array.isArray(existingUsers) && existingUsers.length > 0) {
        throw new HttpError(409, 'CONFLICT', 'An account with that email already exists.', {
          code: 'E_USER_EXISTS',
          details: { field: 'email' },
        });
      }

      verificationCode = generateVerificationCode();
      const passwordHash = await bcrypt.hash(String(password), 12);
      const expiresAt = expiresAtUtc(24);

      await connection.beginTransaction();
      inTransaction = true;
      await connection.execute('DELETE FROM account_verifications WHERE email = ?', [email]);
      await connection.execute(
        'INSERT INTO account_verifications (full_name, institution, email, password_hash, verification_code, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())',
        [fullName, institution, email, passwordHash, verificationCode, expiresAt]
      );
      await connection.commit();
      inTransaction = false;
    } catch (error) {
      if (inTransaction) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          // eslint-disable-next-line no-console
          console.error('Failed to roll back transaction', rollbackError);
        }
      }
      releaseConnection();
      throw error;
    }

    releaseConnection();

    try {
      await sendVerificationEmail({ email, name: fullName, code: verificationCode });
    } catch (error) {
      const cleanupConnection = await pool.getConnection();
      try {
        await cleanupConnection.execute('DELETE FROM account_verifications WHERE email = ?', [email]);
      } finally {
        cleanupConnection.release();
      }
      const mailError = new HttpError(
        500,
        'INTERNAL',
        'We could not send the verification email. Please try again.',
        {
          code: 'E_EMAIL_SEND_FAILED',
        }
      );
      mailError.cause = error;
      throw mailError;
    }

    jsonOk(res, { message: 'Verification email sent.' }, 201);
  })
);

authRouter.all('/register', (req, res) => {
  methodNotAllowed(res, ['POST', 'OPTIONS'], 'Use POST for registration.');
});

export default authRouter;
