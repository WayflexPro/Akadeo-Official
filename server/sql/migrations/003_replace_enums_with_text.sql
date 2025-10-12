-- Migration: convert enum-based role/status columns to TEXT with CHECK constraints.
-- Railway-safe: performs in-place conversion without relying on CREATE TYPE.

-- Convert ENUM columns to TEXT.
ALTER TABLE class_members ALTER COLUMN role TYPE TEXT USING role::text;
ALTER TABLE class_invites ALTER COLUMN role TYPE TEXT USING role::text;
ALTER TABLE class_invites ALTER COLUMN status TYPE TEXT USING status::text;

-- Ensure validation constraints enforce allowed values.
ALTER TABLE class_members DROP CONSTRAINT IF EXISTS class_members_role_check;
ALTER TABLE class_members ADD CONSTRAINT class_members_role_check
  CHECK (role IN ('teacher', 'student'));

ALTER TABLE class_invites DROP CONSTRAINT IF EXISTS class_invites_role_check;
ALTER TABLE class_invites ADD CONSTRAINT class_invites_role_check
  CHECK (role = 'teacher');

ALTER TABLE class_invites DROP CONSTRAINT IF EXISTS class_invites_status_check;
ALTER TABLE class_invites ADD CONSTRAINT class_invites_status_check
  CHECK (status IN ('pending', 'accepted', 'declined', 'expired'));
