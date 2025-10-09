const FEATURE_CARDS = [
  {
    title: "Curriculum composer",
    body:
      "Assemble units, automate standards alignment, and instantly share learning playlists with co-teachers.",
  },
  {
    title: "Insight loops",
    body:
      "Track formative checks, pull in student voice, and surface intervention suggestions that matter now.",
  },
  {
    title: "Family bridge",
    body:
      "Schedule weekly snapshots that translate progress into plain language for every guardian on file.",
  },
  {
    title: "AI drafting assistant",
    body:
      "Generate accommodations, exit tickets, and celebration notes tuned to your students in seconds.",
  },
];

export default function DashboardFeaturesPage() {
  return (
    <section className="dashboard-panel">
      <header className="dashboard-panel__header">
        <h1>Tools that meet the moment</h1>
        <p>
          Explore the workspace capabilities that unlock time and clarity for your classroom operations.
        </p>
      </header>
      <div className="dashboard-grid dashboard-grid--features">
        {FEATURE_CARDS.map((feature) => (
          <article key={feature.title} className="dashboard-card dashboard-card--feature">
            <h2>{feature.title}</h2>
            <p>{feature.body}</p>
            <button className="dashboard-card__action" type="button">
              Launch {feature.title.toLowerCase()}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
