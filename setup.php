<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

start_secure_session();

if (!isset($_SESSION['user_id'])) {
    header('Location: /index.html#sign-in');
    exit;
}

$pdo = get_pdo();

$userStmt = $pdo->prepare('SELECT full_name, setup_completed_at FROM users WHERE id = ? LIMIT 1');
$userStmt->execute([(int) $_SESSION['user_id']]);
$user = $userStmt->fetch();

if (!$user) {
    $_SESSION = [];
    session_destroy();
    header('Location: /index.html#sign-up');
    exit;
}

if (!empty($user['setup_completed_at'])) {
    header('Location: /dashboard.php');
    exit;
}

$educatorRoles = [
    'classroom_teacher' => 'Classroom teacher',
    'school_admin' => 'School or district administrator',
    'tutor_or_coach' => 'Tutor or instructional coach',
    'other' => 'Something else',
];

$gradeLevelOptions = [
    'k5' => 'Elementary (K-5)',
    '68' => 'Middle school (6-8)',
    '912' => 'High school (9-12)',
    'higher_ed' => 'Higher education',
    'other' => 'Other / mixed grades',
];

$studentBands = [
    'under_50' => 'Fewer than 50 students',
    '50_150' => '50-150 students',
    '150_500' => '150-500 students',
    'over_500' => 'More than 500 students',
];

$errors = [];
$values = [
    'educator_role' => '',
    'grade_levels' => [],
    'subjects_focus' => '',
    'students_served' => '',
    'primary_goal' => '',
];

$responseStmt = $pdo->prepare('SELECT educator_role, grade_levels, subjects, students_served, primary_goal FROM user_setup_responses WHERE user_id = ? LIMIT 1');
$responseStmt->execute([(int) $_SESSION['user_id']]);
$existingResponse = $responseStmt->fetch();

if ($existingResponse) {
    $values['educator_role'] = $existingResponse['educator_role'] ?? '';
    $values['grade_levels'] = $existingResponse['grade_levels'] !== ''
        ? array_values(array_filter(array_map('trim', explode(',', (string) $existingResponse['grade_levels']))))
        : [];
    $values['subjects_focus'] = $existingResponse['subjects'] ?? '';
    $values['students_served'] = $existingResponse['students_served'] ?? '';
    $values['primary_goal'] = $existingResponse['primary_goal'] ?? '';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $educatorRole = (string) ($_POST['educator_role'] ?? '');
    $gradeLevels = $_POST['grade_levels'] ?? [];
    $subjectsFocus = trim((string) ($_POST['subjects_focus'] ?? ''));
    $studentsServed = (string) ($_POST['students_served'] ?? '');
    $primaryGoal = trim((string) ($_POST['primary_goal'] ?? ''));

    if (!array_key_exists($educatorRole, $educatorRoles)) {
        $errors['educator_role'] = 'Select the option that best describes you.';
    }

    $gradeLevels = is_array($gradeLevels) ? array_values(array_filter($gradeLevels, 'is_string')) : [];
    $gradeLevels = array_values(array_intersect($gradeLevels, array_keys($gradeLevelOptions)));
    if (count($gradeLevels) === 0) {
        $errors['grade_levels'] = 'Choose at least one grade level.';
    }

    if (!array_key_exists($studentsServed, $studentBands)) {
        $errors['students_served'] = 'Let us know roughly how many students you support.';
    }

    if ($primaryGoal === '') {
        $errors['primary_goal'] = 'Tell us your top priority so we can personalise things.';
    }

    if (empty($errors)) {
        try {
            $pdo->beginTransaction();

            $upsert = $pdo->prepare(
                'INSERT INTO user_setup_responses (user_id, educator_role, grade_levels, subjects, students_served, primary_goal, created_at, updated_at) '
                . 'VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP()) '
                . 'ON DUPLICATE KEY UPDATE educator_role = VALUES(educator_role), grade_levels = VALUES(grade_levels), '
                . 'subjects = VALUES(subjects), students_served = VALUES(students_served), primary_goal = VALUES(primary_goal), '
                . 'updated_at = UTC_TIMESTAMP()'
            );

            $upsert->execute([
                (int) $_SESSION['user_id'],
                $educatorRole,
                implode(',', $gradeLevels),
                $subjectsFocus,
                $studentsServed,
                $primaryGoal,
            ]);

            $pdo->prepare('UPDATE users SET setup_completed_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP() WHERE id = ?')
                ->execute([(int) $_SESSION['user_id']]);

            $pdo->commit();

            $_SESSION['setup_completed_at'] = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d H:i:s');

            header('Location: /dashboard.php');
            exit;
        } catch (\Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $errors['general'] = 'We could not save your answers. Please try again.';
        }
    }

    $values['educator_role'] = $educatorRole;
    $values['grade_levels'] = $gradeLevels;
    $values['subjects_focus'] = $subjectsFocus;
    $values['students_served'] = $studentsServed;
    $values['primary_goal'] = $primaryGoal;
}

