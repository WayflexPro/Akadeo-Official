<?php

declare(strict_types=1);

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity)) {
        return false;
    }

    throw new \ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(static function (\Throwable $throwable): void {
    $status = (int) ($throwable->getCode() ?: 500);
    if ($status < 400 || $status > 599) {
        $status = 500;
    }

    $type = property_exists($throwable, 'type')
        ? (string) $throwable->type
        : ($status >= 500 ? 'INTERNAL' : 'VALIDATION');

    $isProduction = is_production_environment();

    $message = $status >= 500 && $isProduction
        ? 'Unexpected server error'
        : ($throwable->getMessage() ?: 'Request failed');

    $code = property_exists($throwable, 'code') && !is_int($throwable->code)
        ? (string) $throwable->code
        : (property_exists($throwable, 'errorCode') ? (string) $throwable->errorCode : null);

    $details = null;
    if (property_exists($throwable, 'details')) {
        $rawDetails = $throwable->details;
        if (is_array($rawDetails)) {
            $details = $rawDetails;
        } elseif ($rawDetails !== null) {
            $details = (array) $rawDetails;
        }
    }

    json_error(
        normalise_error_type($type, $status),
        $message,
        $code,
        $details,
        $status
    );
});

register_shutdown_function(static function (): void {
    $error = error_get_last();
    if ($error === null) {
        return;
    }

    $severity = $error['type'] ?? E_ERROR;
    if (in_array($severity, [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        json_error('INTERNAL', 'Unexpected server error', null, null, 500);
    }
});

start_secure_session();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    json_ok(['message' => 'Ready']);
}

function get_json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';

    if ($raw === '') {
        json_error('VALIDATION', 'Request body must not be empty.', 'E_EMPTY_BODY', null, 400);
    }

    $decoded = json_decode($raw, true);

    if (!is_array($decoded)) {
        json_error('VALIDATION', 'Invalid JSON payload.', 'E_INVALID_JSON', null, 400);
    }

    return $decoded;
}

function json_ok(mixed $data = null, int $status = 200): never
{
    send_json_response($status, [
        'ok' => true,
        'data' => $data,
        'meta' => response_meta(),
    ]);
}

function json_error(string $type, string $message, ?string $code = null, ?array $details = null, int $status = 400): never
{
    send_json_response($status, [
        'ok' => false,
        'error' => [
            'type' => normalise_error_type($type, $status),
            'message' => $message,
            'code' => $code,
            'details' => $details,
        ],
        'meta' => response_meta(),
    ]);
}

function redirect_for_html_request(string $path, int $status = 302): void
{
    if (!should_redirect_for_html_request()) {
        return;
    }

    header('Location: ' . $path, true, $status);
    exit;
}

function send_json_response(int $status, array $body): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function response_meta(): array
{
    return [
        'requestId' => current_request_id(),
        'ts' => (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format(DATE_ATOM),
    ];
}

function current_request_id(): string
{
    static $requestId = null;

    if ($requestId === null) {
        $requestId = generate_request_id();
    }

    return $requestId;
}

function generate_request_id(): string
{
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);

    $hex = bin2hex($data);

    return sprintf(
        '%s-%s-%s-%s-%s',
        substr($hex, 0, 8),
        substr($hex, 8, 4),
        substr($hex, 12, 4),
        substr($hex, 16, 4),
        substr($hex, 20, 12)
    );
}

function normalise_error_type(string $type, int $status): string
{
    $type = strtoupper($type);
    $allowed = ['VALIDATION', 'AUTH', 'CONFLICT', 'NOT_FOUND', 'RATE_LIMIT', 'INTERNAL'];

    if (!in_array($type, $allowed, true)) {
        return $status >= 500 ? 'INTERNAL' : 'VALIDATION';
    }

    return $type;
}

function is_production_environment(): bool
{
    $env = getenv('APP_ENV') ?: getenv('ENVIRONMENT') ?: getenv('NODE_ENV');

    if ($env === false || $env === null) {
        return false;
    }

    return in_array(strtolower((string) $env), ['prod', 'production'], true);
}

function normalise_email(?string $email): string
{
    return strtolower(trim((string) $email));
}

function compute_email_hash(string $normalisedEmail): string
{
    return hash('sha256', $normalisedEmail);
}

function email_hash(?string $rawEmail): string
{
    return compute_email_hash(normalise_email($rawEmail));
}

function should_redirect_for_html_request(): bool
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method !== 'POST') {
        return false;
    }

    $requestedWith = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
    if (strtolower((string) $requestedWith) === 'xmlhttprequest') {
        return false;
    }

    $accept = strtolower((string) ($_SERVER['HTTP_ACCEPT'] ?? ''));
    if ($accept === '') {
        return false;
    }

    $acceptsHtml = str_contains($accept, 'text/html');
    $acceptsJson = str_contains($accept, 'application/json');
    if (!$acceptsHtml || $acceptsJson) {
        return false;
    }

    $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ($_SERVER['HTTP_CONTENT_TYPE'] ?? '')));
    if ($contentType !== '' && str_contains($contentType, 'application/json')) {
        return false;
    }

    return true;
}
