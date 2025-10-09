import { FormEvent, useEffect, useMemo, useState } from "react";
import { completeSetup } from "../features/auth/api";
import { resolveApiErrorMessage } from "../features/auth/errors";
import { useAuth } from "../features/auth/AuthContext";

type SubmitState = "idle" | "loading" | "success" | "error";

type FormErrors = Partial<{
  subject: string;
  gradeLevels: string;
  studentCountRange: string;
  primaryGoal: string;
  consentAiProcessing: string;
}>;

const gradeLevelOptions = [
  { value: "k5", label: "Elementary (K-5)" },
  { value: "68", label: "Middle school (6-8)" },
  { value: "912", label: "High school (9-12)" },
  { value: "higher_ed", label: "Higher education" },
  { value: "other", label: "Other / mixed grades" },
];

const studentCountOptions = [
  { value: "under_50", label: "Fewer than 50 students" },
  { value: "50_150", label: "50-150 students" },
  { value: "150_500", label: "150-500 students" },
  { value: "over_500", label: "More than 500 students" },
];

type FormState = {
  subject: string;
  gradeLevels: string[];
  studentCountRange: string;
  primaryGoal: string;
  consentAiProcessing: boolean;
};

const defaultState: FormState = {
  subject: "",
  gradeLevels: [],
  studentCountRange: "",
  primaryGoal: "",
  consentAiProcessing: false,
};

export default function SetupPage() {
  const { state: authState, markSetupComplete } = useAuth();
  const [form, setForm] = useState<FormState>(defaultState);
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    document.body.classList.add("setup-body");
    document.body.dataset.page = "setup";
    return () => {
      document.body.classList.remove("setup-body");
      delete document.body.dataset.page;
    };
  }, []);

  useEffect(() => {
    if (authState.isAuthenticated && !authState.requiresSetup) {
      window.location.href = "/dashboard";
    } else if (!authState.isAuthenticated) {
      window.location.href = "/index.html#sign-in";
    }
  }, [authState]);

  const gradeLevelSet = useMemo(() => new Set(form.gradeLevels), [form.gradeLevels]);

  const toggleGradeLevel = (value: string) => {
    setForm((prev) => {
      const next = new Set(prev.gradeLevels);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return { ...prev, gradeLevels: Array.from(next) };
    });
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    const subject = form.subject.trim();
    const primaryGoal = form.primaryGoal.trim();

    if (subject.length < 2) {
      nextErrors.subject = "Tell us what you teach.";
    }

    if (form.gradeLevels.length === 0) {
      nextErrors.gradeLevels = "Select at least one grade level.";
    }

    if (!studentCountOptions.some((option) => option.value === form.studentCountRange)) {
      nextErrors.studentCountRange = "Let us know how many students you support.";
    }

    if (primaryGoal.length < 10) {
      nextErrors.primaryGoal = "Share a short note about your primary goal.";
    }

    if (!form.consentAiProcessing) {
      nextErrors.consentAiProcessing = "We need your consent to continue.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      setStatus("error");
      setMessage("Check the form and fix the highlighted fields.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("");

      await completeSetup({
        subject: form.subject.trim(),
        gradeLevels: form.gradeLevels,
        studentCountRange: form.studentCountRange,
        primaryGoal: form.primaryGoal.trim(),
        consentAiProcessing: form.consentAiProcessing,
      });

      setStatus("success");
      setMessage("Thanks! Redirecting you to the dashboard…");
      markSetupComplete();
      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage(resolveApiErrorMessage(error, "We couldn't save your answers."));
    }
  };

  return (
    <main className="setup">
      <section className="setup-card">
        <header className="setup-card__header">
          <p className="setup-card__eyebrow">Just a few questions</p>
          <h1>Let’s tailor Akadeo for you</h1>
          <p>Answer these quick questions so we can personalise your experience.</p>
        </header>
        {message && <p className={`form-message form-message--${status}`}>{message}</p>}
        <form className="setup-form" onSubmit={handleSubmit} noValidate>
          <label className="setup-field">
            <span>Which subjects or focus areas are most important right now?</span>
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
              placeholder="e.g. Biology, Algebra, Social Studies"
              required
            />
            {errors.subject && <p className="form-message form-message--error">{errors.subject}</p>}
          </label>

          <fieldset>
            <legend>Which grade levels do you work with?</legend>
            <div className="setup-options setup-options--wrap">
              {gradeLevelOptions.map(({ value, label }) => (
                <label className="setup-option" key={value}>
                  <input
                    type="checkbox"
                    name="gradeLevels"
                    value={value}
                    checked={gradeLevelSet.has(value)}
                    onChange={() => toggleGradeLevel(value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {errors.gradeLevels && <p className="form-message form-message--error">{errors.gradeLevels}</p>}
          </fieldset>

          <label className="setup-field">
            <span>About how many students do you support each year?</span>
            <select
              name="studentCountRange"
              value={form.studentCountRange}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, studentCountRange: event.target.value }))
              }
              required
            >
              <option value="" disabled>
                Select an option
              </option>
              {studentCountOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.studentCountRange && (
              <p className="form-message form-message--error">{errors.studentCountRange}</p>
            )}
          </label>

          <label className="setup-field">
            <span>What’s the biggest goal you have for Akadeo?</span>
            <textarea
              name="primaryGoal"
              rows={4}
              placeholder="Tell us what success looks like for you"
              value={form.primaryGoal}
              onChange={(event) => setForm((prev) => ({ ...prev, primaryGoal: event.target.value }))}
              required
            ></textarea>
            {errors.primaryGoal && <p className="form-message form-message--error">{errors.primaryGoal}</p>}
          </label>

          <label className="setup-option">
            <input
              type="checkbox"
              name="consentAiProcessing"
              checked={form.consentAiProcessing}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, consentAiProcessing: event.target.checked }))
              }
              required
            />
            <span>I consent to Akadeo using AI to process my responses so we can personalise the product.</span>
          </label>
          {errors.consentAiProcessing && (
            <p className="form-message form-message--error">{errors.consentAiProcessing}</p>
          )}

          <button className="primary" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Saving…" : "Continue to dashboard"}
          </button>
        </form>
        <p className="setup-help">
          Need a hand? <a href="mailto:support@akadeo.com">Contact support</a>.
        </p>
      </section>
    </main>
  );
}
