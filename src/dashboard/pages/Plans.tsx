const LAUNCH_PROMO_PERCENT = 30;
const LAUNCH_PROMO_END = new Date("2025-01-05T00:00:00.000Z");
const isLaunchPromoActive = new Date() < LAUNCH_PROMO_END;

const formatPrice = (basePrice: number | null) => {
  if (basePrice === null) {
    return "Contact sales";
  }

  if (basePrice === 0) {
    return "$0.00";
  }

  if (isLaunchPromoActive) {
    const discounted = basePrice * ((100 - LAUNCH_PROMO_PERCENT) / 100);
    return `<s>$${basePrice.toFixed(2)}</s> $${discounted.toFixed(2)}`;
  }

  return `$${basePrice.toFixed(2)}`;
};

type Plan = {
  name: string;
  description: string;
  price: string;
  cadence: string;
  highlights: string[];
  isPopular?: boolean;
  tag?: string;
  monthlyPrice: number | null;
  actionLabel: string;
};

const PLANS: Plan[] = [
  {
    name: "Free",
    description: "Get started fast—no credit card required.",
    monthlyPrice: 0,
    price: formatPrice(0),
    cadence: "/mo",
    highlights: [
      "Up to 2 classes or 50 students total",
      "50 AI-generated questions / month",
      "Basic quizzes & assignments",
      "Auto-grading for MCQ/checkbox",
      "Announcements & resource sharing",
      "Email notifications",
    ],
    actionLabel: "Start for free",
  },
  {
    name: "Starter (Teacher)",
    description: "Everything a single teacher needs.",
    monthlyPrice: 6.99,
    price: formatPrice(6.99),
    cadence: "/mo",
    highlights: [
      "Unlimited classes & students",
      "Up to 5,000 AI generations / month",
      "AI-graded short answers & essays (review before publish)",
      "Question bank with tags & standards",
      "Export gradebook (CSV/Excel)",
      "Custom branding (logo & theme)",
      "Co-teachers per class (up to 2)",
      "Analytics dashboard (progress, item analysis)",
      "Priority support",
    ],
    isPopular: true,
    tag: "Most popular",
    actionLabel: "Choose Starter",
  },
  {
    name: "School",
    description: "Designed for departments and small schools.",
    monthlyPrice: 29,
    price: formatPrice(29),
    cadence: "/mo (5 seats included)",
    highlights: [
      "Includes 5 teacher seats (add more anytime)",
      "Domain-restricted access (e.g., @school.edu)",
      "Admin dashboard & usage reports",
      "SSO (Google/Microsoft)",
      "Custom AI limits & API key support",
      "Centralized data export + backups",
      "Priority email/chat support",
      "5,000 AI generations / seat / month",
      "20 GB storage / seat",
    ],
    tag: "For schools",
    actionLabel: "Choose School",
  },
  {
    name: "Enterprise",
    description: "Larger orgs, higher stakes, custom needs.",
    monthlyPrice: null,
    price: formatPrice(null),
    cadence: "per seat",
    highlights: [
      "Dedicated instance or private cloud",
      "White-label portal & custom domain",
      "Advanced security & DPA/SCCs (GDPR-first)",
      "Uptime SLA, onboarding & training",
      "Integrations (LMS/LTI, Canvas, Teams) roadmap",
      "Custom AI limits & data retention",
    ],
    tag: "Contact sales",
    actionLabel: "Contact sales",
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
              {plan.tag ? <span className="dashboard-badge">{plan.tag}</span> : null}
              <p>{plan.description}</p>
            </div>
            <div className="dashboard-card__price">
              <span dangerouslySetInnerHTML={{ __html: plan.price }} />
              <small>{plan.cadence}</small>
              {isLaunchPromoActive && typeof plan.monthlyPrice === "number" && plan.monthlyPrice > 0 ? (
                <span className="dashboard-badge">launch promo: {LAUNCH_PROMO_PERCENT}% OFF</span>
              ) : null}
            </div>
            <ul>
              {plan.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
            <button className="dashboard-card__action" type="button">{plan.actionLabel}</button>
          </article>
        ))}
      </div>
    </section>
  );
}
