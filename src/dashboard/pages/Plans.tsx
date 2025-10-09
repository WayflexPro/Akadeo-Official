const PLANS = [
  {
    name: "Starter",
    description: "Launch lightweight workflows for a single classroom team.",
    price: "$18",
    cadence: "per educator / month",
    highlights: ["Unlimited lesson boards", "Weekly family digest", "1 GB resource locker"],
  },
  {
    name: "Growth",
    description: "Scale collaboration across grade-level teams with shared analytics.",
    price: "$45",
    cadence: "per educator / month",
    highlights: ["Curriculum composer", "Insight loops", "Shared intervention tracker"],
    isPopular: true,
  },
  {
    name: "District",
    description: "Centralise compliance, provisioning, and data integrations for districts.",
    price: "Let&apos;s talk",
    cadence: "custom partnership",
    highlights: ["Roster sync", "Data lake exports", "Dedicated launch strategist"],
  },
];

export default function DashboardPlansPage() {
  return (
    <section className="dashboard-panel">
      <header className="dashboard-panel__header">
        <h1>Select the workspace plan that fits</h1>
        <p>
          Choose a plan to unlock the level of support and automation your learning community needs.
        </p>
      </header>
      <div className="dashboard-grid dashboard-grid--plans">
        {PLANS.map((plan) => (
          <article
            key={plan.name}
            className={`dashboard-card dashboard-card--plan${plan.isPopular ? " dashboard-card--plan-popular" : ""}`}
          >
            <div className="dashboard-card__plan-head">
              <h2>{plan.name}</h2>
              {plan.isPopular && <span className="dashboard-badge">Most selected</span>}
              <p>{plan.description}</p>
            </div>
            <p className="dashboard-card__price">
              <span dangerouslySetInnerHTML={{ __html: plan.price }} />
              <small>{plan.cadence}</small>
            </p>
            <ul>
              {plan.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
            <button className="dashboard-card__action" type="button">
              {plan.name === "District" ? "Talk with us" : `Choose ${plan.name}`}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
