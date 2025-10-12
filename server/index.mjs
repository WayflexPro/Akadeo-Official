import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRouter, { requireAuthenticatedUser } from './routes/auth.mjs';
import { getSessionCookieConfig, isProduction, optionalEnv, requireEnv } from './env.mjs';
import { HttpError, jsonError, withRequestId } from './utils.mjs';

const app = express();
app.disable('x-powered-by');

if (isProduction()) {
  app.set('trust proxy', 1);
}

app.use(withRequestId);

const rawOrigins = optionalEnv('WEB_ORIGIN');
const allowedOrigins = rawOrigins
  ? rawOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0)
  : true;

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  next();
});

const { name: sessionCookieName, cookie: sessionCookie } = getSessionCookieConfig();
const PgSession = pgSession(session);
const sessionStore = new PgSession({
  conString: requireEnv('DATABASE_URL'),
  tableName: optionalEnv('SESSION_TABLE_NAME', 'session'),
  schemaName: optionalEnv('SESSION_SCHEMA'),
  createTableIfMissing: true,
});

app.use(
  session({
    name: sessionCookieName,
    secret: requireEnv('SESSION_SECRET'),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: sessionCookie,
    store: sessionStore,
  })
);

app.use('/api/auth', authRouter);

const protectedApi = express.Router();

protectedApi.use((req, res) => {
  jsonError(res, 'NOT_FOUND', 'API route not found.', 404, {
    code: 'E_ROUTE_NOT_FOUND',
  });
});

app.use('/api', requireAuthenticatedUser, protectedApi);

app.use('/dashboard', (req, res, next) => {
  const session = req.session;
  const sessionUser = session?.user;
  if (!session || !sessionUser) {
    res.redirect('/index.html#sign-in');
    return;
  }
  if (!sessionUser.setupCompletedAt) {
    res.redirect('/setup');
    return;
  }
  next();
});

const dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(dirname, '..', 'dist');

if (!fs.existsSync(distDir)) {
  // eslint-disable-next-line no-console
  console.warn('Static assets not found. Did you run "npm run build"? Expected directory:', distDir);
}

app.use(express.static(distDir));

app.get(/^(?!\/api\/).*/, (req, res, next) => {
  res.sendFile(path.join(distDir, 'index.html'), (err) => {
    if (err) {
      next(err);
    }
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // eslint-disable-next-line no-console
  console.error('Request failed', { requestId: res.locals.requestId, error: err });

  if (err instanceof SyntaxError && 'body' in err) {
    jsonError(res, 'VALIDATION', 'Invalid JSON payload.', 400, {
      code: 'E_INVALID_JSON',
    });
    return;
  }

  if (err instanceof HttpError) {
    jsonError(res, err.type, err.message, err.status, {
      code: err.code,
      details: err.details,
    });
    return;
  }

  const message = isProduction() ? 'Unexpected server error.' : err?.message || 'Unexpected server error';
  jsonError(res, 'INTERNAL', message, 500);
});

const port = Number.parseInt(process.env.PORT ?? '3000', 10);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Akadeo server listening on port ${port}`);
});
