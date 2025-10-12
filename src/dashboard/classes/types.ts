export type ClassRole = "teacher" | "student";

export type InviteStatus = "pending" | "accepted" | "declined" | "expired";

export interface ClassMember {
  id: string;
  name: string;
  email: string;
  role: ClassRole;
  joinedAt: string;
}

export interface ClassThemeDefinition {
  id: string;
  name: string;
  accent: string;
  accentSoft: string;
  background: string;
  description: string;
}

export interface ClassInvite {
  id: string;
  email: string;
  role: "teacher";
  status: InviteStatus;
  createdAt: string;
}

export interface ClassRecord {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  roomNumber?: string;
  themeId: string;
  code: string;
  imageUrl?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  teachers: ClassMember[];
  students: ClassMember[];
  invites: ClassInvite[];
}

export interface DashboardNotification {
  id: string;
  message: string;
  createdAt: string;
  type: "invite" | "info";
}

export interface CreateClassInput {
  name: string;
  description?: string;
  subject?: string;
  roomNumber?: string;
  themeId: string;
  teacherEmails: string[];
  imageUrl?: string;
  code: string;
}

export interface JoinClassInput {
  code: string;
  name?: string;
  email?: string;
}
