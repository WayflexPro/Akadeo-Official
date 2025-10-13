import { nanoid } from "nanoid";
import type { PoolClient } from "pg";

export interface CreateClassInput {
  name: string;
  description?: string | null;
  subject?: string | null;
  roomNumber?: string | null;
  theme?: string;
  code: string;
  imageUrl?: string | null;
  ownerId: string;
}

export interface ClassRow {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  room_number: string | null;
  theme: string;
  code: string;
  image_url: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface AddMemberInput {
  classId: string;
  userId: string;
  role: "teacher" | "student";
}

export interface ClassMemberRow {
  id: string;
  class_id: string;
  user_id: string;
  role: "teacher" | "student";
  created_at: string;
}

export interface CreateInviteInput {
  classId: string;
  email: string;
}

export interface ClassInviteRow {
  id: string;
  class_id: string;
  invitee_email: string;
  role: "teacher";
  status: "pending" | "accepted" | "declined" | "expired";
  created_at: string;
}

function toDbTimestamp(date: Date): string {
  return date.toISOString();
}

export async function insertClass(
  client: PoolClient,
  input: CreateClassInput
): Promise<ClassRow> {
  const id = nanoid();
  const now = toDbTimestamp(new Date());
  const theme = input.theme ?? "default";
  const { rows } = await client.query<ClassRow>(
    `INSERT INTO classes (
      id, name, description, subject, room_number, theme, code, image_url, owner_id, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)
    RETURNING *`,
    [
      id,
      input.name,
      input.description ?? null,
      input.subject ?? null,
      input.roomNumber ?? null,
      theme,
      input.code,
      input.imageUrl ?? null,
      input.ownerId,
      now,
    ]
  );
  return rows[0];
}

export async function insertClassMember(
  client: PoolClient,
  input: AddMemberInput
): Promise<ClassMemberRow> {
  const id = nanoid();
  const createdAt = toDbTimestamp(new Date());
  const { rows } = await client.query<ClassMemberRow>(
    `INSERT INTO class_members (id, class_id, user_id, role, created_at)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [id, input.classId, input.userId, input.role, createdAt]
  );
  return rows[0];
}

export async function insertTeacherInvite(
  client: PoolClient,
  input: CreateInviteInput
): Promise<ClassInviteRow> {
  const id = nanoid();
  const createdAt = toDbTimestamp(new Date());
  const { rows } = await client.query<ClassInviteRow>(
    `INSERT INTO class_invites (id, class_id, invitee_email, role, status, created_at)
     VALUES ($1,$2,$3,'teacher','pending',$4)
     RETURNING *`,
    [id, input.classId, input.email.toLowerCase(), createdAt]
  );
  return rows[0];
}
