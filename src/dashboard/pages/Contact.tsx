export default function DashboardContactPage() {
  return (
    <section className="dashboard-panel">
      <header className="dashboard-panel__header">
        <h1>Need a hand?</h1>
        <p>Reach the Akadeo support studio right from your workspace.</p>
      </header>
      <div className="dashboard-contact">
        <div className="dashboard-contact__card">
          <h2>Message the team</h2>
          <p>
            Start a conversation with our support educators. Average response time is under 5 minutes during
            school hours.
          </p>
          <button className="dashboard-card__action" type="button">
            Open live chat
          </button>
        </div>
        <form className="dashboard-contact__form">
          <h2>Share context</h2>
          <label>
            <span>Topic</span>
            <select>
              <option>Curriculum planning</option>
              <option>Family communication</option>
              <option>Integrations</option>
              <option>Account &amp; billing</option>
            </select>
          </label>
          <label>
            <span>Details</span>
            <textarea placeholder="Let us know how we can help"></textarea>
          </label>
          <button className="dashboard-card__action" type="button">
            Send to support
          </button>
        </form>
      </div>
    </section>
  );
}
