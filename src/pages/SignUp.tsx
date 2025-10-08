export default function SignUpPage() {
  return (
    <section className="page" id="sign-up">
      <div className="page__inner">
        <div className="container auth">
          <div className="auth-card reveal">
            <h2>Create your account</h2>
            <p>Join thousands of educators transforming learning with Akadeo.</p>
            <form className="auth-form">
              <label>
                <span>Full name</span>
                <input type="text" placeholder="Jane Doe" required />
              </label>
              <label>
                <span>Institution</span>
                <input type="text" placeholder="Sunrise High School" />
              </label>
              <label>
                <span>Email</span>
                <input type="email" placeholder="you@example.com" required />
              </label>
              <label>
                <span>Password</span>
                <input type="password" placeholder="Create a secure password" required />
              </label>
              <button className="primary" type="submit">
                Create account
              </button>
            </form>
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
