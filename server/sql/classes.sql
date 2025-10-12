-- Classes feature schema using TEXT identifiers for compatibility with Railway's Postgres UI.
-- Railway-safe: relies on application-generated nanoid values; no extensions required.

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name VARCHAR(120) NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  description TEXT,
  subject VARCHAR(80) CHECK (length(subject) BETWEEN 1 AND 80 OR subject IS NULL),
  room_number VARCHAR(20) CHECK (length(room_number) BETWEEN 1 AND 20 OR room_number IS NULL),
  theme VARCHAR(40) NOT NULL DEFAULT 'default' CHECK (length(theme) BETWEEN 1 AND 40),
  code VARCHAR(10) NOT NULL CHECK (length(code) BETWEEN 6 AND 10),
  image_url TEXT CHECK (image_url ~* '^https?://.+$' OR image_url IS NULL),
  owner_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classes_owner_id ON classes(owner_id);
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(code);

CREATE TABLE IF NOT EXISTS class_members (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_class_members UNIQUE (class_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_class_members_class_id ON class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_user_id ON class_members(user_id);
CREATE INDEX IF NOT EXISTS idx_class_members_role ON class_members(role);

CREATE TABLE IF NOT EXISTS class_invites (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  invitee_email VARCHAR(254) NOT NULL CHECK (position('@' in invitee_email) > 1),
  role TEXT NOT NULL CHECK (role = 'teacher'),
  status TEXT NOT NULL DEFAULT 'pending'
         CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_class_invite UNIQUE (class_id, invitee_email, role)
);

CREATE INDEX IF NOT EXISTS idx_class_invites_email ON class_invites(invitee_email);
CREATE INDEX IF NOT EXISTS idx_class_invites_status ON class_invites(status);
