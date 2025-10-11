import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useClasses } from "./ClassesContext";

export function JoinClassPage() {
  const navigate = useNavigate();
  const { joinClass } = useClasses();
  const [code, setCode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code.trim()) {
      setError("Enter a class code to continue.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const result = joinClass({ code, name: studentName, email: studentEmail });

    if (!result.success || !result.classRecord) {
      setError(result.error ?? "Unable to join class with that code.");
      setIsSubmitting(false);
      return;
    }

    navigate(`/dashboard/classes/${result.classRecord.id}?role=student`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-900">Join a class</CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Enter the class code shared by your teacher. We’ll confirm the details once membership syncing is wired up to
            the API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="class-code">Class code</Label>
              <Input
                id="class-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="Ex: NX4JQ9"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="student-name">Your name</Label>
              <Input
                id="student-name"
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                placeholder="Student name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="student-email">Email (optional)</Label>
              <Input
                id="student-email"
                type="email"
                value={studentEmail}
                onChange={(event) => setStudentEmail(event.target.value)}
                placeholder="student@school.edu"
              />
            </div>

            {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => navigate("/dashboard/classes")}>Cancel</Button>
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Joining…" : "Join class"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
