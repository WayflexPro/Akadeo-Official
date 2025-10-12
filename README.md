# Akadeo

Akadeo is a marketing site with an email verification onboarding flow. The project now ships with a Node.js backend so hosted environments such as [Railway](https://railway.app/) can serve both the React application and the API routes that power the authentication workflow.

## Getting started locally

```bash
npm install
npm run dev
```

The Vite dev server proxies API calls to whatever backend you are running. For full-stack testing, run the production server after building the frontend:

```bash
npm run build
npm run start
```

`npm run start` serves the compiled `dist/` directory and exposes the REST API on the same origin.

### Deploying alongside legacy PHP entrypoints

If you are serving the compiled assets from a PHP host, make sure the React dashboard has been built (`npm run build`) and that your PHP routes redirect browsers to the SPA rather than to the removed `dashboard.php` template. The PHP authentication handlers in `api/` now detect traditional form submissions—based on the `Accept` and `Content-Type` headers—and issue a `303` redirect to the correct React route (`/dashboard`, `/setup`, or the marketing hash pages). JSON clients continue to receive the existing API responses, so no frontend changes are required when switching to the Node.js backend.

## Post-Auth Redirect → React Dashboard

- Successful login, registration, verification, or setup redirects land on `/dashboard`, which renders the React component in `src/dashboard/AkadeoDashboard.tsx`.
- Legacy `dashboard.php` remains in place only as a 302 shim that forwards stragglers to `/dashboard`.
- Static hosts must serve the SPA shell for deep links: copy `deploy/apache.htaccess` or `deploy/nginx.conf` into the web root next to `index.html` so that `/dashboard` (and other client routes) load the compiled bundle.
- When running behind Apache/Nginx, continue to protect sensitive API routes at the server or PHP layer—those endpoints still enforce authentication before returning data to the React UI.

## Environment variables

The backend expects the following variables (identical to the former PHP implementation unless noted):

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `DATABASE_URL` – Postgres connection string used by the session store (`connect-pg-simple` creates the `session` table automatically)
- `SESSION_SECRET` – keep this value stable across deployments so cookies remain valid
- `WEB_ORIGIN` – comma-separated list of allowed frontend origins for CORS (e.g. `http://localhost:5173,https://app.akadeo.com`)
- `COOKIE_DOMAIN` – optional shared cookie domain such as `.akadeo.com`
- `COOKIE_SAMESITE` – defaults to `lax`; set to `none` when the frontend and backend live on different subdomains
- `COOKIE_SECURE` – defaults to `true` in production, `false` in development; override only when necessary
- `SESSION_COOKIE_NAME` – optional name for the auth cookie (`akadeo.sid` by default)
- `SESSION_COOKIE_DAYS` – number of days before cookies expire (defaults to 7)
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`
- `APP_URL` (used for verification links)

### Cookie & domain guidelines

- **Local development:** keep the defaults (`COOKIE_SAMESITE=lax`, no custom domain) so cookies work over `http://localhost` without TLS.
- **Cross-subdomain production (e.g. `app.akadeo.com` ↔ `api.akadeo.com`):** set `COOKIE_SAMESITE=none`, ensure TLS is enabled so the `Secure` flag can be set, and configure `COOKIE_DOMAIN=.akadeo.com` so both subdomains share the session cookie.
- **Single-origin deployments:** you can leave `COOKIE_DOMAIN` unset. Cookies inherit the server origin automatically.
- Remember to keep `SESSION_SECRET` stable between deploys; rotating it invalidates existing sessions immediately.

When running locally without Brevo credentials, the server logs the verification
code to the console and skips the email request so you can complete the
onboarding flow. In production, the credentials must be configured and missing
values will cause the setup to fail.

## Deploying to Railway

Set the Railway build command to `npm run build` and the start command to `npm run start`. This ensures the Node.js server runs in production so that requests such as `POST /api/auth/register` are handled by the backend instead of a static asset host.

### Database identifiers

- PostgreSQL tables that back the classes feature (`classes`, `class_members`, `class_invites`) store their identifiers as
  `TEXT` so they remain editable through Railway's UI. The application generates ids with [`nanoid`](https://github.com/ai/nanoid),
  so no database extensions are required.
