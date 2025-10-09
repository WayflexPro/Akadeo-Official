export default function DashboardHomePage() {
  return (
    <section className="dashboard-panel">
      <header className="dashboard-panel__header">
        <h1>Welcome back to your teaching hub</h1>
        <p>
          Everything you need to orchestrate lessons, monitor progress, and collaborate with
          families now lives in one place.
        </p>
      </header>
      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h2>Today&apos;s focus</h2>
          <p>Three classes still need lesson plans. Use the planning tools to drag in resources and assign goals.</p>
          <button className="dashboard-card__action" type="button">
            Open planning studio
          </button>
        </article>
        <article className="dashboard-card">
          <h2>Student pulse</h2>
          <ul>
            <li>
              <strong>78%</strong> of students have completed their formative assessments this week.
            </li>
            <li>
              <strong>12</strong> families responded to check-ins awaiting follow-up.
            </li>
            <li>
              <strong>4</strong> interventions are scheduled for tomorrow morning.
            </li>
          </ul>
        </article>
        <article className="dashboard-card dashboard-card--accent">
          <h2>Next milestone</h2>
          <p>
            Build a reflection space for your Algebra 2 unit. Invite students to submit quick audio notes so
            you can capture qualitative insight alongside grades.
          </p>
        </article>
      </div>
    </section>
  );
}
