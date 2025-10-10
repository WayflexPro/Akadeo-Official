<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('VALIDATION', 'Method not allowed.', 'E_METHOD_NOT_ALLOWED', null, 405);
}

$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
}

session_destroy();

redirect_for_html_request('/', 303);

json_ok(['message' => 'Signed out.']);
