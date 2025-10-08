<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('VALIDATION', 'Method not allowed.', 'E_METHOD_NOT_ALLOWED', null, 405);
}

$data = get_json_body();

$fullName = trim((string) ($data['fullName'] ?? ''));
$institution = trim((string) ($data['institution'] ?? ''));
$email = normalise_email($data['email'] ?? '');
$password = (string) ($data['password'] ?? '');

if ($fullName === '' || strlen($fullName) < 2) {
    json_error('VALIDATION', 'Enter your full name.', 'E_INVALID_FULL_NAME', ['field' => 'fullName'], 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('VALIDATION', 'Enter a valid email address.', 'E_INVALID_EMAIL', ['field' => 'email'], 422);
}

if (!password_is_strong($password)) {
    json_error('VALIDATION', 'Use a stronger password.', 'E_WEAK_PASSWORD', ['field' => 'password'], 422);
}

$pdo = get_pdo();
cleanup_expired_verifications($pdo);

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
if ($stmt->fetchColumn()) {
    json_error('CONFLICT', 'An account with that email already exists.', 'E_USER_EXISTS', ['field' => 'email'], 409);
}

$code = generate_verification_code();
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$expiresAt = (new DateTimeImmutable('now', new DateTimeZone('UTC')))
    ->modify('+1 day')
    ->format('Y-m-d H:i:s');

$pdo->beginTransaction();

$delete = $pdo->prepare('DELETE FROM account_verifications WHERE email = ?');
$delete->execute([$email]);

$insert = $pdo->prepare(
    'INSERT INTO account_verifications (full_name, institution, email, password_hash, verification_code, expires_at, created_at) '
    . 'VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())'
);
$insert->execute([$fullName, $institution, $email, $passwordHash, $code, $expiresAt]);

$pdo->commit();

try {
    send_verification_email($email, $fullName, $code);
} catch (\Throwable $exception) {
    $pdo->prepare('DELETE FROM account_verifications WHERE email = ?')->execute([$email]);
    json_error('INTERNAL', 'We could not send the verification email. Please try again.', 'E_EMAIL_SEND_FAILED', null, 500);
}

json_ok(['message' => 'Verification email sent.'], 201);
