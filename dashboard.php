<?php

declare(strict_types=1);

// Legacy endpoint retained to support any cached links while the dashboard
// experience now lives in the React single-page application. Always redirect to
// the SPA route so the Node/Express server can handle authentication and
// routing.
header('Location: /dashboard', true, 302);
exit;
