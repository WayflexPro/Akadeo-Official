import { featuresPage } from "../../content/siteContent";

export default function FeaturesPage() {
  return (
    <section className="section features-section">
      <div className="container">
        <h1>Features designed with educators</h1>
        <p className="section-lead">
          Explore what you can do with Akadeo. Each section focuses on saving time and amplifying student
          learning.
        </p>
      </div>
      <div className="container features-accordion">
        {featuresPage.sections.map((feature, index) => (
          <details key={feature.title} className="feature-card" open={index === 0}>
            <summary aria-label={`${feature.title} details`}>
              <span>{feature.title}</span>
            </summary>
            <div className="feature-card__content">
              <ul>
                {feature.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
