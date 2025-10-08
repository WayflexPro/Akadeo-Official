import { FormEvent, useState } from "react";
import { login } from "../features/auth/api";
import { resolveApiErrorMessage } from "../features/auth/errors";

type SubmitState = "idle" | "loading" | "success" | "error";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string>("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setStatus("error");
      setMessage("Enter your email and password to continue.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("");

      const payload = await login({ email: email.trim().toLowerCase(), password });

      setStatus("success");
      const requiresSetup = Boolean(payload?.data?.requiresSetup);
      setMessage(
        requiresSetup
          ? payload.data?.message ?? "Welcome back! Let’s finish your setup…"
          : payload.data?.message ?? "Welcome back! Redirecting to your dashboard…",
      );
      window.location.href = requiresSetup ? "/setup.php" : "/dashboard.php";
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage(resolveApiErrorMessage(error, "We couldn't sign you in."));
    }
  };

  return (
    <section className="page" id="sign-in">
      <div className="page__inner">
        <div className="container auth">
          <div className="auth-card reveal">
            <h2>Welcome back</h2>
            <p>Sign in to continue your Akadeo journey.</p>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                <span>Email</span>
                <input
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                />
              </label>
              <button className="primary" disabled={status === "loading"} type="submit">
                {status === "loading" ? "Signing in…" : "Sign In"}
              </button>
            </form>
            {message && <p className={`form-message form-message--${status}`}>{message}</p>}
            <p className="auth-switch">
              New to Akadeo? <a data-nav="sign-up" href="#sign-up">Create an account</a>
            </p>
            <div className="auth-more">
              <h3>Need a district launch?</h3>
              <p>Request SSO provisioning, roster sync, and compliance documentation.</p>
              <a className="ghost" data-nav="contact" href="#contact">
                Talk to our team
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
