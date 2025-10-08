import { about } from "../../content/siteContent";

export default function AboutPage() {
  return (
    <section className="section about-section">
      <div className="container about-grid">
        <div>
          <h1>Our mission</h1>
          <p>{about.mission}</p>
        </div>
        <div>
          <h2>What guides us</h2>
          <ul>
            {about.values.map((value) => (
              <li key={value}>
                <span className="checkmark" aria-hidden="true">
                  ✓
                </span>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
