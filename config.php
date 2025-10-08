<?php

declare(strict_types=1);

date_default_timezone_set('UTC');

function env(string $key, ?string $default = null): string
{
    $value = getenv($key);
    if ($value === false || $value === '') {
        if ($default !== null) {
            return $default;
        }

        throw new \RuntimeException(sprintf('Environment variable "%s" is not set.', $key));
    }

    return $value;
}

function get_pdo(): \PDO
{
    static $pdo = null;
    if ($pdo instanceof \PDO) {
        return $pdo;
    }

    $host = env('DB_HOST');
    $port = env('DB_PORT', '3306');
    $database = env('DB_NAME');
    $user = env('DB_USER');
    $password = env('DB_PASSWORD');

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $database);

    $pdo = new \PDO($dsn, $user, $password, [
        \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
        \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
    ]);

    return $pdo;
}

function start_secure_session(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_name('akadeo_session');
        session_set_cookie_params([
            'httponly' => true,
            'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'samesite' => 'Lax',
        ]);
        session_start();
    }
}

function cleanup_expired_verifications(\PDO $pdo): void
{
    $stmt = $pdo->prepare('DELETE FROM account_verifications WHERE expires_at < UTC_TIMESTAMP()');
    $stmt->execute();
}

function generate_verification_code(): string
{
    return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

function password_is_strong(string $password): bool
{
    return strlen($password) >= 12
        && preg_match('/[A-Z]/', $password)
        && preg_match('/[a-z]/', $password)
        && preg_match('/[0-9]/', $password)
        && preg_match('/[^A-Za-z0-9]/', $password);
}

function send_verification_email(string $email, string $name, string $code): void
{
    $apiKey = env('BREVO_API_KEY');
    $senderEmail = env('BREVO_SENDER_EMAIL');
    $senderName = getenv('BREVO_SENDER_NAME') ?: 'Akadeo';
    $appUrl = rtrim(getenv('APP_URL') ?: '', '/');

    $verificationUrl = $appUrl ? $appUrl . '/index.html#verify-email' : '#verify-email';

    $html = <<<HTML
<!DOCTYPE html>
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
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Hi {$name},</p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Use the verification code below to activate your account. The code expires in 24 hours.</p>
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="display: inline-block; font-size: 32px; letter-spacing: 12px; font-weight: 700; color: #1d3ed2;">{$code}</span>
          </div>
          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 28px;">If the button below doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-word; font-size: 14px; color: #475569;">{$verificationUrl}</p>
          <div style="text-align: center; margin-top: 32px;">
            <a href="{$verificationUrl}" style="background: linear-gradient(135deg, #3056f5, #65f3c0); color: #ffffff; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: 600; display: inline-block;">Verify email</a>
          </div>
          <p style="font-size: 14px; color: #64748b; margin-top: 36px;">If you didn't request this email you can safely ignore it.</p>
        </td>
      </tr>
    </table>
  </body>
</html>
HTML;

    $payload = [
        'sender' => [
            'email' => $senderEmail,
            'name' => $senderName,
        ],
        'to' => [
            ['email' => $email, 'name' => $name ?: $email],
        ],
        'subject' => 'Verify your Akadeo account',
        'htmlContent' => $html,
    ];

    $ch = curl_init('https://api.brevo.com/v3/smtp/email');
    if ($ch === false) {
        throw new \RuntimeException('Failed to initialise Brevo HTTP client.');
    }

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'accept: application/json',
            'content-type: application/json',
            'api-key: ' . $apiKey,
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 15,
    ]);

    $response = curl_exec($ch);
    if ($response === false) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new \RuntimeException('Unable to send verification email: ' . $error);
    }

    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($status >= 400) {
        throw new \RuntimeException('Brevo API returned an error: ' . $response);
    }
}
