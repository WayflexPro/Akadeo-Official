export default function SignInPage() {
  return (
    <section className="page" id="sign-in">
      <div className="page__inner">
        <div className="container auth">
          <div className="auth-card reveal">
            <h2>Welcome back</h2>
            <p>Sign in to continue your Akadeo journey.</p>
            <form className="auth-form">
              <label>
                <span>Email</span>
                <input type="email" placeholder="you@example.com" required />
              </label>
              <label>
                <span>Password</span>
                <input type="password" placeholder="••••••••" required />
              </label>
              <a className="ghost small" href="#">
                Forgot password?
              </a>
              <button className="primary" type="submit">
                Sign In
              </button>
            </form>
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
