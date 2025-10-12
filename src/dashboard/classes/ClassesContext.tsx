import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { registerMockClassCode, seedMockClassCodes } from "../../lib/classCode";
import {
  ClassRecord,
  ClassThemeDefinition,
  DashboardNotification,
  CreateClassInput,
  JoinClassInput,
} from "./types";

const createId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `cls_${Math.random().toString(36).slice(2)}`);

const defaultThemes: ClassThemeDefinition[] = [
  {
    id: "aurora",
    name: "Aurora Drift",
    accent: "#7cf0ff",
    accentSoft: "rgba(124, 240, 255, 0.28)",
    background: "linear-gradient(120deg, #0f172a 0%, #1f2937 45%, #111827 100%)",
    description: "Frosted blues and violets for calm collaboration.",
  },
  {
    id: "sunrise",
    name: "Sunrise Studio",
    accent: "#ffb169",
    accentSoft: "rgba(255, 177, 105, 0.24)",
    background: "linear-gradient(160deg, #311608 0%, #4f2a12 50%, #1f0a05 100%)",
    description: "Warm tones for energetic morning lessons.",
  },
  {
    id: "zen",
    name: "Zen Grove",
    accent: "#6fe7b7",
    accentSoft: "rgba(111, 231, 183, 0.32)",
    background: "linear-gradient(150deg, #0f2d25 0%, #183d34 48%, #0b1512 100%)",
    description: "Botanical gradients for focused learning.",
  },
  {
    id: "night",
    name: "Neon Night",
    accent: "#ff36d2",
    accentSoft: "rgba(255, 54, 210, 0.32)",
    background: "linear-gradient(150deg, #050018 0%, #21024a 60%, #050018 100%)",
    description: "Electric synthwave energy for project-based work.",
  },
];

const seedTeacher = {
  id: "teacher-1",
  name: "You",
  email: "you@akadeo.com",
  role: "teacher" as const,
  joinedAt: new Date().toISOString(),
};

