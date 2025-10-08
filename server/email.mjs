import { optionalEnv, requireEnv } from './env.mjs';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

function buildEmailHtml(name, code, appUrl) {
  const verificationUrl = appUrl ? `${appUrl.replace(/\/$/, '')}/index.html#verify-email` : '#verify-email';
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Verify your Akadeo account</title>
  </head>
  <body style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px; color: #0f172a;">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);">
      <tr>
        <td style="padding: 40px;">
          <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome to Akadeo</h1>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Hi ${name || 'there'},</p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Use the verification code below to activate your account. The code expires in 24 hours.</p>
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="display: inline-block; font-size: 32px; letter-spacing: 12px; font-weight: 700; color: #1d3ed2;">${code}</span>
          </div>
          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 28px;">If the button below doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-word; font-size: 14px; color: #475569;">${verificationUrl}</p>
          <div style="text-align: center; margin-top: 32px;">
            <a href="${verificationUrl}" style="background: linear-gradient(135deg, #3056f5, #65f3c0); color: #ffffff; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: 600; display: inline-block;">Verify email</a>
          </div>
          <p style="font-size: 14px; color: #64748b; margin-top: 36px;">If you didn't request this email you can safely ignore it.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendVerificationEmail({ email, name, code }) {
  const apiKey = requireEnv('BREVO_API_KEY');
  const senderEmail = requireEnv('BREVO_SENDER_EMAIL');
  const senderName = optionalEnv('BREVO_SENDER_NAME', 'Akadeo');
  const appUrl = optionalEnv('APP_URL', '');

  const payload = {
    sender: {
      email: senderEmail,
      name: senderName,
    },
    to: [
      {
        email,
        name: name || email,
      },
    ],
    subject: 'Verify your Akadeo account',
    htmlContent: buildEmailHtml(name, code, appUrl || ''),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  let response;
  try {
    response = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const text = await response.text();
    const error = new Error('Brevo API returned an error');
    error.details = text;
    throw error;
  }
}
