<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['message' => 'Method not allowed.']);
}

$data = get_json_body();
$email = normalise_email($data['email'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(422, ['message' => 'Enter a valid email address.']);
}

$pdo = get_pdo();
cleanup_expired_verifications($pdo);

$stmt = $pdo->prepare('SELECT full_name FROM account_verifications WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$record = $stmt->fetch();

if (!$record) {
    json_response(404, ['message' => 'Start the sign up process again to receive a new code.']);
}

$code = generate_verification_code();
$expiresAt = (new DateTimeImmutable('now', new DateTimeZone('UTC')))
    ->modify('+1 day')
    ->format('Y-m-d H:i:s');

$update = $pdo->prepare('UPDATE account_verifications SET verification_code = ?, expires_at = ? WHERE email = ?');
$update->execute([$code, $expiresAt, $email]);

try {
    send_verification_email($email, $record['full_name'], $code);
} catch (\Throwable $exception) {
    json_response(500, ['message' => 'We could not resend the verification email.']);
}

json_response(200, ['message' => 'Verification code resent.']);
