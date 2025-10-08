import { homepage } from "../../content/siteContent";

export default function HomePage() {
  return (
    <>
      <section className="section hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Teacher-built, teacher-trusted</p>
            <h1>{homepage.heroTitle}</h1>
            <p className="lead">{homepage.heroSubtitle}</p>
            <div className="hero-actions">
              <a className="primary" href="#sign-up" data-nav="sign-up">
                {homepage.ctaPrimary}
              </a>
              <a className="ghost" href="#pricing" data-nav="pricing">
                {homepage.ctaSecondary}
              </a>
            </div>
          </div>
          <div className="hero-trust" aria-label="Key benefits">
            <h2 className="sr-only">Why teachers choose Akadeo</h2>
            <ul>
              {homepage.trustBullets.map((bullet) => (
                <li key={bullet}>
                  <span className="checkmark" aria-hidden="true">
                    ✓
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section trust-section">
        <div className="container trust-content">
          <div>
            <h2>Built to save hours, not add work</h2>
            <p>
              Akadeo brings planning, assessment, and insight tools together so classrooms keep moving
              forward.
            </p>
          </div>
          <dl className="trust-metrics">
            <div>
              <dt>Minutes to launch your first quiz</dt>
              <dd>5</dd>
            </div>
            <div>
              <dt>Teachers onboarded last semester</dt>
              <dd>2,400+</dd>
            </div>
            <div>
              <dt>Average hours saved each month</dt>
              <dd>10+</dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  );
}
