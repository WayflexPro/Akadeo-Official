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

The backend expects the following variables:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `SESSION_SECRET` (used to sign the session cookie)
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`
- `APP_URL` (used for verification links)
- `STRIPE_SECRET_KEY` (server-side API key for creating checkout sessions and managing subscriptions)
- `STRIPE_WEBHOOK_SECRET` (signature secret for `/api/stripe/webhook`)
- `APP_BASE_URL` (optional override for building success/cancel URLs; defaults to the incoming request origin)

When running locally without Brevo credentials, the server logs the verification
code to the console and skips the email request so you can complete the
onboarding flow. In production, the credentials must be configured and missing
values will cause the setup to fail.

## Database tables for memberships

Railway’s managed MySQL offering only supports `Serial`, `Integer`, and `Text`
columns, so uniqueness and foreign-key checks must live in the application
layer. Create the following tables before enabling paid memberships:

```sql
CREATE TABLE IF NOT EXISTS plans (
  id Serial PRIMARY KEY,
  name Text NOT NULL,
  price_cents Integer NOT NULL,
  discount_percent Integer,
  discount_end_date Text,
  description Text,
  created_at Text,
  updated_at Text
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id Serial PRIMARY KEY,
  user_id Integer NOT NULL,
  plan_id Integer NOT NULL,
  status Text NOT NULL,
  start_date Text NOT NULL,
  end_date Text,
  stripe_subscription_id Text
);

CREATE TABLE IF NOT EXISTS payments (
  id Serial PRIMARY KEY,
  user_id Integer NOT NULL,
  plan_id Integer NOT NULL,
  stripe_session_id Text NOT NULL,
  status Text NOT NULL,
  amount_paid_cents Integer NOT NULL,
  created_at Text NOT NULL
);
```

Populate `plans` with the memberships you offer. The server applies any active
discount (`discount_percent` until `discount_end_date`) when creating Stripe
checkout sessions. The webhook handler records successful payments, updates the
`subscriptions` table, and marks failed invoices as canceled so the dashboard
reverts the user to the Free plan.

Expose the webhook endpoint `POST /api/stripe/webhook` in Stripe’s dashboard
and supply the signing secret as `STRIPE_WEBHOOK_SECRET`.

## Deploying to Railway

Set the Railway build command to `npm run build` and the start command to `npm run start`. This ensures the Node.js server runs in production so that requests such as `POST /api/auth/register` are handled by the backend instead of a static asset host.
