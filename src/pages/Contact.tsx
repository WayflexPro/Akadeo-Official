import { contact } from "../../content/siteContent";

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function ContactPage() {
  return (
    <section className="section contact-section">
      <div className="container contact-grid">
        <div>
          <h1>Contact our team</h1>
          <p className="section-lead">
            Have a question or want to talk through a rollout? We respond within one business day.
          </p>
          <ul className="contact-info">
            <li>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
            <li>{contact.address}</li>
          </ul>
        </div>
        <form className="contact-form" method="post" action={`mailto:${contact.email}`} noValidate>
          {contact.formFields.map((field) => {
            const slug = slugify(field);
            const isMessage = field.toLowerCase() === "message";
            const isEmail = field.toLowerCase().includes("email");
            const isOptional = field.toLowerCase() === "organization";

            return (
              <label key={field} className="contact-form__field" htmlFor={slug}>
                <span>{field}</span>
                {isMessage ? (
                  <textarea id={slug} name={slug} rows={4} required />
                ) : (
                  <input
                    id={slug}
                    name={slug}
                    type={isEmail ? "email" : "text"}
                    required={!isOptional}
                  />
                )}
              </label>
            );
          })}
          <button className="primary" type="submit">
            Send message
          </button>
        </form>
      </div>
    </section>
  );
}
