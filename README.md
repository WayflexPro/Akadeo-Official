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

## Environment variables

The backend expects the following variables (identical to the former PHP implementation):

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `SESSION_SECRET` (used to sign the session cookie)
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`
- `APP_URL` (used for verification links)

When running locally without Brevo credentials, the server logs the verification
code to the console and skips the email request so you can complete the
onboarding flow. In production, the credentials must be configured and missing
values will cause the setup to fail.

## Deploying to Railway

Set the Railway build command to `npm run build` and the start command to `npm run start`. This ensures the Node.js server runs in production so that requests such as `POST /api/auth/register` are handled by the backend instead of a static asset host.
