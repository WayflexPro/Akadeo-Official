<?php

declare(strict_types=1);

// Legacy endpoint retained to support any cached links while the setup flow lives in React.
// Always redirect to the SPA route so the Node/Express implementation handles the flow.
header('Location: /setup', true, 308);
exit;
