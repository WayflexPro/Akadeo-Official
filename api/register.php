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
$emailHash = email_hash($email);
$password = (string) ($data['password'] ?? '');

if ($fullName === '' || strlen($fullName) < 2) {
    json_error('VALIDATION', 'Enter your full name.', 'E_INVALID_FULL_NAME', ['field' => 'fullName'], 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('VALIDATION', 'Enter a valid email address.', 'E_INVALID_EMAIL', ['field' => 'email'], 422);
}

if (strlen($email) > 320) {
    json_error('VALIDATION', 'Email address is too long.', 'E_EMAIL_TOO_LONG', ['field' => 'email'], 422);
}

if (strlen($fullName) > 255) {
    json_error('VALIDATION', 'Full name is too long.', 'E_FULL_NAME_TOO_LONG', ['field' => 'fullName'], 422);
}

if ($institution !== '' && strlen($institution) > 255) {
    json_error('VALIDATION', 'Institution name is too long.', 'E_INSTITUTION_TOO_LONG', ['field' => 'institution'], 422);
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

$pending = $pdo->prepare('SELECT id FROM account_verifications WHERE email = ? LIMIT 1');
$pending->execute([$email]);
$hasPending = (bool) $pending->fetchColumn();

$code = generate_verification_code();
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

if (strlen($passwordHash) > 255) {
    json_error('INTERNAL', 'Internal error creating account.', 'E_PASSWORD_HASH_TOO_LONG', null, 500);
}

if (strlen($code) > 64) {
    json_error('INTERNAL', 'Internal error creating account.', 'E_VERIFICATION_CODE_TOO_LONG', null, 500);
}

$expiresAt = (new DateTimeImmutable('now', new DateTimeZone('UTC')))
    ->modify('+1 day')
    ->format('Y-m-d H:i:s');

$pdo->beginTransaction();

if ($hasPending) {
    $pdo->prepare('DELETE FROM account_verifications WHERE email = ?')->execute([$email]);
}

$insert = $pdo->prepare(
    'INSERT INTO account_verifications (full_name, institution, email, email_hash, password_hash, verification_code, expires_at, created_at) '
    . 'VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())'
);
$insert->execute([
    $fullName,
    $institution !== '' ? $institution : null,
    $email,
    $emailHash,
    $passwordHash,
    $code,
    $expiresAt,
]);

$pdo->commit();

try {
    send_verification_email($email, $fullName, $code);
} catch (\Throwable $exception) {
    $pdo->prepare('DELETE FROM account_verifications WHERE email = ?')->execute([$email]);
    json_error('INTERNAL', 'We could not send the verification email. Please try again.', 'E_EMAIL_SEND_FAILED', null, 500);
}

json_ok(['message' => 'Verification email sent.'], 201);
