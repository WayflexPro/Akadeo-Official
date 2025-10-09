const QUESTIONS = [
  {
    question: "How do I bring my existing curriculum into the workspace?",
    answer:
      "Upload units as PDFs, Google Docs, or slide decks and the curriculum composer will auto-tag standards, vocabulary, and resources for you to remix.",
  },
  {
    question: "Can I invite co-teachers and specialists?",
    answer:
      "Absolutely. Add collaborators to any class to share planning boards, student portfolios, and intervention notes instantly.",
  },
  {
    question: "What happens when a family needs translated updates?",
    answer:
      "Family bridge delivers updates in 110+ languages and keeps a record of delivery confirmation for compliance reporting.",
  },
];

export default function DashboardFAQPage() {
  return (
    <section className="dashboard-panel">
      <header className="dashboard-panel__header">
        <h1>Workspace questions, answered</h1>
        <p>Find quick guidance on the most common requests we hear from educators in Akadeo.</p>
      </header>
      <dl className="dashboard-faq">
        {QUESTIONS.map((item) => (
          <div key={item.question}>
            <dt>{item.question}</dt>
            <dd>{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
