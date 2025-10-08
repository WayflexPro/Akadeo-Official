<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('VALIDATION', 'Method not allowed.', 'E_METHOD_NOT_ALLOWED', null, 405);
}

$data = get_json_body();

$email = normalise_email($data['email'] ?? '');
$password = (string) ($data['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
    json_error('VALIDATION', 'Enter your email and password.', 'E_INVALID_CREDENTIALS_INPUT', ['fields' => ['email', 'password']], 422);
}

$pdo = get_pdo();
$stmt = $pdo->prepare('SELECT id, full_name, email, password_hash, setup_completed_at FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    json_error('AUTH', 'Invalid email or password.', 'E_INVALID_CREDENTIALS', ['field' => 'email'], 401);
}

session_regenerate_id(true);
$_SESSION['user_id'] = (int) $user['id'];
$_SESSION['user_name'] = $user['full_name'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['setup_completed_at'] = $user['setup_completed_at'];

$requiresSetup = empty($user['setup_completed_at']);

json_ok([
    'message' => 'Signed in successfully.',
    'requiresSetup' => $requiresSetup,
]);
