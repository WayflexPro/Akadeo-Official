import { useMemo, useState } from "react";
import { LAUNCH_DISCOUNT, Plan, plans } from "../../content/siteContent";
import { applyLaunchDiscount } from "../../lib/pricing";

type BillingCycle = "monthly" | "annual";

type LimitValue = string | number | boolean | readonly string[] | null;

type LimitRecord = Record<string, LimitValue>;

const formatLimitLabel = (key: string) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\bgb\b/gi, "GB")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();

const formatLimitValue = (value: LimitValue) => {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "boolean") {
    return value ? "Included" : "Not included";
  }
  if (value === null) {
    return "";
  }
  return String(value);
};

const createLimits = (limits?: LimitRecord) => {
  if (!limits) return null;

  return (
    <div className="plan-limits">
      <p className="plan-limits__heading">Plan limits</p>
      <dl className="plan-limits__list">
        {Object.entries(limits).map(([key, value]) => (
          <div key={key}>
            <dt>{formatLimitLabel(key)}</dt>
            <dd>
              {Array.isArray(value) ? (
                <ul className="plan-limits__nested">
                  {value.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                formatLimitValue(value)
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

const planCta = (plan: Plan) => {
  if (plan.id === "enterprise") {
    return { href: "#contact", label: "Contact sales", className: "ghost" } as const;
  }
  if (plan.id === "free") {
    return { href: "#sign-up", label: "Start for free", className: "primary" } as const;
  }
  return { href: "#sign-up", label: "Choose plan", className: "primary" } as const;
};

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  const plansWithPricing = useMemo(() => plans, []);

  return (
    <section className="section pricing-section">
      <div className="container pricing-header">
        <div>
          <p className="eyebrow">Flexible plans</p>
          <h1>Pricing</h1>
          <p className="section-lead">
            Choose the plan that fits your classroom or team. Switch between monthly and annual billing
            anytime.
          </p>
        </div>
        <div className="billing-toggle" role="group" aria-label="Toggle billing period">
          <button
            type="button"
            className="billing-toggle__button"
            data-value="monthly"
            aria-pressed={billing === "monthly"}
            onClick={() => setBilling("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className="billing-toggle__button"
            data-value="annual"
            aria-pressed={billing === "annual"}
            onClick={() => setBilling("annual")}
          >
            Annual
          </button>
        </div>
      </div>

      {LAUNCH_DISCOUNT.active ? (
        <div className="container pricing-promo">
          🎉 LAUNCH PROMO: <strong>{LAUNCH_DISCOUNT.percent}% OFF</strong> all paid plans. Discount applied
          automatically.
        </div>
      ) : null}

      <div className="container pricing-cards">
        {plansWithPricing.map((plan) => {
          const base = billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;
          const discounted = applyLaunchDiscount(base);
          const isPaidPlan = typeof base === "number" && base > 0;
          const cadence = billing === "monthly" ? "/mo" : "/yr";
          const cta = planCta(plan);

          return (
            <article
              key={plan.id}
              className="pricing-card"
              aria-label={plan.id === "starter" ? `${plan.name} plan, most popular` : undefined}
            >
              {plan.badge ? <span className="plan-badge">{plan.badge}</span> : null}
              <h2>{plan.name}</h2>
              <p className="plan-tagline">{plan.tagline}</p>
              <div className="plan-price">
                {base == null ? (
                  <p className="plan-price__value">Contact sales</p>
                ) : (
                  <>
                    <div className="plan-price__row">
                      {LAUNCH_DISCOUNT.active && discounted !== null && isPaidPlan ? (
                        <span className="plan-price__discounted">${discounted.toFixed(2)}</span>
                      ) : null}
                      <span
                        className={
                          LAUNCH_DISCOUNT.active && isPaidPlan
                            ? "plan-price__base"
                            : "plan-price__discounted"
                        }
                      >
                        ${base.toFixed(2)}
                      </span>
                      <span className="plan-price__cadence">{cadence}</span>
                    </div>
                    {LAUNCH_DISCOUNT.active && isPaidPlan ? (
                      <span className="plan-price__badge">{`LAUNCH: ${LAUNCH_DISCOUNT.percent}% OFF`}</span>
                    ) : null}
                  </>
                )}
              </div>
              <ul className="plan-features" aria-label={`${plan.name} features`}>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span className="checkmark" aria-hidden="true">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {createLimits(plan.limits as LimitRecord)}
              <a className={`${cta.className} plan-cta`} href={cta.href} data-nav={plan.id === "enterprise" ? "contact" : "sign-up"}>
                {cta.label}
              </a>
            </article>
          );
        })}
      </div>

      <p className="container pricing-note">
        Add-ons: AI Token Pack (+5,000 gens): $3; Extra storage: $1.99 / 10GB; Extra teacher seat on School:
        $5/mo.
      </p>
    </section>
  );
}