const seedClasses: ClassRecord[] = [
  {
    id: "cls-1",
    name: "Design Thinking Studio",
    description: "Empower learners to prototype, test, and iterate with AI co-pilots.",
    subject: "Innovation",
    roomNumber: "204",
    themeId: "aurora",
    code: "NX4JQ9",
    imageUrl: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b",
    ownerId: seedTeacher.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    teachers: [seedTeacher],
    students: [
      {
        id: "student-1",
        name: "Avery Jordan",
        email: "avery@student.edu",
        role: "student",
        joinedAt: new Date().toISOString(),
      },
      {
        id: "student-2",
        name: "Kai Emerson",
        email: "kai@student.edu",
        role: "student",
        joinedAt: new Date().toISOString(),
      },
    ],
    invites: [
      {
        id: "invite-1",
        email: "mila.teacher@example.com",
        role: "teacher",
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "cls-2",
    name: "AP Literature Seminar",
    description: "Close reading labs, Socratic seminars, and AI writing workshops.",
    subject: "ELA",
    roomNumber: "B12",
    themeId: "zen",
    code: "K7LMQ2",
    imageUrl: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da",
    ownerId: seedTeacher.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    teachers: [seedTeacher],
    students: [],
    invites: [],
  },
];

seedMockClassCodes(seedClasses.map((cls) => cls.code));

interface ClassesContextValue {
  classes: ClassRecord[];
  notifications: DashboardNotification[];
  themes: ClassThemeDefinition[];
  createClass: (input: CreateClassInput) => Promise<ClassRecord>;
  updateClassTheme: (classId: string, themeId: string) => void;
  inviteTeacher: (classId: string, email: string) => void;
  joinClass: (input: JoinClassInput) => { success: boolean; classRecord?: ClassRecord; error?: string };
  getClassById: (id: string) => ClassRecord | undefined;
}

const ClassesContext = createContext<ClassesContextValue | null>(null);

export const ClassesProvider = ({ children }: PropsWithChildren) => {
  const [classes, setClasses] = useState<ClassRecord[]>(seedClasses);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);

  const appendNotification = useCallback((message: string, type: DashboardNotification["type"] = "info") => {
    setNotifications((prev) => [
      {
        id: createId(),
        message,
        type,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, []);

  const createClass = useCallback(async (input: CreateClassInput) => {
    const normalizedCode = input.code.trim().toUpperCase();
    const existingCodes = new Set(classes.map((cls) => cls.code.toUpperCase()));
    if (!normalizedCode) {
      throw new Error("Class code is required.");
    }
    if (existingCodes.has(normalizedCode)) {
      // TODO: Replace with server-side enforcement (409) once API endpoints are available to avoid race conditions.
      throw new Error("Class code already exists.");
    }

    const now = new Date().toISOString();
    const classId = createId();
    const newClass: ClassRecord = {
      id: classId,
      name: input.name,
      description: input.description,
      subject: input.subject,
      roomNumber: input.roomNumber,
      themeId: input.themeId,
      code: normalizedCode,
      imageUrl: input.imageUrl,
      ownerId: seedTeacher.id,
      createdAt: now,
      updatedAt: now,
      teachers: [seedTeacher],
      students: [],
      invites: input.teacherEmails
        .filter((email) => email.trim().length > 0)
        .map((email) => ({
          id: createId(),
          email: email.trim().toLowerCase(),
          role: "teacher" as const,
          status: "pending" as const,
          createdAt: now,
        })),
    };

    setClasses((prev) => [newClass, ...prev]);
    registerMockClassCode(normalizedCode);

    if (newClass.invites.length > 0) {
      appendNotification(`Invitations prepared for ${newClass.invites.length} fellow teacher${
        newClass.invites.length > 1 ? "s" : ""
      } in ${newClass.name}.`, "invite");
    }

    console.log("[stub] createClass payload", { input, class: newClass });

    return newClass;
  }, [appendNotification, classes]);

  const updateClassTheme = useCallback((classId: string, themeId: string) => {
    setClasses((prev) =>
      prev.map((cls) =>
        cls.id === classId
          ? {
              ...cls,
              themeId,
              updatedAt: new Date().toISOString(),
            }
          : cls
      )
    );
    console.log("[stub] updateClassTheme", { classId, themeId });
  }, []);

  const inviteTeacher = useCallback(
    (classId: string, email: string) => {
      setClasses((prev) =>
        prev.map((cls) => {
          if (cls.id !== classId) {
            return cls;
          }

          const trimmed = email.trim().toLowerCase();
          if (!trimmed) {
            return cls;
          }

          const alreadyInvited = cls.invites.some((invite) => invite.email === trimmed);
          if (alreadyInvited) {
            appendNotification(`An invitation is already pending for ${trimmed}.`, "info");
            return cls;
          }

          const updatedClass: ClassRecord = {
            ...cls,
            invites: [
              {
                id: createId(),
                email: trimmed,
                role: "teacher",
                status: "pending",
                createdAt: new Date().toISOString(),
              },
              ...cls.invites,
            ],
          };

          appendNotification(`Invitation sent to ${trimmed}. See Notifications tab.`, "invite");
          console.log("[stub] inviteTeacher", { classId, email: trimmed });
          return updatedClass;
        })
      );
    },
    [appendNotification]
  );

  const joinClass = useCallback(
    (input: JoinClassInput) => {
      const classRecord = classes.find((cls) => cls.code.toLowerCase() === input.code.trim().toLowerCase());
      if (!classRecord) {
        return { success: false, error: "Class code not found." } as const;
      }

      const studentName = input.name?.trim() ?? "New Student";
      const studentEmail = input.email?.trim() ?? "student@example.com";

      setClasses((prev) =>
        prev.map((cls) =>
          cls.id === classRecord.id
            ? {
                ...cls,
                students: [
                  ...cls.students,
                  {
                    id: createId(),
                    name: studentName,
                    email: studentEmail,
                    role: "student",
                    joinedAt: new Date().toISOString(),
                  },
                ],
                updatedAt: new Date().toISOString(),
              }
            : cls
        )
      );

      console.log("[stub] joinClass", { input, classId: classRecord.id });

      return { success: true, classRecord } as const;
    },
    [classes]
  );

  const value = useMemo(
    () => ({
      classes,
      notifications,
      themes: defaultThemes,
      createClass,
      updateClassTheme,
      inviteTeacher,
      joinClass,
      getClassById: (id: string) => classes.find((cls) => cls.id === id),
    }),
    [classes, notifications, createClass, updateClassTheme, inviteTeacher, joinClass]
  );

  return <ClassesContext.Provider value={value}>{children}</ClassesContext.Provider>;
};

export const useClasses = () => {
  const context = useContext(ClassesContext);
  if (!context) {
    throw new Error("useClasses must be used within a ClassesProvider");
  }
  return context;
};
