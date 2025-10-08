<?php

declare(strict_types=1);

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

start_secure_session();

function get_json_body(): array
{
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw ?? '', true);

    if (!is_array($decoded)) {
        json_response(400, ['message' => 'Invalid request body.']);
    }

    return $decoded;
}

function json_response(int $status, array $payload = []): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function normalise_email(?string $email): string
{
    return strtolower(trim((string) $email));
}