?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Finish setting up your Akadeo account</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body class="setup-body">
    <main class="setup">
      <section class="setup-card">
        <header class="setup-card__header">
          <p class="setup-card__eyebrow">Just a few questions</p>
          <h1>Let’s tailor Akadeo for you</h1>
          <p>Answer these quick questions so we can personalise your experience.</p>
        </header>
        <?php if (!empty($errors['general'])): ?>
          <p class="form-message form-message--error"><?php echo htmlspecialchars($errors['general'], ENT_QUOTES, 'UTF-8'); ?></p>
        <?php endif; ?>
        <form class="setup-form" method="post" novalidate>
          <fieldset>
            <legend>Which option best describes you?</legend>
            <div class="setup-options setup-options--grid">
              <?php foreach ($educatorRoles as $value => $label): ?>
                <label class="setup-option">
                  <input
                    type="radio"
                    name="educator_role"
                    value="<?php echo htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); ?>"
                    <?php echo $values['educator_role'] === $value ? 'checked' : ''; ?>
                  />
                  <span><?php echo htmlspecialchars($label, ENT_QUOTES, 'UTF-8'); ?></span>
                </label>
              <?php endforeach; ?>
            </div>
            <?php if (!empty($errors['educator_role'])): ?>
              <p class="form-message form-message--error"><?php echo htmlspecialchars($errors['educator_role'], ENT_QUOTES, 'UTF-8'); ?></p>
            <?php endif; ?>
          </fieldset>

          <fieldset>
            <legend>Which grade levels do you work with?</legend>
            <div class="setup-options setup-options--wrap">
              <?php foreach ($gradeLevelOptions as $value => $label): ?>
                <label class="setup-option">
                  <input
                    type="checkbox"
                    name="grade_levels[]"
                    value="<?php echo htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); ?>"
                    <?php echo in_array($value, $values['grade_levels'], true) ? 'checked' : ''; ?>
                  />
                  <span><?php echo htmlspecialchars($label, ENT_QUOTES, 'UTF-8'); ?></span>
                </label>
              <?php endforeach; ?>
            </div>
            <?php if (!empty($errors['grade_levels'])): ?>
              <p class="form-message form-message--error"><?php echo htmlspecialchars($errors['grade_levels'], ENT_QUOTES, 'UTF-8'); ?></p>
            <?php endif; ?>
          </fieldset>

          <label class="setup-field">
            <span>Which subjects or focus areas are most important right now?</span>
            <input
              type="text"
              name="subjects_focus"
              placeholder="e.g. Biology, Algebra, Social Studies"
              value="<?php echo htmlspecialchars($values['subjects_focus'], ENT_QUOTES, 'UTF-8'); ?>"
            />
          </label>

          <label class="setup-field">
            <span>About how many students do you support each year?</span>
            <select name="students_served" required>
              <option value="" disabled <?php echo $values['students_served'] === '' ? 'selected' : ''; ?>>Select an option</option>
              <?php foreach ($studentBands as $value => $label): ?>
                <option value="<?php echo htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); ?>" <?php echo $values['students_served'] === $value ? 'selected' : ''; ?>>
                  <?php echo htmlspecialchars($label, ENT_QUOTES, 'UTF-8'); ?>
                </option>
              <?php endforeach; ?>
            </select>
            <?php if (!empty($errors['students_served'])): ?>
              <p class="form-message form-message--error"><?php echo htmlspecialchars($errors['students_served'], ENT_QUOTES, 'UTF-8'); ?></p>
            <?php endif; ?>
          </label>

          <label class="setup-field">
            <span>What’s the biggest goal you have for Akadeo?</span>
            <textarea
              name="primary_goal"
              rows="4"
              placeholder="Tell us what success looks like for you"
              required
            ><?php echo htmlspecialchars($values['primary_goal'], ENT_QUOTES, 'UTF-8'); ?></textarea>
            <?php if (!empty($errors['primary_goal'])): ?>
              <p class="form-message form-message--error"><?php echo htmlspecialchars($errors['primary_goal'], ENT_QUOTES, 'UTF-8'); ?></p>
            <?php endif; ?>
          </label>

          <button class="primary" type="submit">Continue to dashboard</button>
        </form>
        <p class="setup-help">Need a hand? <a href="mailto:support@akadeo.com">Contact support</a>.</p>
      </section>
    </main>
  </body>
</html>
