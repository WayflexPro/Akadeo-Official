<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('VALIDATION', 'Method not allowed.', 'E_METHOD_NOT_ALLOWED', null, 405);
}

$data = get_json_body();

$email = normalise_email($data['email'] ?? '');
$code = trim((string) ($data['code'] ?? ''));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('VALIDATION', 'Enter a valid email address.', 'E_INVALID_EMAIL', ['field' => 'email'], 422);
}

if (!preg_match('/^[0-9]{6}$/', $code)) {
    json_error('VALIDATION', 'Enter the 6 digit code from your email.', 'E_INVALID_CODE', ['field' => 'code'], 422);
}

$pdo = get_pdo();
cleanup_expired_verifications($pdo);

$stmt = $pdo->prepare('SELECT * FROM account_verifications WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$record = $stmt->fetch();

if (!$record) {
    json_error('NOT_FOUND', 'We could not find a verification request for that email.', 'E_VERIFICATION_NOT_FOUND', ['field' => 'email'], 404);
}

if (!hash_equals($record['verification_code'], $code)) {
    json_error('VALIDATION', 'The verification code is incorrect.', 'E_INVALID_CODE', ['field' => 'code'], 400);
}

$expiresAt = new DateTimeImmutable($record['expires_at'], new DateTimeZone('UTC'));
$now = new DateTimeImmutable('now', new DateTimeZone('UTC'));

if ($expiresAt < $now) {
    $pdo->prepare('DELETE FROM account_verifications WHERE email = ?')->execute([$email]);
    json_error('VALIDATION', 'This verification link expired. Please sign up again.', 'E_VERIFICATION_EXPIRED', ['field' => 'code'], 410);
}

$userId = null;

try {
    $pdo->beginTransaction();

    $insertUser = $pdo->prepare(
        'INSERT INTO users (full_name, institution, email, password_hash, setup_completed_at, created_at, updated_at) '
        . 'VALUES (?, ?, ?, ?, NULL, UTC_TIMESTAMP(), UTC_TIMESTAMP())'
    );
    $insertUser->execute([
        $record['full_name'],
        $record['institution'],
        $record['email'],
        $record['password_hash'],
    ]);

    $pdo->prepare('DELETE FROM account_verifications WHERE email = ?')->execute([$email]);

    $userId = (int) $pdo->lastInsertId();

    $pdo->commit();
} catch (\Throwable $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_error('INTERNAL', 'Unable to complete the verification. Please try again.', 'E_VERIFICATION_FAILED', null, 500);
}

session_regenerate_id(true);
$_SESSION['user_id'] = $userId;
$_SESSION['user_name'] = $record['full_name'];
$_SESSION['user_email'] = $record['email'];
$_SESSION['setup_completed_at'] = null;

json_ok([
    'message' => 'Email verified.',
    'requiresSetup' => true,
]);
