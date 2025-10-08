import { faq } from "../../content/siteContent";

export default function FAQPage() {
  return (
    <section className="section faq-section">
      <div className="container">
        <h1>Frequently asked questions</h1>
        <p className="section-lead">
          Everything you need to know about how Akadeo supports your classroom and school.
        </p>
      </div>
      <div className="container faq-accordion">
        {faq.map(({ q, a }) => (
          <details key={q} className="faq-item">
            <summary aria-label={`${q} answer`}>{q}</summary>
            <div className="faq-item__content">{a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
