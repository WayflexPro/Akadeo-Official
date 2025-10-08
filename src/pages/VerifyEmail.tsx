import { FormEvent, useEffect, useMemo, useState } from "react";

type SubmitState = "idle" | "loading" | "success" | "error";

const CODE_REGEX = /^[0-9]{6}$/;

const STORAGE_KEY = "akadeo_pending_email";

const formatEmail = (email: string) => email.trim().toLowerCase();

export default function VerifyEmailPage() {
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setEmail(stored);
    }
  }, []);

  const isCodeValid = useMemo(() => CODE_REGEX.test(code), [code]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      setMessage("We couldn't find the email you used to sign up. Please start over.");
      setStatus("error");
      return;
    }
    if (!isCodeValid) {
      setMessage("Enter the 6 digit code from your inbox.");
      setStatus("error");
      return;
    }

    try {
      setStatus("loading");
      setMessage("");

      const response = await fetch("/api/verify.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formatEmail(email),
          code: code.trim(),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? "Verification failed.");
      }

      window.localStorage.removeItem(STORAGE_KEY);
      setStatus("success");
      const requiresSetup = Boolean(payload?.requiresSetup);
      setMessage(
        requiresSetup
          ? "Email verified! Let’s finish getting to know you…"
          : "Email verified! Redirecting to your dashboard...",
      );
      window.location.href = requiresSetup ? "/setup.php" : "/dashboard.php";
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Verification failed.");
    }
  };

  const handleResend = async () => {
    if (!email) {
      setMessage("Start the sign up process again so we know where to send the code.");
      setStatus("error");
      return;
    }

    try {
      setStatus("loading");
      setMessage("");

      const response = await fetch("/api/resend-verification.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formatEmail(email) }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? "Couldn't resend the code.");
      }

      setStatus("success");
      setMessage("A fresh code is on its way. Check your inbox!");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Couldn't resend the code.");
    }
  };

  return (
    <section className="page" id="verify-email">
      <div className="page__inner">
        <div className="container auth">
          <div className="auth-card reveal">
            <h2>Check your inbox</h2>
            <p>
              We sent a 6 digit code to <strong>{email || "your email"}</strong>. Enter it below to
              activate your account.
            </p>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                <span>Verification code</span>
                <input
                  inputMode="numeric"
                  maxLength={6}
                  minLength={6}
                  pattern="[0-9]{6}"
                  placeholder="123456"
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ""))}
                />
              </label>
              <button className="primary" type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Verifying…" : "Verify email"}
              </button>
            </form>
            <button
              className="ghost"
              disabled={status === "loading"}
              onClick={handleResend}
              type="button"
            >
              Resend code
            </button>
            {message && (
              <p className={`form-message form-message--${status}`}>{message}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export { STORAGE_KEY as PENDING_EMAIL_STORAGE_KEY };
