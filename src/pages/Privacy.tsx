const sections = [
  {
    heading: "Privacy Policy",
    body:
      "We are committed to protecting your privacy. This policy outlines what data we collect, how we use it, and the rights you have regarding your information.",
  },
  {
    heading: "Information We Collect",
    body:
      "We collect user-provided information, activity data, and technical analytics to improve the Akadeo experience.",
  },
  {
    heading: "How We Use Information",
    body:
      "Data helps us tailor recommendations, monitor platform health, and deliver support. We never sell personal information.",
  },
  {
    heading: "Your Choices",
    body:
      "You may request access, updates, or deletion of your data. Contact our privacy team at privacy@akadeo.com.",
  },
  {
    heading: "Data retention",
    body:
      "Student data is retained only as long as necessary to provide services. Districts can configure retention windows and request secure deletion at any time.",
  },
  {
    heading: "Third-party processors",
    body:
      "We vet all subprocessors for compliance and publish an updated list on our Trust Center. Changes are communicated at least 30 days in advance.",
  },
] as const;

export default function PrivacyPage() {
  return (
    <section className="page" id="privacy">
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
