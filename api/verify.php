<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['message' => 'Method not allowed.']);
}

$data = get_json_body();

$email = normalise_email($data['email'] ?? '');
$code = trim((string) ($data['code'] ?? ''));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(422, ['message' => 'Enter a valid email address.']);
}

if (!preg_match('/^[0-9]{6}$/', $code)) {
    json_response(422, ['message' => 'Enter the 6 digit code from your email.']);
}

$pdo = get_pdo();
cleanup_expired_verifications($pdo);

$stmt = $pdo->prepare('SELECT * FROM account_verifications WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$record = $stmt->fetch();

if (!$record) {
    json_response(404, ['message' => 'We could not find a verification request for that email.']);
}

if (!hash_equals($record['verification_code'], $code)) {
    json_response(400, ['message' => 'The verification code is incorrect.']);
}

$expiresAt = new DateTimeImmutable($record['expires_at'], new DateTimeZone('UTC'));
$now = new DateTimeImmutable('now', new DateTimeZone('UTC'));

if ($expiresAt < $now) {
    $pdo->prepare('DELETE FROM account_verifications WHERE email = ?')->execute([$email]);
    json_response(410, ['message' => 'This verification link expired. Please sign up again.']);
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
    json_response(500, ['message' => 'Unable to complete the verification. Please try again.']);
}

session_regenerate_id(true);
$_SESSION['user_id'] = $userId;
$_SESSION['user_name'] = $record['full_name'];
$_SESSION['user_email'] = $record['email'];
$_SESSION['setup_completed_at'] = null;

json_response(200, ['message' => 'Email verified.', 'requiresSetup' => true]);
