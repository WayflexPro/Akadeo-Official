<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('VALIDATION', 'Method not allowed.', 'E_METHOD_NOT_ALLOWED', null, 405);
}

$data = get_json_body();
$email = normalise_email($data['email'] ?? '');
$emailHash = email_hash($email);

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 320) {
    json_error('VALIDATION', 'Enter a valid email address.', 'E_INVALID_EMAIL', ['field' => 'email'], 422);
}

$pdo = get_pdo();
cleanup_expired_verifications($pdo);

$stmt = $pdo->prepare('SELECT full_name FROM account_verifications WHERE email_hash = ? LIMIT 1');
$stmt->execute([$emailHash]);
$record = $stmt->fetch();

if (!$record) {
    json_error('NOT_FOUND', 'Start the sign up process again to receive a new code.', 'E_VERIFICATION_NOT_FOUND', ['field' => 'email'], 404);
}

$code = generate_verification_code();
$expiresAt = (new DateTimeImmutable('now', new DateTimeZone('UTC')))
    ->modify('+1 day')
    ->format('Y-m-d H:i:s');

$update = $pdo->prepare('UPDATE account_verifications SET verification_code = ?, expires_at = ? WHERE email_hash = ?');
$update->execute([$code, $expiresAt, $emailHash]);

try {
    send_verification_email($email, $record['full_name'], $code);
} catch (\Throwable $exception) {
    json_error('INTERNAL', 'We could not resend the verification email.', 'E_EMAIL_SEND_FAILED', null, 500);
}

json_ok(['message' => 'Verification code resent.']);
