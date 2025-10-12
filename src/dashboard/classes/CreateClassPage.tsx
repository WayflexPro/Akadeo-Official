import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { useClasses } from "./ClassesContext";
import { useClassCode } from "../../hooks/useClassCode";

const EMAIL_SPLIT_REGEX = /[\s,;]+/;

export function CreateClassPage() {
  const navigate = useNavigate();
  const { createClass, themes } = useClasses();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { code, status, message, regenerate, recheckBeforeSubmit, canSubmit, isChecking } = useClassCode();
  const [copyLabel, setCopyLabel] = useState("Copy");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formState, setFormState] = useState({
    name: "",
    description: "",
    subject: "",
    roomNumber: "",
    themeId: themes[0]?.id ?? "aurora",
    teacherEmails: "",
    imageUrl: "",
  });

  const parsedTeacherEmails = useMemo(
    () =>
      formState.teacherEmails
        .split(EMAIL_SPLIT_REGEX)
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0),
    [formState.teacherEmails]
  );

  const handleCopy = useCallback(async () => {
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopyLabel("Copied!");
      copyTimeoutRef.current = setTimeout(() => {
        setCopyLabel("Copy");
        copyTimeoutRef.current = null;
      }, 1600);
    } catch (copyError) {
      console.error("Failed to copy class code", copyError);
      setError("We couldn't copy the class code automatically. Please copy it manually.");
      setCopyLabel("Copy");
    }
  }, [code]);

  useEffect(() => {
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }
    setCopyLabel("Copy");
  }, [code]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const statusBadge = useMemo(() => {
    switch (status) {
      case "available":
        return { label: "Available", variant: "success" as const, className: "" };
      case "taken":
        return {
          label: "Already used",
          variant: "outline" as const,
          className: "border-rose-200 bg-rose-100 text-rose-700",
        };
      case "error":
        return { label: "Error", variant: "warning" as const, className: "" };
      case "checking":
      case "idle":
      default:
        return {
          label: "Checking…",
          variant: "outline" as const,
          className: "border-slate-300 bg-slate-100 text-slate-600",
        };
    }
  }, [status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.name.trim()) {
      setError("Class name is required.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const isUnique = await recheckBeforeSubmit();
      if (!isUnique) {
        setError(
          "Class code changed while you were editing. We've generated a new one—please review it before submitting again."
        );
        return;
      }

      const newClass = await createClass({
        name: formState.name.trim(),
        description: formState.description.trim() || undefined,
        subject: formState.subject.trim() || undefined,
        roomNumber: formState.roomNumber.trim() || undefined,
        themeId: formState.themeId,
        teacherEmails: parsedTeacherEmails,
        imageUrl: formState.imageUrl.trim() || previewUrl || undefined,
        code,
      });

      console.log("Generated class code", newClass.code);
      navigate(`/dashboard/classes/${newClass.id}`);
    } catch (submissionError) {
      console.error("Failed to create class", submissionError);
      setError("Something went wrong while creating the class. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const selectedTheme = themes.find((theme) => theme.id === formState.themeId);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="border-slate-200">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-slate-900">Create a new class</CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Define the essentials, add co-teachers, and select a visual theme. Real-time saving and integrations will
            arrive once the API endpoints are wired up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="class-name">Class name *</Label>
              <Input
                id="class-name"
                required
                placeholder="Ex: 9th Grade Biology"
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="class-description">Description</Label>
              <Textarea
                id="class-description"
                placeholder="Summarize what happens in this class."
                value={formState.description}
                onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="class-subject">Subject</Label>
                <Input
                  id="class-subject"
                  placeholder="Biology, Algebra, ELA…"
                  value={formState.subject}
                  onChange={(event) => setFormState((prev) => ({ ...prev, subject: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="class-room">Room number</Label>
                <Input
                  id="class-room"
                  placeholder="Room 203"
                  value={formState.roomNumber}
                  onChange={(event) => setFormState((prev) => ({ ...prev, roomNumber: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="class-teachers">Invite co-teachers (emails)</Label>
              <Input
                id="class-teachers"
                placeholder="mila@school.edu, jordan@school.edu"
                value={formState.teacherEmails}
                onChange={(event) => setFormState((prev) => ({ ...prev, teacherEmails: event.target.value }))}
              />
              {parsedTeacherEmails.length > 0 && (
                <p className="text-xs text-slate-500">
                  Will invite: {parsedTeacherEmails.join(", ")}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="class-code" className="flex items-center gap-2">
                  Class code
                  <Badge variant={statusBadge.variant} className={statusBadge.className}>
                    {statusBadge.label}
                  </Badge>
                </Label>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                <Input id="class-code" value={code} readOnly className="font-mono uppercase" />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isChecking}
                  onClick={() => {
                    void regenerate();
                  }}
                >
                  Regenerate
                </Button>
                <Button type="button" variant="outline" onClick={() => void handleCopy()}>
                  {copyLabel}
                </Button>
              </div>
              <p
                className={
                  status === "available"
                    ? "text-xs font-medium text-emerald-600"
                    : status === "taken"
                    ? "text-xs font-medium text-rose-600"
                    : status === "error"
                    ? "text-xs font-medium text-amber-600"
                    : "text-xs text-slate-500"
                }
              >
                {message}
              </p>
              <p className="text-[11px] text-slate-400">
                Codes refresh automatically if someone else grabs this one before you finish. Final enforcement will
                happen on the server (TODO: add 409 response once API is ready).
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="class-image">Class cover image</Label>
              <Input id="class-image" type="file" accept="image/*" onChange={handleFileChange} />
              <Input
                id="class-image-url"
                placeholder="or paste an image URL"
                value={formState.imageUrl}
                onChange={(event) => setFormState((prev) => ({ ...prev, imageUrl: event.target.value }))}
              />
              {(previewUrl || formState.imageUrl) && (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <img
                    src={previewUrl || formState.imageUrl}
                    alt="Class preview"
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="class-theme">Theme</Label>
              <Select
                id="class-theme"
                value={formState.themeId}
                onChange={(event) => setFormState((prev) => ({ ...prev, themeId: event.target.value }))}
              >
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </Select>
              {selectedTheme && (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <span
                    aria-hidden
                    className="inline-block h-10 w-10 rounded-lg"
                    style={{ background: selectedTheme.background }}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{selectedTheme.name}</p>
                    <p className="text-xs text-slate-500">{selectedTheme.description}</p>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => navigate("/dashboard/classes")}>Cancel</Button>
              <Button type="submit" size="lg" disabled={isSubmitting || !canSubmit || isChecking}>
                {isSubmitting ? "Creating class…" : "Create class"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
