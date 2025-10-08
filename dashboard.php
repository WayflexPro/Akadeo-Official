<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

start_secure_session();

if (!isset($_SESSION['user_id'])) {
    header('Location: /index.html#sign-in');
    exit;
}

$pdo = get_pdo();
$stmt = $pdo->prepare('SELECT full_name, email, institution, created_at, setup_completed_at FROM users WHERE id = ? LIMIT 1');
$stmt->execute([(int) $_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user) {
    $_SESSION = [];
    session_destroy();
    header('Location: /index.html#sign-up');
    exit;
}

$setupCompletedAt = $user['setup_completed_at'] ?? null;

if ($setupCompletedAt === null || $setupCompletedAt === '') {
    header('Location: /setup.php');
    exit;
}

$createdAt = new DateTimeImmutable($user['created_at'] ?? 'now', new DateTimeZone('UTC'));

?><!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Akadeo Dashboard</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body class="dashboard-body">
    <main class="dashboard">
      <section class="dashboard-card">
        <header class="dashboard-card__header">
          <h1>Hi <?php echo htmlspecialchars($user['full_name'] ?? 'there', ENT_QUOTES, 'UTF-8'); ?> 👋</h1>
          <p>Welcome to your Akadeo dashboard.</p>
        </header>
        <dl class="dashboard-details">
          <div>
            <dt>Email</dt>
            <dd><?php echo htmlspecialchars($user['email'] ?? '', ENT_QUOTES, 'UTF-8'); ?></dd>
          </div>
          <div>
            <dt>Institution</dt>
            <dd><?php echo $user['institution'] ? htmlspecialchars($user['institution'], ENT_QUOTES, 'UTF-8') : 'Not provided'; ?></dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd><?php echo $createdAt->format('j M Y • H:i \U\T\C'); ?></dd>
          </div>
        </dl>
        <div class="dashboard-actions">
          <button id="logoutButton" class="ghost">Sign out</button>
        </div>
      </section>
    </main>
    <script>
      const logoutButton = document.getElementById('logoutButton');
      if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
          logoutButton.disabled = true;
          logoutButton.textContent = 'Signing out…';
          try {
            await fetch('/api/logout.php', { method: 'POST' });
          } catch (error) {
            console.error(error);
          }
          window.location.href = '/index.html#sign-in';
        });
      }
    </script>
  </body>
</html>
