import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { PENDING_EMAIL_STORAGE_KEY } from "./VerifyEmail";

type FormState = {
  fullName: string;
  institution: string;
  email: string;
  password: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

type SubmitState = "idle" | "loading" | "success" | "error";

const PASSWORD_RULES = [
  { test: (value: string) => value.length >= 12, label: "12+ characters" },
  { test: (value: string) => /[A-Z]/.test(value), label: "Uppercase letter" },
  { test: (value: string) => /[a-z]/.test(value), label: "Lowercase letter" },
  { test: (value: string) => /[0-9]/.test(value), label: "Number" },
  {
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
    label: "Symbol",
  },
];

const EMAIL_REGEX = /^[\w.!#$%&'*+/=?`{|}~-]+@[\w-]+(\.[\w-]+)+$/;

const evaluatePassword = (password: string) => {
  const levels = [
    { label: "Very weak", color: "#dc2626" },
    { label: "Needs work", color: "#f97316" },
    { label: "Getting there", color: "#facc15" },
    { label: "Great", color: "#16a34a" },
  ] as const;

  const metRules = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
  const ratio = PASSWORD_RULES.length === 0 ? 0 : metRules / PASSWORD_RULES.length;
  const index = password ? Math.min(levels.length - 1, Math.round(ratio * (levels.length - 1))) : 0;
  const percent = ratio * 100;

  return {
    metRules,
    percent,
    label: levels[index].label,
    color: levels[index].color,
  };
};

const normaliseEmail = (value: string) => value.trim().toLowerCase();

export default function SignUpPage() {
  const [form, setForm] = useState<FormState>({
    fullName: "",
    institution: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string>("");

  const strength = useMemo(() => evaluatePassword(form.password), [form.password]);

  const updateField = (key: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
      setErrors((current) => ({ ...current, [key]: undefined }));
    };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      nextErrors.fullName = "Enter your full name.";
    }

    if (form.email && !EMAIL_REGEX.test(normaliseEmail(form.email))) {
      nextErrors.email = "Use a valid email address.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    } else if (PASSWORD_RULES.some((rule) => !rule.test(form.password))) {
      nextErrors.password = "Use a stronger password to keep your account safe.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      setStatus("error");
      setMessage("Please fix the highlighted fields.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("");

      const payload = {
        fullName: form.fullName.trim(),
        institution: form.institution.trim(),
        email: normaliseEmail(form.email),
        password: form.password,
      };

      const response = await fetch("/api/register.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message ?? "We couldn't create your account just yet.");
      }

      window.localStorage.setItem(PENDING_EMAIL_STORAGE_KEY, payload.email);
      setStatus("success");
      setMessage("Account created! Check your inbox for a verification code.");
      window.location.hash = "#verify-email";
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  return (
    <section className="page" id="sign-up">
      <div className="page__inner">
        <div className="container auth">
          <div className="auth-card reveal">
            <h2>Create your account</h2>
            <p>Join thousands of educators transforming learning with Akadeo.</p>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <label>
                <span>Full name</span>
                <input
                  autoComplete="name"
                  onChange={updateField("fullName")}
                  placeholder="Jane Doe"
                  required
                  type="text"
                  value={form.fullName}
                />
                {errors.fullName && <span className="form-error">{errors.fullName}</span>}
              </label>
              <label>
                <span>Institution</span>
                <input
                  autoComplete="organization"
                  onChange={updateField("institution")}
                  placeholder="Sunrise High School"
                  type="text"
                  value={form.institution}
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  autoComplete="email"
                  onChange={updateField("email")}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={form.email}
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </label>
              <label>
                <span>Password</span>
                <input
                  autoComplete="new-password"
                  onChange={updateField("password")}
                  placeholder="Create a secure password"
                  required
                  type="password"
                  value={form.password}
                />
                <div
                  aria-hidden
                  className="strength-meter"
                  style={{
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error CSS custom property type
                    "--strength": `${strength.percent}%`,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error CSS custom property type
                    "--strength-color": strength.color,
                  }}
                >
                  <span className="strength-meter__bar" />
                  <span className="strength-meter__label">{strength.label}</span>
                </div>
                <ul className="password-hints">
                  {PASSWORD_RULES.map((rule) => (
                    <li
                      className={rule.test(form.password) ? "password-hints__item--met" : undefined}
                      key={rule.label}
                    >
                      {rule.label}
                    </li>
                  ))}
                </ul>
                {errors.password && <span className="form-error">{errors.password}</span>}
              </label>
              <button className="primary" disabled={status === "loading"} type="submit">
                {status === "loading" ? "Creating account…" : "Create account"}
              </button>
            </form>
            {message && <p className={`form-message form-message--${status}`}>{message}</p>}
            <p className="auth-switch">
              Already have an account? <a data-nav="sign-in" href="#sign-in">Sign in</a>
            </p>
            <div className="auth-more">
              <h3>Bring your whole team</h3>
              <p>Invite colleagues instantly or import a roster&mdash;collaboration spaces spin up automatically.</p>
              <a className="ghost" data-nav="pricing" href="#pricing">
                Compare plans
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
