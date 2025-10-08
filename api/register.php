<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['message' => 'Method not allowed.']);
}

$data = get_json_body();

$fullName = trim((string) ($data['fullName'] ?? ''));
$institution = trim((string) ($data['institution'] ?? ''));
$email = normalise_email($data['email'] ?? '');
$password = (string) ($data['password'] ?? '');

if ($fullName === '' || strlen($fullName) < 2) {
    json_response(422, ['message' => 'Enter your full name.']);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(422, ['message' => 'Enter a valid email address.']);
}

if (!password_is_strong($password)) {
    json_response(422, ['message' => 'Use a stronger password.']);
}

$pdo = get_pdo();
cleanup_expired_verifications($pdo);

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
if ($stmt->fetchColumn()) {
    json_response(409, ['message' => 'An account with that email already exists.']);
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
    json_response(500, ['message' => 'We could not send the verification email. Please try again.']);
}

json_response(201, ['message' => 'Verification email sent.']);
