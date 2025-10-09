export default function DashboardAboutPage() {
  return (
    <section className="dashboard-panel">
      <header className="dashboard-panel__header">
        <h1>The story behind the workspace</h1>
        <p>
          Learn how Akadeo&apos;s instructional team is shaping the tools you use every day to connect
          curriculum, communication, and community.
        </p>
      </header>
      <div className="dashboard-stack">
        <article className="dashboard-slab">
          <h2>Designing with educators</h2>
          <p>
            Each feature inside the workspace is co-designed with teachers in live sessions. We ship
            weekly updates and document the rationale behind every workflow change.
          </p>
        </article>
        <article className="dashboard-slab">
          <h2>Partnership council</h2>
          <p>
            District leaders and instructional coaches meet quarterly with the product team to ensure
            our roadmap reflects real classroom needs, compliance requirements, and equity goals.
          </p>
        </article>
        <article className="dashboard-slab">
          <h2>Impact snapshots</h2>
          <p>
            Dive into dashboards that summarise family engagement, student voice, and learning growth so
            you can tell the story of your classroom with clarity.
          </p>
        </article>
      </div>
    </section>
  );
}
