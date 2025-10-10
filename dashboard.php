<?php

declare(strict_types=1);

// Legacy endpoint retained to support any cached links while the dashboard lives in React.
// Always redirect to the SPA route so the Node/Express implementation handles the flow.
header('Location: /dashboard');
exit;
