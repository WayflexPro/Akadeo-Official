import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { cleanupExpiredVerifications, getPool } from '../db.mjs';
import { sendVerificationEmail } from '../email.mjs';
import { emailHash, normalizeEmail } from '../lib/emailTools.mjs';
import { HttpError, asyncHandler, jsonOk, methodNotAllowed } from '../utils.mjs';

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

const GRADE_LEVEL_OPTIONS = new Set(['k5', '68', '912', 'higher_ed', 'other']);
const STUDENT_COUNT_OPTIONS = new Set(['under_50', '50_150', '150_500', 'over_500']);
const COUNTRY_OPTIONS = new Set(['US', 'CA', 'UK', 'AU', 'NZ', 'OTHER']);

function toIsoOrNull(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function ensureSession(req) {
  if (!req.session) {
    throw new HttpError(500, 'INTERNAL', 'Session store unavailable.', {
      code: 'E_SESSION_UNAVAILABLE',
    });
  }
  return req.session;
}

function establishUserSession(req, userId, setupCompletedAt) {
  const session = ensureSession(req);
  return new Promise((resolve, reject) => {
    session.regenerate((err) => {
      if (err) {
        reject(new HttpError(500, 'INTERNAL', 'Could not establish session.', {
          code: 'E_SESSION_REGENERATE_FAILED',
        }));
        return;
      }
      req.session.userId = Number.parseInt(userId, 10);
      req.session.setupCompletedAt = toIsoOrNull(setupCompletedAt);
      req.session.save((saveErr) => {
        if (saveErr) {
          reject(
            new HttpError(500, 'INTERNAL', 'Failed to persist session.', {
              code: 'E_SESSION_SAVE_FAILED',
            })
          );
          return;
        }
        resolve();
      });
    });
  });
}

function requireAuthenticatedUser(req) {
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

function markSessionSetupComplete(req) {
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

authRouter.options('/register', (req, res) => {
  res.set('Allow', 'POST, OPTIONS');
  jsonOk(res, { message: 'Ready' });
});

authRouter.options('/login', (req, res) => {
  res.set('Allow', 'POST, OPTIONS');
  jsonOk(res, { message: 'Ready' });
});

authRouter.options('/verify', (req, res) => {
  res.set('Allow', 'POST, OPTIONS');
  jsonOk(res, { message: 'Ready' });
});

authRouter.options('/resend-verification', (req, res) => {
  res.set('Allow', 'POST, OPTIONS');
  jsonOk(res, { message: 'Ready' });
});

authRouter.options('/complete-setup', (req, res) => {
  res.set('Allow', 'POST, OPTIONS');
  jsonOk(res, { message: 'Ready' });
});

authRouter.options('/logout', (req, res) => {
  res.set('Allow', 'POST, OPTIONS');
  jsonOk(res, { message: 'Ready' });
});

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    const fullName = String(body.fullName ?? '').trim();
    const institution = String(body.institution ?? '').trim();
    const email = normalizeEmail(body.email);
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

    if (email.length > 320) {
      throw new HttpError(422, 'VALIDATION', 'Email address is too long.', {
        code: 'E_EMAIL_TOO_LONG',
        details: { field: 'email' },
      });
    }

    if (fullName.length > 255) {
      throw new HttpError(422, 'VALIDATION', 'Full name is too long.', {
        code: 'E_FULL_NAME_TOO_LONG',
        details: { field: 'fullName' },
      });
    }

    if (institution && institution.length > 255) {
      throw new HttpError(422, 'VALIDATION', 'Institution name is too long.', {
        code: 'E_INSTITUTION_TOO_LONG',
        details: { field: 'institution' },
      });
    }

    const emailHashValue = emailHash(email);

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

      const [existingPending] = await connection.execute(
        'SELECT id FROM account_verifications WHERE email = ? LIMIT 1',
        [email]
      );

      const hasPendingVerification = Array.isArray(existingPending) && existingPending.length > 0;

      verificationCode = generateVerificationCode();
      const passwordHash = await bcrypt.hash(String(password), 12);
      const expiresAt = expiresAtUtc(24);

      if (passwordHash.length > 255) {
        throw new HttpError(500, 'INTERNAL', 'Password hash is too long.', {
          code: 'E_PASSWORD_HASH_TOO_LONG',
        });
      }

      if (verificationCode.length > 64) {
        throw new HttpError(500, 'INTERNAL', 'Verification code is too long.', {
          code: 'E_VERIFICATION_CODE_TOO_LONG',
        });
      }

      await connection.beginTransaction();
      inTransaction = true;
      if (hasPendingVerification) {
        await connection.execute('DELETE FROM account_verifications WHERE email = ?', [email]);
      }
      await connection.execute(
        'INSERT INTO account_verifications (full_name, institution, email, email_hash, password_hash, verification_code, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())',
        [fullName, institution || null, email, emailHashValue, passwordHash, verificationCode, expiresAt]
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

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    const email = normalizeEmail(body.email);
    const password = String(body.password ?? '');

    if (!validateEmail(email) || email.length > 320 || password.length === 0) {
      throw new HttpError(422, 'VALIDATION', 'Enter your email and password.', {
        code: 'E_INVALID_CREDENTIALS_INPUT',
        details: { fields: ['email', 'password'] },
      });
    }

    const connection = await getPool().getConnection();

    try {
      const [users] = await connection.execute(
        'SELECT id, full_name, email, password_hash, setup_completed_at FROM users WHERE email = ? LIMIT 1',
        [email]
      );

      if (!Array.isArray(users) || users.length === 0) {
        const [pending] = await connection.execute(
          'SELECT id FROM account_verifications WHERE email = ? LIMIT 1',
          [email]
        );

        if (Array.isArray(pending) && pending.length > 0) {
          throw new HttpError(401, 'AUTH', 'Please verify your email before signing in.', {
            code: 'E_EMAIL_NOT_VERIFIED',
            details: { field: 'email' },
          });
        }

        throw new HttpError(401, 'AUTH', 'Invalid email or password.', {
          code: 'E_INVALID_CREDENTIALS',
          details: { field: 'email' },
        });
      }

      const user = users[0];
      const passwordHash = user.password_hash ?? '';

      if (passwordHash.length === 0) {
        throw new HttpError(401, 'AUTH', 'Invalid email or password.', {
          code: 'E_INVALID_CREDENTIALS',
          details: { field: 'email' },
        });
      }

      const passwordMatches = await bcrypt.compare(password, passwordHash);

      if (!passwordMatches) {
        throw new HttpError(401, 'AUTH', 'Invalid email or password.', {
          code: 'E_INVALID_CREDENTIALS',
          details: { field: 'email' },
        });
      }

      const requiresSetup = user.setup_completed_at === null;

      await establishUserSession(req, user.id, user.setup_completed_at ?? null);

      jsonOk(res, { message: 'Signed in successfully.', requiresSetup });
    } finally {
      connection.release();
    }
  })
);

authRouter.post(
  '/verify',
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    const email = normalizeEmail(body.email);
    const code = String(body.code ?? '').trim();

    if (!validateEmail(email) || email.length > 320) {
      throw new HttpError(422, 'VALIDATION', 'Enter a valid email address.', {
        code: 'E_INVALID_EMAIL',
        details: { field: 'email' },
      });
    }

    if (!/^[0-9]{6}$/.test(code)) {
      throw new HttpError(422, 'VALIDATION', 'Enter the 6 digit code from your email.', {
        code: 'E_INVALID_CODE',
        details: { field: 'code' },
      });
    }

    const pool = getPool();
    const connection = await pool.getConnection();
    let inTransaction = false;

    try {
      await cleanupExpiredVerifications(connection);

      const [records] = await connection.execute(
        'SELECT id, full_name, institution, email, email_hash, password_hash, verification_code, expires_at FROM account_verifications WHERE email = ? AND verification_code = ? LIMIT 1',
        [email, code]
      );

      if (!Array.isArray(records) || records.length === 0) {
        throw new HttpError(404, 'NOT_FOUND', 'We could not find a verification request for that email and code.', {
          code: 'E_VERIFICATION_NOT_FOUND',
          details: { field: 'code' },
        });
      }

      const record = records[0];

      const expiresAt = record.expires_at ? new Date(`${record.expires_at}Z`) : null;
      if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
        await connection.execute(
          'DELETE FROM account_verifications WHERE email = ? AND verification_code = ?',
          [email, code]
        );
        throw new HttpError(410, 'VALIDATION', 'This verification code expired. Please sign up again.', {
          code: 'E_VERIFICATION_EXPIRED',
          details: { field: 'code' },
        });
      }

      await connection.beginTransaction();
      inTransaction = true;

      const [existingUsers] = await connection.execute(
        'SELECT id, setup_completed_at FROM users WHERE email = ? LIMIT 1',
        [email]
      );

      let requiresSetup = true;
      let userId = null;
      let setupCompletedAt = null;

      if (Array.isArray(existingUsers) && existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        userId = existingUser.id;
        setupCompletedAt = existingUser.setup_completed_at ?? null;
        requiresSetup = existingUser.setup_completed_at === null;
      } else {
        const [insertResult] = await connection.execute(
          'INSERT INTO users (full_name, institution, email, email_hash, password_hash, setup_completed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NULL, UTC_TIMESTAMP(), UTC_TIMESTAMP())',
          [
            record.full_name,
            record.institution || null,
            email,
            emailHash(email),
            record.password_hash,
          ]
        );
        userId = insertResult.insertId ?? null;
        requiresSetup = true;
        setupCompletedAt = null;
      }

      await connection.execute(
        'DELETE FROM account_verifications WHERE email = ? AND verification_code = ?',
        [email, code]
      );

      await connection.commit();
      inTransaction = false;

      if (!userId) {
        throw new HttpError(500, 'INTERNAL', 'Could not determine user account.', {
          code: 'E_USER_LOOKUP_FAILED',
        });
      }

      await establishUserSession(req, userId, setupCompletedAt);

      jsonOk(res, { message: 'Email verified.', requiresSetup });
    } catch (error) {
      if (inTransaction) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          // eslint-disable-next-line no-console
          console.error('Failed to roll back transaction', rollbackError);
        }
      }
      throw error;
    } finally {
      connection.release();
    }
  })
);

