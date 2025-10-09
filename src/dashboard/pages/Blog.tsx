const POSTS = [
  {
    title: "Designing reflection routines that stick",
    date: "Published 12 Sep",
    summary:
      "A look into how math teachers are using audio reflections to create a richer picture of student mastery.",
  },
  {
    title: "Family partnership playbook",
    date: "Published 4 Sep",
    summary:
      "Step-by-step templates to run responsive, multilingual communication with less manual work.",
  },
  {
    title: "Instructional coaching toolkit",
    date: "Published 24 Aug",
    summary:
      "Discover how coaches orchestrate observations, goals, and feedback cycles inside Akadeo.",
  },
];

export default function DashboardBlogPage() {
  return (
    <section className="dashboard-panel">
      <header className="dashboard-panel__header">
        <h1>Latest from the Akadeo team</h1>
        <p>Dig into product notes, instructional strategy, and stories from the community.</p>
      </header>
      <div className="dashboard-stack">
        {POSTS.map((post) => (
          <article key={post.title} className="dashboard-slab dashboard-slab--blog">
            <header>
              <p className="dashboard-slab__meta">{post.date}</p>
              <h2>{post.title}</h2>
            </header>
            <p>{post.summary}</p>
            <button className="dashboard-card__action" type="button">
              Open article
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
