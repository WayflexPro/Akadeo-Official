-- Migration: convert class_members and class_invites identifier columns from UUID to TEXT.
-- Safe to run multiple times; casts existing values preserving data integrity.

BEGIN;

-- class_members identifiers to TEXT
ALTER TABLE class_members DROP CONSTRAINT IF EXISTS class_members_pkey;
ALTER TABLE class_members ALTER COLUMN id TYPE TEXT USING id::text;

ALTER TABLE class_members DROP CONSTRAINT IF EXISTS class_members_class_id_fkey;
ALTER TABLE class_members ALTER COLUMN class_id TYPE TEXT USING class_id::text;

ALTER TABLE class_members DROP CONSTRAINT IF EXISTS class_members_user_id_fkey;
ALTER TABLE class_members ALTER COLUMN user_id TYPE TEXT USING user_id::text;

ALTER TABLE class_members ADD PRIMARY KEY (id);
ALTER TABLE class_members
  ADD CONSTRAINT class_members_class_id_fkey
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

-- Recreate the optional FK to users if the table exists with TEXT identifiers.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'id'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE class_members
      ADD CONSTRAINT class_members_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

ALTER TABLE class_members DROP CONSTRAINT IF EXISTS uq_class_members;
ALTER TABLE class_members ADD CONSTRAINT uq_class_members UNIQUE (class_id, user_id);

-- class_invites identifiers to TEXT
ALTER TABLE class_invites DROP CONSTRAINT IF EXISTS class_invites_pkey;
ALTER TABLE class_invites ALTER COLUMN id TYPE TEXT USING id::text;

ALTER TABLE class_invites DROP CONSTRAINT IF EXISTS class_invites_class_id_fkey;
ALTER TABLE class_invites ALTER COLUMN class_id TYPE TEXT USING class_id::text;

ALTER TABLE class_invites ADD PRIMARY KEY (id);
ALTER TABLE class_invites
  ADD CONSTRAINT class_invites_class_id_fkey
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

ALTER TABLE class_invites DROP CONSTRAINT IF EXISTS uq_class_invite;
ALTER TABLE class_invites ADD CONSTRAINT uq_class_invite UNIQUE (class_id, invitee_email, role);

COMMIT;