authRouter.post(
  '/complete-setup',
  asyncHandler(async (req, res) => {
    const { userId } = requireAuthenticatedUser(req);
    const body = req.body ?? {};

    const subject = String(body.subject ?? '').trim();
    if (subject.length < 2 || subject.length > 120) {
      throw new HttpError(422, 'VALIDATION', 'Tell us what you teach.', {
        code: 'E_INVALID_SUBJECT',
        details: { field: 'subject' },
      });
    }

    const rawGradeLevels = Array.isArray(body.gradeLevels) ? body.gradeLevels : [];
    const gradeLevels = Array.from(
      new Set(
        rawGradeLevels.filter(
          (value) => typeof value === 'string' && GRADE_LEVEL_OPTIONS.has(value)
        )
      )
    );

    if (gradeLevels.length === 0) {
      throw new HttpError(422, 'VALIDATION', 'Select at least one grade level.', {
        code: 'E_INVALID_GRADE_LEVELS',
        details: { field: 'gradeLevels' },
      });
    }

    const country = String(body.country ?? '').trim().toUpperCase();
    if (!COUNTRY_OPTIONS.has(country)) {
      throw new HttpError(422, 'VALIDATION', 'Choose your country.', {
        code: 'E_INVALID_COUNTRY',
        details: { field: 'country' },
      });
    }

    const studentCountRange = String(body.studentCountRange ?? '').trim();
    if (!STUDENT_COUNT_OPTIONS.has(studentCountRange)) {
      throw new HttpError(422, 'VALIDATION', 'Let us know how many students you support.', {
        code: 'E_INVALID_STUDENT_COUNT',
        details: { field: 'studentCountRange' },
      });
    }

    const primaryGoal = String(body.primaryGoal ?? '').trim();
    if (primaryGoal.length < 10) {
      throw new HttpError(422, 'VALIDATION', 'Share a short note about your primary goal.', {
        code: 'E_INVALID_PRIMARY_GOAL',
        details: { field: 'primaryGoal' },
      });
    }

    const consentAiProcessing = Boolean(body.consentAiProcessing);
    if (!consentAiProcessing) {
      throw new HttpError(422, 'VALIDATION', 'We need your consent to continue.', {
        code: 'E_MISSING_CONSENT',
        details: { field: 'consentAiProcessing' },
      });
    }

    const connection = await getPool().getConnection();
    let inTransaction = false;

    try {
      await connection.beginTransaction();
      inTransaction = true;

      await connection.execute(
        `INSERT INTO teacher_profiles (user_id, subject, grade_levels, country, student_count_range, primary_goal, consent_ai_processing, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
         ON DUPLICATE KEY UPDATE subject = VALUES(subject), grade_levels = VALUES(grade_levels), country = VALUES(country), student_count_range = VALUES(student_count_range), primary_goal = VALUES(primary_goal), consent_ai_processing = VALUES(consent_ai_processing), updated_at = UTC_TIMESTAMP()`,
        [
          userId,
          subject,
          gradeLevels.join(','),
          country,
          studentCountRange,
          primaryGoal,
          consentAiProcessing ? 1 : 0,
        ]
      );

      await connection.execute(
        'UPDATE users SET setup_completed_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP() WHERE id = ?',
        [userId]
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
      throw error;
    } finally {
      connection.release();
    }

    await markSessionSetupComplete(req);

    jsonOk(res, { message: 'Setup completed.' });
  })
);

authRouter.post(
  '/resend-verification',
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    const email = normalizeEmail(body.email);

    if (!validateEmail(email) || email.length > 320) {
      throw new HttpError(422, 'VALIDATION', 'Enter a valid email address.', {
        code: 'E_INVALID_EMAIL',
        details: { field: 'email' },
      });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    let verificationCode;
    let fullName = '';

    try {
      await cleanupExpiredVerifications(connection);

      const [records] = await connection.execute(
        'SELECT full_name FROM account_verifications WHERE email = ? LIMIT 1',
        [email]
      );

      if (!Array.isArray(records) || records.length === 0) {
        throw new HttpError(404, 'NOT_FOUND', 'Start the sign up process again to receive a new code.', {
          code: 'E_VERIFICATION_NOT_FOUND',
          details: { field: 'email' },
        });
      }

      fullName = records[0].full_name ?? '';
      verificationCode = generateVerificationCode();

      const expiresAt = expiresAtUtc(24);

      await connection.execute(
        'UPDATE account_verifications SET verification_code = ?, expires_at = ? WHERE email = ?',
        [verificationCode, expiresAt, email]
      );
    } finally {
      connection.release();
    }

    try {
      await sendVerificationEmail({ email, name: fullName, code: verificationCode });
    } catch (error) {
      const mailError = new HttpError(500, 'INTERNAL', 'We could not resend the verification email.', {
        code: 'E_EMAIL_SEND_FAILED',
      });
      mailError.cause = error;
      throw mailError;
    }

    jsonOk(res, { message: 'Verification code resent.' });
  })
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    if (!req.session) {
      jsonOk(res, { message: 'Signed out.' });
      return;
    }

    await new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          reject(
            new HttpError(500, 'INTERNAL', 'Could not log you out.', {
              code: 'E_SESSION_DESTROY_FAILED',
            })
          );
          return;
        }
        resolve();
      });
    });

    res.clearCookie('akadeo_session', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    jsonOk(res, { message: 'Signed out.' });
  })
);

authRouter.all('/register', (req, res) => {
  methodNotAllowed(res, ['POST', 'OPTIONS'], 'Use POST for registration.');
});

authRouter.all('/login', (req, res) => {
  methodNotAllowed(res, ['POST', 'OPTIONS'], 'Use POST to sign in.');
});

authRouter.all('/verify', (req, res) => {
  methodNotAllowed(res, ['POST', 'OPTIONS'], 'Use POST to verify your email.');
});

authRouter.all('/resend-verification', (req, res) => {
  methodNotAllowed(res, ['POST', 'OPTIONS'], 'Use POST to resend the verification email.');
});

export default authRouter;
