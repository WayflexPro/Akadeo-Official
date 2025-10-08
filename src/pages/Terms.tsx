const sections = [
  {
    heading: "Terms of Service",
    body:
      "Welcome to Akadeo! By accessing or using our services, you agree to the following terms. We may update these terms from time to time, and will notify you of significant changes.",
  },
  {
    heading: "Acceptable Use",
    body:
      "You agree to use Akadeo for lawful educational purposes, respect intellectual property rights, and protect the privacy of all users.",
  },
  {
    heading: "Accounts",
    body:
      "Account owners are responsible for maintaining the confidentiality of their login credentials and ensuring all users comply with institutional policies.",
  },
  {
    heading: "Liability",
    body:
      "Akadeo provides the platform \"as is\" without warranties. Our liability is limited to the fullest extent permitted by law.",
  },
  {
    heading: "Service level commitments",
    body:
      "We aim for 99.9% uptime and provide proactive maintenance notices. If we fall short, affected partners receive service credits in accordance with your agreement.",
  },
  {
    heading: "Contact",
    body:
      "For questions about these terms, email legal@akadeo.com. We respond to all requests within five business days.",
  },
] as const;

export default function TermsPage() {
  return (
    <section className="page" id="terms">
      <div className="page__inner">
        <div className="container legal">
          {sections.map(({ heading, body }) => (
            <div key={heading}>
              <h2>{heading}</h2>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
