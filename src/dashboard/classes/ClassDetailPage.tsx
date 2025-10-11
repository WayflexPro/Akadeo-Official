import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useClasses } from "./ClassesContext";

const teacherOnlyTabs = new Set(["themes", "settings"]);

const toolsPreview = [
  {
    title: "AI Quiz Generator",
    description: "Draft exit tickets, comprehension checks, and standards-aligned assessments in seconds.",
  },
  {
    title: "Assignments",
    description: "Build, schedule, and differentiate assignments with automatic reminders.",
  },
  {
    title: "Gradebook",
    description: "Sync submissions, rubric scores, and mastery data—AI-assisted comments included.",
  },
  {
    title: "Learning Insights",
    description: "Visualize progress, gaps, and engagement trends to guide instruction.",
  },
];

const settingsPlaceholders = [
  "Rename class",
  "Archive class",
  "Export gradebook",
  "Manage integrations",
];

const toastDuration = 3200;

export function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = (searchParams.get("role") ?? "teacher").toLowerCase();
  const isStudent = role === "student";
  const { getClassById, themes, inviteTeacher, updateClassTheme } = useClasses();
  const classroom = classId ? getClassById(classId) : undefined;
  const [activeTab, setActiveTab] = useState("overview");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const [toastTimeout, setToastTimeout] = useState<number | null>(null);

  const availableTabs = useMemo(() => {
    const base = [
      { id: "overview", label: "Overview" },
      { id: "tools", label: "Tools" },
      { id: "members", label: "Members" },
      { id: "themes", label: "Themes" },
      { id: "settings", label: "Settings" },
    ];
    return base.map((tab) => ({ ...tab, disabled: isStudent && teacherOnlyTabs.has(tab.id) }));
  }, [isStudent]);

  const selectedTheme = themes.find((theme) => theme.id === classroom?.themeId);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimeout) {
      window.clearTimeout(toastTimeout);
    }
    const timeoutId = window.setTimeout(() => setToast(null), toastDuration);
    setToastTimeout(timeoutId);
  };

  useEffect(() => {
    return () => {
      if (toastTimeout) {
        window.clearTimeout(toastTimeout);
      }
    };
  }, [toastTimeout]);

  const handleInvite = () => {
    if (!classroom) return;
    if (!inviteEmail.trim()) {
      showToast("Enter an email to invite a co-teacher.");
      return;
    }
    inviteTeacher(classroom.id, inviteEmail);
    setInviteEmail("");
    setInviteOpen(false);
    showToast("Invitation sent. See Notifications tab.");
  };

  const handleCopyCode = async () => {
    if (!classroom) return;
    try {
      await navigator.clipboard.writeText(classroom.code);
      showToast("Class code copied to clipboard.");
    } catch (error) {
      console.warn("Unable to copy code", error);
      showToast("Copy failed—select the code and press ⌘/Ctrl+C.");
    }
  };

  if (!classroom) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Class not found</CardTitle>
            <CardDescription>We couldn’t locate that class. Return to the classes dashboard to try again.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard/classes")}>Back to classes</Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const teachers = classroom.teachers;
  const students = classroom.students;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Link to="/dashboard/classes" className="font-medium text-akadeo-secondary hover:underline">
              Classes
            </Link>
            <span>›</span>
            <span>{classroom.name}</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{classroom.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            {classroom.subject && <Badge variant="outline">{classroom.subject}</Badge>}
            {classroom.roomNumber && <Badge variant="outline">Room {classroom.roomNumber}</Badge>}
            <Badge variant="default">Code: {classroom.code}</Badge>
          </div>
        </div>
        {selectedTheme && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span
              aria-hidden
              className="inline-block h-12 w-12 rounded-lg"
              style={{ background: selectedTheme.background }}
            />
            <div>
              <p className="text-sm font-medium text-slate-700">Theme</p>
              <p className="text-xs text-slate-500">{selectedTheme.name}</p>
            </div>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList role="tablist">
          {availableTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} disabled={tab.disabled}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="overview">
              <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">About this class</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {classroom.description ?? "Add a description to give colleagues and students quick context."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                    <p>
                      Upcoming automation will save attendance snapshots, sync rosters, and surface readiness signals.
                      Today’s UI sets the stage for those workflows.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700">Quick stats</h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      <li>{teachers.length} teacher{teachers.length === 1 ? "" : "s"}</li>
                      <li>{students.length} student{students.length === 1 ? "" : "s"}</li>
                      <li>Invites pending: {classroom.invites.length}</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700">Share class code</h3>
                    <p className="mt-2 text-xs text-slate-500">
                      Students can join using this code until you disable it from settings.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <code className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold tracking-widest text-white">
                        {classroom.code}
                      </code>
                      <Button size="sm" variant="outline" onClick={handleCopyCode}>
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tools">
              <div className="grid gap-4 md:grid-cols-2">
                {toolsPreview.map((tool) => (
                  <div key={tool.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">{tool.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{tool.description}</p>
                    <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">
                      Launching soon
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="members">
              <div className="space-y-6">
                <section className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Teachers</h3>
                      <p className="text-sm text-slate-600">Collaborate with co-teachers to share planning and grading.</p>
                    </div>
                    {!isStudent && (
                      <Button onClick={() => setInviteOpen(true)}>Invite teacher</Button>
                    )}
                  </div>
                  <ul className="grid gap-3">
                    {teachers.map((teacher) => (
                      <li key={teacher.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-1 text-sm text-slate-700">
                          <span className="font-medium text-slate-900">{teacher.name}</span>
                          <span className="text-slate-500">{teacher.email}</span>
                          <span className="text-xs uppercase tracking-wide text-slate-400">Joined {new Date(teacher.joinedAt).toLocaleDateString()}</span>
                        </div>
                      </li>
                    ))}
                    {classroom.invites.length > 0 && (
                      <li className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm text-slate-500">
                        Pending invites: {classroom.invites.map((invite) => invite.email).join(", ")}
                      </li>
                    )}
                  </ul>
                </section>

                <section className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Students</h3>
                      <p className="text-sm text-slate-600">Share the class code to let students enroll instantly.</p>
                    </div>
                    {!isStudent && (
                      <Button variant="outline" onClick={handleCopyCode}>
                        Show code
                      </Button>
                    )}
                  </div>
                  <ul className="grid gap-3">
                    {students.length === 0 ? (
                      <li className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-sm text-slate-500">
                        No students yet. Share {classroom.code} with your roster.
                      </li>
                    ) : (
                      students.map((student) => (
                        <li key={student.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-col gap-1 text-sm text-slate-700">
                            <span className="font-medium text-slate-900">{student.name}</span>
                            <span className="text-slate-500">{student.email}</span>
                            <span className="text-xs uppercase tracking-wide text-slate-400">Joined {new Date(student.joinedAt).toLocaleDateString()}</span>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="themes">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Choose a class theme</h3>
                  <p className="text-sm text-slate-600">
                    Themes personalize the class experience. Saving updates the class record instantly once APIs are ready.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      className={`group relative overflow-hidden rounded-2xl border ${
                        classroom.themeId === theme.id ? "border-akadeo-primary" : "border-transparent"
                      } bg-white shadow-sm transition hover:shadow-lg`}
                    >
                      <div className="h-28 w-full" style={{ background: theme.background }} />
                      <div className="space-y-2 p-4">
                        <h4 className="text-lg font-semibold text-slate-900">{theme.name}</h4>
                        <p className="text-sm text-slate-600">{theme.description}</p>
                        <Button
                          size="sm"
                          variant={classroom.themeId === theme.id ? "secondary" : "outline"}
                          onClick={() => updateClassTheme(classroom.id, theme.id)}
                        >
                          {classroom.themeId === theme.id ? "Selected" : "Use theme"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Class settings</h3>
                  <p className="text-sm text-slate-600">
                    These controls are placeholders for future API-powered actions like archiving or syncing rosters.
                  </p>
                </div>
                <ul className="grid gap-3 text-sm text-slate-600">
                  {settingsPlaceholders.map((setting) => (
                    <li key={setting} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      {setting}
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>

      <AnimatePresence>
        {inviteOpen && !isStudent && (
          <InviteTeacherDialog
            key="invite"
            email={inviteEmail}
            onEmailChange={setInviteEmail}
            onClose={() => setInviteOpen(false)}
            onSubmit={handleInvite}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-8 right-8 z-50 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface InviteTeacherDialogProps {
  email: string;
  onEmailChange: (email: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

function InviteTeacherDialog({ email, onEmailChange, onClose, onSubmit }: InviteTeacherDialogProps) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Invite a co-teacher</h2>
          <p className="text-sm text-slate-600">
            We’ll send them a class invite once the notifications API is enabled.
          </p>
          <div className="grid gap-2">
            <Label htmlFor="invite-email">Teacher email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="co-teacher@school.edu"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
            />
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>Send invite</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
